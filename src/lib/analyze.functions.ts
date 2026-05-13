import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  resumeText: z.string().min(50).max(40000),
});

const SYSTEM_PROMPT = `You are ResumeRIP — a brutally honest, witty Indian tech recruiter and ATS expert.
You analyze resumes from Indian engineering students, freshers, and job-seekers.
You understand the chaos: Tier-2/3 colleges, mass placements, copy-pasted YouTube templates, "hardworking and passionate learner" objectives, irrelevant certifications, fake projects.

You always respond ONLY by calling the provided tool 'submit_resume_analysis'. Never reply in plain text.

Style rules for the roast:
- Funny, savage, but never mean about caste, religion, gender, or appearance.
- Reference specific lines from the resume — don't be generic.
- Use Hinglish sparingly when it lands. Examples: "bhai", "yaar", "scene", "moye moye".
- Each roast line must hit one real, specific weakness.

Recruiter personalities to simulate (write in their voice):
- TCS HR: process-obsessed, asks about percentages, certifications, willingness to relocate.
- Startup Founder: wants real shipping, hates buzzwords, asks "what did YOU build".
- FAANG Recruiter: cares about DSA, scale, system design, top projects.
- Toxic HR: passive-aggressive, "we'll get back to you", obsessed with gaps.
- Government Recruiter: bureaucratic, formal, focused on attestation and format.

Be specific, concrete, and actionable. Scores are 0-100 integers.`;

const analysisFunctionDef = {
  name: "submit_resume_analysis",
  description: "Submit the complete resume analysis.",
  parameters: {
    type: "object",
    properties: {
      scores: {
        type: "object",
        properties: {
          ats: { type: "integer", minimum: 0, maximum: 100 },
          recruiter: { type: "integer", minimum: 0, maximum: 100 },
          fresher: { type: "integer", minimum: 0, maximum: 100 },
          overall: { type: "integer", minimum: 0, maximum: 100 },
        },
        required: ["ats", "recruiter", "fresher", "overall"],
      },
      verdict: {
        type: "string",
        description: "One savage one-liner verdict on the resume. Max 140 chars.",
      },
      strengths: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
      },
      red_flags: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 8,
        description: "Specific issues found in the resume. Be concrete.",
      },
      roast: {
        type: "array",
        items: { type: "string" },
        minItems: 5,
        maxItems: 10,
        description: "Savage but funny roast lines. Each references something specific.",
      },
      fixes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            section: { type: "string" },
            before: { type: "string" },
            after: { type: "string" },
            why: { type: "string" },
          },
          required: ["section", "before", "after", "why"],
        },
        minItems: 3,
        maxItems: 8,
      },
      keywords_missing: {
        type: "array",
        items: { type: "string" },
        maxItems: 15,
      },
      recruiters: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            persona: {
              type: "string",
              enum: ["TCS HR", "Startup Founder", "FAANG Recruiter", "Toxic HR", "Government Recruiter"],
            },
            reaction: { type: "string", description: "What they say in their voice. 2-3 sentences." },
            shortlist_chance: { type: "integer", minimum: 0, maximum: 100 },
            rejection_reason: { type: "string" },
          },
          required: ["persona", "reaction", "shortlist_chance", "rejection_reason"],
        },
      },
    },
    required: ["scores", "verdict", "strengths", "red_flags", "roast", "fixes", "keywords_missing", "recruiters"],
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

export const analyzeResume = createServerFn({ method: "POST" })
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
                  text: `Analyze this resume thoroughly. Be specific. Roast hard.\n\n--- RESUME START ---\n${data.resumeText}\n--- RESUME END ---`,
                },
              ],
            },
          ],
          tools: [
            {
              functionDeclarations: [analysisFunctionDef],
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
        console.error("Gemini API error:", res.status, txt);
        if (res.status === 429) {
          return { ok: false as const, error: "Rate limited. Try again in a moment." };
        }
        return { ok: false as const, error: "Gemini API error. Try again." };
      }

      const json = await res.json();
      const functionCall = json.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);

      if (!functionCall?.functionCall?.args) {
        console.error("No function call in response:", json);
        return { ok: false as const, error: "Gemini returned no analysis. Try again." };
      }

      try {
        const parsed = functionCall.functionCall.args;
        return { ok: true as const, analysis: parsed };
      } catch (e) {
        console.error("Parse error:", e);
        return { ok: false as const, error: "Could not parse analysis." };
      }
    } catch (error) {
      console.error("Request error:", error);
      return { ok: false as const, error: "Network error. Try again." };
    }
  });

export type ResumeAnalysis = {
  scores: { ats: number; recruiter: number; fresher: number; overall: number };
  verdict: string;
  strengths: string[];
  red_flags: string[];
  roast: string[];
  fixes: { section: string; before: string; after: string; why: string }[];
  keywords_missing: string[];
  recruiters: {
    persona: string;
    reaction: string;
    shortlist_chance: number;
    rejection_reason: string;
  }[];
};
