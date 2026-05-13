import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  resumeText: z.string().min(50).max(40000),
});

const SYSTEM_PROMPT = `You are ResumeRIP's resume rebuilder — a top-tier Indian tech resume writer.
You take a messy, fluffy, or weak resume and rewrite it into a clean, ATS-friendly, recruiter-pleasing version.

You ALWAYS respond ONLY by calling the provided tool 'submit_rewritten_resume'. Never plain text.

RULES — non-negotiable:
- Do NOT invent companies, roles, dates, degrees, scores, links, or achievements that aren't in the original.
- Keep all factual data (names, dates, companies, college, CGPA) exactly as-is.
- You MAY rewrite bullets, summary, and section structure for clarity, impact, and ATS keywords.
- Use the XYZ formula in bullets: "Did X using Y, achieving Z (with metrics if available in the original; otherwise omit metrics — DO NOT fabricate numbers)."
- Strong action verbs (Built, Shipped, Reduced, Automated, Designed, Led). No "responsible for", no "hardworking team player", no "passionate learner".
- Plain ASCII. No emojis. No tables. No multi-column layouts. ATS-safe.
- Tailor for Indian fresher / early-career tech roles by default.
- Keep summary 2-3 lines, max ~50 words.
- Categorize skills sensibly (Languages, Frameworks/Libraries, Tools, Concepts).
- If a section has no data in the original, return an empty array — don't make stuff up.`;

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
                  text: `Rewrite this resume into a clean, ATS-friendly version. Keep all facts; strengthen the wording.\n\n--- RESUME START ---\n${data.resumeText}\n--- RESUME END ---`,
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
              mode: "AUTO",
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
