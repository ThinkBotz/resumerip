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

const rewriteTool = {
  type: "function" as const,
  function: {
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
          additionalProperties: false,
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
          additionalProperties: false,
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
            additionalProperties: false,
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
            additionalProperties: false,
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
            additionalProperties: false,
          },
        },
        certifications: { type: "array", items: { type: "string" } },
        achievements: { type: "array", items: { type: "string" } },
      },
      required: [
        "name", "headline", "contact", "summary", "skills",
        "experience", "projects", "education", "certifications", "achievements",
      ],
      additionalProperties: false,
    },
  },
};

export const rewriteResume = createServerFn({ method: "POST" })
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
            content: `Rewrite this resume into a clean, ATS-friendly version. Keep all facts; strengthen the wording.\n\n--- RESUME START ---\n${data.resumeText}\n--- RESUME END ---`,
          },
        ],
        tools: [rewriteTool],
        tool_choice: { type: "function", function: { name: "submit_rewritten_resume" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { ok: false as const, error: "Too many requests. Try again in a moment." };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Add credits in Workspace > Usage." };
      const txt = await res.text();
      console.error("AI gateway error (rewrite):", res.status, txt);
      return { ok: false as const, error: "AI service error. Try again." };
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return { ok: false as const, error: "AI returned no rewrite. Try again." };
    }

    try {
      const parsed = JSON.parse(call.function.arguments);
      return { ok: true as const, resume: parsed };
    } catch (e) {
      console.error("Parse error (rewrite):", e);
      return { ok: false as const, error: "Could not parse rewrite." };
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
};