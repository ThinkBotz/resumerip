import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const personalizationSchema = z.object({
  targetRole: z.string().optional(),
  preferredTone: z.string().optional(),
  githubUsername: z.string().optional(),
  notes: z.string().optional(),
});

const inputSchema = z.object({
  resumeText: z.string().min(50).max(40000),
  redFlags: z.array(z.string()).optional(),
  keywordsMissing: z.array(z.string()).optional(),
  useFeedback: z.boolean().optional(),
  personalization: personalizationSchema.optional(),
});

const SYSTEM_PROMPT = `You are ResumeRIP's elite resume rebuilder — top Indian tech recruiter + ATS expert combined.
Your job: Transform a messy resume into a RECRUITER-WINNING, ATS-PERFECT version that gets shortlisted.

You ALWAYS respond ONLY by calling 'submit_rewritten_resume'. Never plain text.

━━━ ABSOLUTE RULES (BREAK = FAIL) ━━━
1. DO NOT fabricate: No invented companies, roles, dates, degrees, CGPA, links, or metrics.
2. KEEP FACTUAL DATA EXACTLY: Names, dates, institutions, scores — zero changes.
3. RUTHLESSLY REWRITE everything else for impact:
   - Weak/irrelevant bullets → DELETE or STRENGTHEN with action verbs + metrics.
   - Irrelevant certifications → REMOVE (Excel, Udemy fluff).
   - Duplicate roles/entries → CONSOLIDATE.
   - Vague achievements → MAKE CONCRETE with deliverables.

━━━ BULLET STYLE: Power Verb + Impact ━━━
Format: "[Power Verb] [Object] using [Tech], [Quantified Impact]."
Examples:
- ❌ "Responsible for building a website" → ✅ "Designed and shipped React platform serving 10K+ users, 40% faster checkout."
- ❌ "Participated in hackathon" → ✅ "Won Smart India Hackathon 2024: Built AI debris tracker, deployed on Firebase."
- ❌ "Worked with databases" → ✅ "Architected Node.js API handling 5K req/sec, 60% query optimization via caching."

Metrics (if available in original ONLY):
- Users/Traffic: 10K+ users, 100K+ API calls/day, 500GB+ data processed
- Performance: 40% faster, 60% reduction, 3x improvement
- Business: Revenue, cost savings, user retention increase
- Shipping: Deployed, launched (past tense)

If NO metrics available → omit them. NEVER fabricate numbers.

━━━ CONTENT TRANSFORMATION ━━━
Summary: 2-3 lines ONLY (~40-50 words). Specific, punchy, no buzzwords.
Remove immediately:
  - "Passionate", "Hard-working", "Results-oriented", "Self-motivated", "Team player", "Problem-solver"
  - Generic participation certificates (Excel, Google courses)
  - Future-dated achievements
  - Duplicate entries
Keep only:
  - Role-specific titles, tech stacks, quantified outcomes
  - Real certs showing expertise (AWS, TensorFlow, etc)
Bullets: 4-5 per role. Quality over quantity. Delete filler.
Skills: Organized by category (Languages, Frameworks, Tools, Concepts). Match used tech only.
Education: Degree | Institute | Year | CGPA (if >7.5).

━━━ ATS OPTIMIZATION ━━━
- Plain ASCII text only. No columns, tables, unicode, emojis.
- Natural keyword integration from original resume.
- Standard sections: Summary | Contact | Skills | Experience | Projects | Education | Certifications.
- Single space between sections.

━━━ FINAL QUALITY CHECK ━━━
- Skimmable in 6 seconds → highlights top 3 projects/roles.
- Reads like a builder, not a student listing tasks.
- Every bullet earns its place (no fluff, all value).
- Structured for recruiter and ATS scanning.
`;

const rewriteFunctionDef = {
  name: "submit_rewritten_resume",
  description: "Submit the rewritten ATS-friendly resume.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      headline: { type: "string", description: "Short tagline e.g. 'Final-year CSE student | Full-stack developer'" },
      contact: {
        type: "object",
        properties: {
          email: { type: "string" },
          phone: { type: "string" },
          location: { type: "string" },
          linkedin: { type: "string" },
          github: { type: "string" },
          portfolio: { type: "string" },
        },
        required: ["email", "phone", "location", "linkedin", "github", "portfolio"],
      },
      summary: { type: "string" },
      skills: {
        type: "object",
        properties: {
          languages: { type: "array", items: { type: "string" } },
          frameworks: { type: "array", items: { type: "string" } },
          tools: { type: "array", items: { type: "string" } },
          concepts: { type: "array", items: { type: "string" } },
        },
        required: ["languages", "frameworks", "tools", "concepts"],
      },
      experience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company: { type: "string" },
            role: { type: "string" },
            dates: { type: "string" },
            location: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
          },
          required: ["company", "role", "dates", "location", "bullets"],
        },
      },
      projects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            stack: { type: "string" },
            link: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
          },
          required: ["name", "stack", "link", "bullets"],
        },
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            institution: { type: "string" },
            degree: { type: "string" },
            dates: { type: "string" },
            score: { type: "string" },
          },
          required: ["institution", "degree", "dates", "score"],
        },
      },
      certifications: { type: "array", items: { type: "string" } },
      achievements: { type: "array", items: { type: "string" } },
    },
    required: [
      "name", "headline", "contact", "summary", "skills",
      "experience", "projects", "education", "certifications", "achievements",
    ],
  },
};

// Load API keys (support both single and multiple)
function getApiKeys(): string[] {
  const multiKeys = process.env.GOOGLE_GENERATIVE_AI_API_KEYS;
  const singleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (multiKeys) {
    return multiKeys.split(",").map(k => k.trim()).filter(Boolean);
  }
  if (singleKey) {
    return [singleKey];
  }
  return [];
}

