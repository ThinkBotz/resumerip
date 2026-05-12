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

const analysisTool = {
  type: "function" as const,
  function: {
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
          additionalProperties: false,
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
            additionalProperties: false,
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
            additionalProperties: false,
          },
        },
      },
      required: ["scores", "verdict", "strengths", "red_flags", "roast", "fixes", "keywords_missing", "recruiters"],
      additionalProperties: false,
    },
  },
};

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI service not configured." };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this resume thoroughly. Be specific. Roast hard.\n\n--- RESUME START ---\n${data.resumeText}\n--- RESUME END ---`,
          },
        ],
        tools: [analysisTool],
        tool_choice: { type: "function", function: { name: "submit_resume_analysis" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { ok: false as const, error: "Too many requests. Try again in a moment." };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Add credits in Workspace > Usage." };
      const txt = await res.text();
      console.error("AI gateway error:", res.status, txt);
      return { ok: false as const, error: "AI service error. Try again." };
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return { ok: false as const, error: "AI returned no analysis. Try again." };
    }

    try {
      const parsed = JSON.parse(call.function.arguments);
      return { ok: true as const, analysis: parsed };
    } catch (e) {
      console.error("Parse error:", e);
      return { ok: false as const, error: "Could not parse analysis." };
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