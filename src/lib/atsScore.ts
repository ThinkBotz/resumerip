import type { RewrittenResume } from "./rewrite.functions";

export type AtsCheck = {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  hint?: string;
};

export type AtsResult = {
  score: number;
  checks: AtsCheck[];
  jdMatch: { matched: string[]; missing: string[]; coverage: number } | null;
};

const STOP = new Set([
  "the","and","for","with","you","your","our","are","will","that","this","from","have",
  "has","not","but","all","any","can","use","using","into","about","over","per","via",
  "etc","or","of","to","in","on","an","a","is","be","as","at","by","we","it","if","do",
  "we'll","you'll","they","them","their","work","working","skills","skill","experience",
  "experiences","role","roles","responsibilities","responsible","ability","strong","good",
  "excellent","plus","preferred","required","requirements","must","should","knowledge",
  "understanding","team","years","year","year's","new","including","such",
]);

export function extractKeywords(text: string, max = 40): string[] {
  if (!text) return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^\w+#./\- ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const counts = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (STOP.has(t)) continue;
    if (/^\d+$/.test(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k);
}

const ACTION_VERBS = [
  "built","shipped","designed","developed","implemented","led","reduced","improved",
  "increased","optimized","automated","launched","created","engineered","architected",
  "migrated","refactored","integrated","deployed","analyzed","delivered","scaled",
];

const FLUFF = [
  "responsible for","hardworking","team player","passionate learner","go-getter",
  "results-driven","dynamic individual","detail-oriented","quick learner",
];

function flatSkills(r: RewrittenResume) {
  return [
    ...r.skills.languages,
    ...r.skills.frameworks,
    ...r.skills.tools,
    ...r.skills.concepts,
  ].map((s) => s.toLowerCase());
}

function allBullets(r: RewrittenResume): string[] {
  return [
    ...r.experience.flatMap((e) => e.bullets),
    ...r.projects.flatMap((p) => p.bullets),
  ];
}

function fullText(r: RewrittenResume): string {
  return [
    r.name,
    r.headline,
    r.summary,
    ...flatSkills(r),
    ...allBullets(r),
    ...r.certifications,
    ...r.achievements,
  ]
    .join(" ")
    .toLowerCase();
}

export function scoreResume(r: RewrittenResume, jd = ""): AtsResult {
  const skills = flatSkills(r);
  const bullets = allBullets(r);
  const text = fullText(r);

  const hasContact =
    !!r.contact.email && !!r.contact.phone;
  const hasLinks =
    !!(r.contact.linkedin || r.contact.github || r.contact.portfolio);
  const hasSummary = (r.summary?.trim().length ?? 0) >= 40;
  const hasSkills = skills.length >= 6;
  const hasExperienceOrProjects =
    r.experience.length > 0 || r.projects.length > 0;
  const hasEducation = r.education.length > 0;

  const verbHits = bullets.filter((b) =>
    ACTION_VERBS.some((v) => b.toLowerCase().startsWith(v) || b.toLowerCase().includes(` ${v} `)),
  ).length;
  const actionVerbsOK = bullets.length === 0 ? false : verbHits / bullets.length >= 0.5;

  const metricsHits = bullets.filter((b) => /\d/.test(b)).length;
  const hasMetrics = bullets.length === 0 ? false : metricsHits / bullets.length >= 0.3;

  const fluffHit = FLUFF.some((f) => text.includes(f));
  const fluffFree = !fluffHit;

  const bulletLengthsOK =
    bullets.length === 0
      ? false
      : bullets.every((b) => b.split(/\s+/).length <= 30);

  let jdMatch: AtsResult["jdMatch"] = null;
  let jdCoverageScore = 0;
  let jdWeight = 0;
  if (jd.trim().length > 20) {
    const kws = extractKeywords(jd, 25);
    const matched = kws.filter((k) => text.includes(k));
    const missing = kws.filter((k) => !text.includes(k));
    const coverage = kws.length ? matched.length / kws.length : 0;
    jdMatch = { matched, missing, coverage };
    jdWeight = 25;
    jdCoverageScore = coverage * jdWeight;
  }

  const checks: AtsCheck[] = [
    { id: "contact", label: "Email + phone present", passed: hasContact, weight: 8 },
    { id: "links", label: "LinkedIn / GitHub / Portfolio link", passed: hasLinks, weight: 5 },
    { id: "summary", label: "Has a summary (≥ 40 chars)", passed: hasSummary, weight: 8 },
    { id: "skills", label: "At least 6 skills listed", passed: hasSkills, weight: 12 },
    { id: "expproj", label: "Has experience or projects", passed: hasExperienceOrProjects, weight: 15 },
    { id: "education", label: "Education added", passed: hasEducation, weight: 7 },
    { id: "verbs", label: "Bullets start with action verbs", passed: actionVerbsOK, weight: 10 },
    { id: "metrics", label: "Bullets include numbers / metrics", passed: hasMetrics, weight: 8 },
    { id: "fluff", label: "No fluff phrases", passed: fluffFree, weight: 5, hint: fluffHit ? "Drop 'responsible for', 'team player', etc." : undefined },
    { id: "length", label: "Bullets ≤ 30 words", passed: bulletLengthsOK, weight: 5 },
  ];

  const baseWeight = checks.reduce((s, c) => s + c.weight, 0);
  const baseScore = checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);

  // Normalize: if no JD, scale base to 100. If JD, base = 75% + jd 25%.
  let score: number;
  if (jdWeight === 0) {
    score = Math.round((baseScore / baseWeight) * 100);
  } else {
    score = Math.round((baseScore / baseWeight) * 75 + jdCoverageScore);
  }
  score = Math.max(0, Math.min(100, score));

  return { score, checks, jdMatch };
}