// Time-based key tracking for efficient distribution
interface KeyTracker {
  key: string;
  lastUsedAt: number;
  dailyUsageCount: number;
  lastResetDate: string;
}

let keyTrackers: KeyTracker[] = [];

function initializeKeyTrackers(keys: string[]): void {
  const today = new Date().toISOString().split('T')[0];
  keyTrackers = keys.map(key => ({
    key,
    lastUsedAt: 0,
    dailyUsageCount: 0,
    lastResetDate: today,
  }));
}

function getNextApiKey(keys: string[]): string {
  if (keys.length === 0) throw new Error("No API keys configured");
  
  // Initialize on first call
  if (keyTrackers.length === 0) {
    initializeKeyTrackers(keys);
  }

  const today = new Date().toISOString().split('T')[0];

  // Reset daily counts if date changed
  for (const tracker of keyTrackers) {
    if (tracker.lastResetDate !== today) {
      tracker.dailyUsageCount = 0;
      tracker.lastResetDate = today;
    }
  }

  // Select key with oldest usage (natural spacing prevents rate limits)
  const selectedTracker = keyTrackers.reduce((oldest, current) =>
    current.lastUsedAt < oldest.lastUsedAt ? current : oldest
  );

  // Update tracking
  selectedTracker.lastUsedAt = Date.now();
  selectedTracker.dailyUsageCount++;

  // Log for monitoring
  const usage = keyTrackers.map((t, i) => `key${i + 1}:${t.dailyUsageCount}`).join(' | ');
  console.log(`[Gemini API] Selected key (${selectedTracker.key.slice(0, 10)}...) | Daily usage: ${usage}`);

  return selectedTracker.key;
}

export const rewriteResume = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const keys = getApiKeys();
    if (keys.length === 0) {
      return { ok: false as const, error: "Gemini API key not configured. Set GOOGLE_GENERATIVE_AI_API_KEY." };
    }

    const apiKey = getNextApiKey(keys);

    // Build feedback context if provided
    let feedbackContext = "";
    if (data.useFeedback) {
      const parts = [];
      if (data.redFlags?.length) {
        parts.push(`ISSUES FOUND:\n${data.redFlags.map((f) => `- ${f}`).join("\n")}`);
      }
      if (data.keywordsMissing?.length) {
        parts.push(`MISSING KEYWORDS TO ADD:\n${data.keywordsMissing.slice(0, 12).join(", ")}`);
      }
      if (parts.length > 0) {
        feedbackContext = `\n\n━━━ ANALYSIS FEEDBACK (USE THIS TO IMPROVE) ━━━\n${parts.join("\n\n")}`;
      }
    }

    let personalizationContext = "";
    if (data.personalization) {
      const bits = [
        data.personalization.targetRole ? `Target role: ${data.personalization.targetRole}` : "",
        data.personalization.preferredTone ? `Preferred tone: ${data.personalization.preferredTone}` : "",
        data.personalization.githubUsername ? `GitHub username: ${data.personalization.githubUsername}` : "",
        data.personalization.notes ? `Notes: ${data.personalization.notes}` : "",
      ].filter(Boolean);

      if (bits.length > 0) {
        personalizationContext = `\n\n━━━ PERSONALIZATION CONTEXT (USE TO TAILOR THE REWRITE) ━━━\n${bits.map((bit) => `- ${bit}`).join("\n")}`;
      }
    }

    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              parts: [
                {
                  text: `Rewrite this resume into a clean, ATS-friendly version. Keep all facts; strengthen the wording.${feedbackContext}${personalizationContext}\n\nIf personalization context is present, use it to emphasize the target role and preferred tone. Do not invent experience or skills that are not in the resume.\n\n--- RESUME START ---\n${data.resumeText}\n--- RESUME END ---`,
                },
              ],
            },
          ],
          tools: [
            {
              functionDeclarations: [rewriteFunctionDef],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY",
              allowedFunctionNames: ["submit_rewritten_resume"],
            },
          },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Gemini API error (rewrite):", res.status, txt);
        if (res.status === 429) {
          return { ok: false as const, error: "Rate limited. Try again in a moment." };
        }
        return { ok: false as const, error: "Gemini API error. Try again." };
      }

      const json = await res.json();
      
      // Check for malformed function call
      const finishReason = json.candidates?.[0]?.finishReason;
      if (finishReason === 'MALFORMED_FUNCTION_CALL') {
        console.error("Gemini generated malformed function call. Retrying...", json);
        return { ok: false as const, error: "Rewrite format error. Try again." };
      }
      
      const functionCall = json.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);

      if (!functionCall?.functionCall?.args) {
        console.error("No function call in response:", json);
        return { ok: false as const, error: "Gemini returned no rewrite. Try again." };
      }

      try {
        const parsed = functionCall.functionCall.args;
        return { ok: true as const, resume: parsed };
      } catch (e) {
        console.error("Parse error (rewrite):", e);
        return { ok: false as const, error: "Could not parse rewrite." };
      }
    } catch (error) {
      console.error("Request error:", error);
      return { ok: false as const, error: "Network error. Try again." };
    }
  });

export type RewrittenResume = {
  name: string;
  headline: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
  summary: string;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    concepts: string[];
  };
  experience: {
    company: string;
    role: string;
    dates: string;
    location: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    stack: string;
    link: string;
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    dates: string;
    score: string;
  }[];
  certifications: string[];
  achievements: string[];
  customSections?: CustomSection[];
};

export type CustomSectionField = { label: string; value: string };
export type CustomSection = {
  id: string;
  title: string;
  fields: CustomSectionField[];
  bullets: string[];
};