export type TemplatePreset =
  | "fresher"
  | "internship"
  | "developer"
  | "minimal"
  | "classic"
  | "sidebar-blue"
  | "sidebar-emerald"
  | "sidebar-violet"
  | "band-coral"
  | "band-slate";

export type TemplateLayout = "single" | "sidebar" | "band";

export type TemplateMeta = {
  label: string;
  description: string;
  category: "ATS-safe" | "Graphical";
  layout: TemplateLayout;
  accent: string; // hex color used in preview + PDF
  font?: "Helvetica" | "Times-Roman";
  sectionOrder: string[];
  // For sidebar layout: sections that render in the left sidebar
  sidebarSections?: string[];
};

export const TEMPLATE_PRESETS: Record<TemplatePreset, TemplateMeta> = {
  fresher: {
    label: "Fresher",
    description: "Education first. Best for first job after college.",
    category: "ATS-safe",
    layout: "single",
    accent: "#111111",
    sectionOrder: ["summary", "education", "skills", "projects", "experience", "certifications", "achievements"],
  },
  internship: {
    label: "Internship",
    description: "Skills + projects forward. For internship applications.",
    category: "ATS-safe",
    layout: "single",
    accent: "#111111",
    sectionOrder: ["summary", "skills", "projects", "education", "experience", "certifications", "achievements"],
  },
  developer: {
    label: "Developer",
    description: "Experience + skills first. For 1+ yr roles.",
    category: "ATS-safe",
    layout: "single",
    accent: "#111111",
    sectionOrder: ["summary", "skills", "experience", "projects", "education", "certifications", "achievements"],
  },
  minimal: {
    label: "Minimal",
    description: "Tight, one-page, zero decoration. Pure ATS.",
    category: "ATS-safe",
    layout: "single",
    accent: "#000000",
    sectionOrder: ["summary", "experience", "projects", "skills", "education", "certifications", "achievements"],
  },
  classic: {
    label: "Classic Serif",
    description: "Times-style serif. Banking / consulting friendly.",
    category: "ATS-safe",
    layout: "single",
    accent: "#111111",
    font: "Times-Roman",
    sectionOrder: ["summary", "education", "experience", "projects", "skills", "certifications", "achievements"],
  },
  "sidebar-blue": {
    label: "Sidebar Blue",
    description: "Two-column. Skills + contact in a blue sidebar.",
    category: "Graphical",
    layout: "sidebar",
    accent: "#1e3a8a",
    sectionOrder: ["summary", "experience", "projects", "education", "certifications", "achievements"],
    sidebarSections: ["skills"],
  },
  "sidebar-emerald": {
    label: "Sidebar Emerald",
    description: "Two-column. Calm green sidebar, modern look.",
    category: "Graphical",
    layout: "sidebar",
    accent: "#065f46",
    sectionOrder: ["summary", "experience", "projects", "education", "certifications", "achievements"],
    sidebarSections: ["skills"],
  },
  "sidebar-violet": {
    label: "Sidebar Violet",
    description: "Two-column. Bold violet sidebar for design / product roles.",
    category: "Graphical",
    layout: "sidebar",
    accent: "#5b21b6",
    sectionOrder: ["summary", "experience", "projects", "education", "certifications", "achievements"],
    sidebarSections: ["skills"],
  },
  "band-coral": {
    label: "Header Coral",
    description: "Single column with a coral header band. Friendly, modern.",
    category: "Graphical",
    layout: "band",
    accent: "#c2410c",
    sectionOrder: ["summary", "skills", "experience", "projects", "education", "certifications", "achievements"],
  },
  "band-slate": {
    label: "Header Slate",
    description: "Single column with a slate header band. Clean, corporate.",
    category: "Graphical",
    layout: "band",
    accent: "#1f2937",
    sectionOrder: ["summary", "experience", "projects", "skills", "education", "certifications", "achievements"],
  },
};
