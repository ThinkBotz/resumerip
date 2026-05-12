import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Toaster, toast } from "sonner";
import { Skull, Plus, Trash2, ArrowLeft, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RewrittenResume as ResumePreview } from "@/components/RewrittenResume";
import { AdSlot } from "@/components/AdSlot";
import type { RewrittenResume } from "@/lib/rewrite.functions";
import {
  scoreResume,
  extractKeywords,
  TEMPLATE_PRESETS,
  type TemplatePreset,
} from "@/lib/atsScore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/builder")({
  component: BuilderPage,
  head: () => ({
    meta: [
      { title: "Resume Builder — ResumeRIP" },
      {
        name: "description",
        content:
          "Build a clean, ATS-friendly resume from scratch. Free, no signup, instant PDF download. Made for Indian students and freshers.",
      },
      { property: "og:title", content: "Free Resume Builder for Students — ResumeRIP" },
      {
        property: "og:description",
        content: "Fill the form, download a recruiter-ready PDF in seconds.",
      },
    ],
  }),
});

const empty: RewrittenResume = {
  name: "",
  headline: "",
  contact: { email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "" },
  summary: "",
  skills: { languages: [], frameworks: [], tools: [], concepts: [] },
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],
};

const splitCsv = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const splitLines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean);

function BuilderPage() {
  const [r, setR] = useState<RewrittenResume>(empty);
  const [jd, setJd] = useState("");
  const [template, setTemplate] = useState<TemplatePreset>("fresher");

  const ats = useMemo(() => scoreResume(r, jd), [r, jd]);

  const update = <K extends keyof RewrittenResume>(k: K, v: RewrittenResume[K]) =>
    setR((p) => ({ ...p, [k]: v }));

  const updateContact = (k: keyof RewrittenResume["contact"], v: string) =>
    setR((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));

  const updateSkills = (k: keyof RewrittenResume["skills"], v: string) =>
    setR((p) => ({ ...p, skills: { ...p.skills, [k]: splitCsv(v) } }));

  const addExp = () =>
    update("experience", [
      ...r.experience,
      { role: "", company: "", dates: "", location: "", bullets: [] },
    ]);
  const addProj = () =>
    update("projects", [...r.projects, { name: "", stack: "", link: "", bullets: [] }]);
  const addEdu = () =>
    update("education", [...r.education, { institution: "", degree: "", dates: "", score: "" }]);

  const canPreview = r.name.trim().length > 0;

  const tailorToJd = () => {
    if (jd.trim().length < 20) {
      toast.error("Paste a longer job description first.");
      return;
    }
    const kws = extractKeywords(jd, 25);
    const existing = new Set(
      [
        ...r.skills.languages,
        ...r.skills.frameworks,
        ...r.skills.tools,
        ...r.skills.concepts,
      ].map((s) => s.toLowerCase()),
    );
    const missing = kws.filter((k) => !existing.has(k));
    if (missing.length === 0) {
      toast.success("Already covering the JD keywords.");
      return;
    }
    setR((p) => ({
      ...p,
      skills: { ...p.skills, concepts: [...p.skills.concepts, ...missing] },
    }));
    toast.success(`Added ${missing.length} JD keyword${missing.length > 1 ? "s" : ""} to Concepts. Edit as needed.`);
  };

  return (
    <div className="min-h-screen text-foreground">
      <Toaster position="top-center" theme="dark" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Skull className="size-6 text-primary" />
          <span className="font-mono text-lg font-bold tracking-tight">
            Resume<span className="text-primary">RIP</span>
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back to roast
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Resume Builder
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fill in your details. Live preview on the right. Download a clean PDF when done.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Section title="ATS Score (live)">
              <AtsMeter score={ats.score} />
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {ats.checks.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    {c.passed ? (
                      <Check className="size-3 text-success" />
                    ) : (
                      <X className="size-3 text-destructive" />
                    )}
                    <span className={c.passed ? "" : "text-foreground"}>{c.label}</span>
                  </div>
                ))}
              </div>
              {ats.jdMatch && (
                <div className="mt-2 rounded-md border border-border bg-card/40 p-3 text-xs">
                  <p className="mb-1 font-semibold">
                    JD keyword coverage: {Math.round(ats.jdMatch.coverage * 100)}%
                  </p>
                  {ats.jdMatch.missing.length > 0 ? (
                    <p className="text-muted-foreground">
                      Missing: <span className="text-foreground">{ats.jdMatch.missing.slice(0, 12).join(", ")}</span>
                    </p>
                  ) : (
                    <p className="text-success">All top keywords covered.</p>
                  )}
                </div>
              )}
            </Section>

            <Section title="Template">
              {(["ATS-safe", "Graphical"] as const).map((cat) => {
                const items = (Object.keys(TEMPLATE_PRESETS) as TemplatePreset[]).filter(
                  (t) => TEMPLATE_PRESETS[t].category === cat,
                );
                return (
                  <div key={cat} className="mb-3 last:mb-0">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {cat}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {items.map((t) => {
                        const preset = TEMPLATE_PRESETS[t];
                        const active = template === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTemplate(t)}
                            className={cn(
                              "rounded-md border p-3 text-left transition-colors",
                              active
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/40",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block size-3 rounded-sm border border-border"
                                style={{ backgroundColor: preset.accent }}
                              />
                              <p className="text-sm font-semibold">{preset.label}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {preset.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Section>

            <Section
              title="Job Description (optional)"
              action={
                <Button size="sm" variant="outline" onClick={tailorToJd}>
                  <Sparkles className="mr-1 size-3" /> Tailor keywords
                </Button>
              }
            >
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description. We'll score JD keyword coverage and let you auto-add missing ones."
                rows={4}
              />
            </Section>

            <Section title="Basics">
              <Field label="Full name">
                <Input value={r.name} onChange={(e) => update("name", e.target.value)} placeholder="Aman Sharma" />
              </Field>
              <Field label="Headline">
                <Input
                  value={r.headline}
                  onChange={(e) => update("headline", e.target.value)}
                  placeholder="Final-year CSE student | Full-stack developer"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <Input value={r.contact.email} onChange={(e) => updateContact("email", e.target.value)} />
                </Field>
                <Field label="Phone">
                  <Input value={r.contact.phone} onChange={(e) => updateContact("phone", e.target.value)} />
                </Field>
                <Field label="Location">
                  <Input value={r.contact.location} onChange={(e) => updateContact("location", e.target.value)} />
                </Field>
                <Field label="LinkedIn">
                  <Input value={r.contact.linkedin} onChange={(e) => updateContact("linkedin", e.target.value)} />
                </Field>
                <Field label="GitHub">
                  <Input value={r.contact.github} onChange={(e) => updateContact("github", e.target.value)} />
                </Field>
                <Field label="Portfolio">
                  <Input value={r.contact.portfolio} onChange={(e) => updateContact("portfolio", e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Summary">
              <Textarea
                value={r.summary}
                onChange={(e) => update("summary", e.target.value)}
                placeholder="2-3 lines. What you do, what you've shipped, what you want next."
                rows={3}
              />
            </Section>

            <Section title="Skills (comma-separated)">
              <Field label="Languages">
                <Input
                  defaultValue={r.skills.languages.join(", ")}
                  onBlur={(e) => updateSkills("languages", e.target.value)}
                  placeholder="Java, Python, JavaScript"
                />
              </Field>
              <Field label="Frameworks">
                <Input
                  defaultValue={r.skills.frameworks.join(", ")}
                  onBlur={(e) => updateSkills("frameworks", e.target.value)}
                  placeholder="React, Next.js, Node, Express"
                />
              </Field>
              <Field label="Tools">
                <Input
                  defaultValue={r.skills.tools.join(", ")}
                  onBlur={(e) => updateSkills("tools", e.target.value)}
                  placeholder="Git, Docker, Postman, Figma"
                />
              </Field>
              <Field label="Concepts">
                <Input
                  defaultValue={r.skills.concepts.join(", ")}
                  onBlur={(e) => updateSkills("concepts", e.target.value)}
                  placeholder="DSA, OOP, REST APIs, SQL"
                />
              </Field>
              <p className="text-xs text-muted-foreground">Press Tab/click out to apply.</p>
            </Section>

            <Section
              title="Experience"
              action={
                <Button size="sm" variant="outline" onClick={addExp}>
                  <Plus className="mr-1 size-3" /> Add
                </Button>
              }
            >
              {r.experience.map((e, i) => (
                <RepeaterCard
                  key={i}
                  onRemove={() =>
                    update(
                      "experience",
                      r.experience.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Role"
                      value={e.role}
                      onChange={(ev) => {
                        const next = [...r.experience];
                        next[i] = { ...e, role: ev.target.value };
                        update("experience", next);
                      }}
                    />
                    <Input
                      placeholder="Company"
                      value={e.company}
                      onChange={(ev) => {
                        const next = [...r.experience];
                        next[i] = { ...e, company: ev.target.value };
                        update("experience", next);
                      }}
                    />
                    <Input
                      placeholder="Dates (e.g. May 2024 – Jul 2024)"
                      value={e.dates}
                      onChange={(ev) => {
                        const next = [...r.experience];
                        next[i] = { ...e, dates: ev.target.value };
                        update("experience", next);
                      }}
                    />
                    <Input
                      placeholder="Location"
                      value={e.location ?? ""}
                      onChange={(ev) => {
                        const next = [...r.experience];
                        next[i] = { ...e, location: ev.target.value };
                        update("experience", next);
                      }}
                    />
                  </div>
                  <Textarea
                    placeholder="One bullet per line. Did X using Y, achieved Z."
                    rows={3}
                    defaultValue={e.bullets.join("\n")}
                    onBlur={(ev) => {
                      const next = [...r.experience];
                      next[i] = { ...e, bullets: splitLines(ev.target.value) };
                      update("experience", next);
                    }}
                  />
                </RepeaterCard>
              ))}
            </Section>

            <Section
              title="Projects"
              action={
                <Button size="sm" variant="outline" onClick={addProj}>
                  <Plus className="mr-1 size-3" /> Add
                </Button>
              }
            >
              {r.projects.map((p, i) => (
                <RepeaterCard
                  key={i}
                  onRemove={() =>
                    update(
                      "projects",
                      r.projects.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Project name"
                      value={p.name}
                      onChange={(ev) => {
                        const next = [...r.projects];
                        next[i] = { ...p, name: ev.target.value };
                        update("projects", next);
                      }}
                    />
                    <Input
                      placeholder="Link (github / live)"
                      value={p.link ?? ""}
                      onChange={(ev) => {
                        const next = [...r.projects];
                        next[i] = { ...p, link: ev.target.value };
                        update("projects", next);
                      }}
                    />
                  </div>
                  <Input
                    placeholder="Stack (e.g. React, Node, Postgres)"
                    value={p.stack ?? ""}
                    onChange={(ev) => {
                      const next = [...r.projects];
                      next[i] = { ...p, stack: ev.target.value };
                      update("projects", next);
                    }}
                  />
                  <Textarea
                    placeholder="One bullet per line."
                    rows={3}
                    defaultValue={p.bullets.join("\n")}
                    onBlur={(ev) => {
                      const next = [...r.projects];
                      next[i] = { ...p, bullets: splitLines(ev.target.value) };
                      update("projects", next);
                    }}
                  />
                </RepeaterCard>
              ))}
            </Section>

            <Section
              title="Education"
              action={
                <Button size="sm" variant="outline" onClick={addEdu}>
                  <Plus className="mr-1 size-3" /> Add
                </Button>
              }
            >
              {r.education.map((ed, i) => (
                <RepeaterCard
                  key={i}
                  onRemove={() =>
                    update(
                      "education",
                      r.education.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Institution"
                      value={ed.institution}
                      onChange={(ev) => {
                        const next = [...r.education];
                        next[i] = { ...ed, institution: ev.target.value };
                        update("education", next);
                      }}
                    />
                    <Input
                      placeholder="Degree"
                      value={ed.degree}
                      onChange={(ev) => {
                        const next = [...r.education];
                        next[i] = { ...ed, degree: ev.target.value };
                        update("education", next);
                      }}
                    />
                    <Input
                      placeholder="Dates (e.g. 2022 – 2026)"
                      value={ed.dates}
                      onChange={(ev) => {
                        const next = [...r.education];
                        next[i] = { ...ed, dates: ev.target.value };
                        update("education", next);
                      }}
                    />
                    <Input
                      placeholder="CGPA / %"
                      value={ed.score ?? ""}
                      onChange={(ev) => {
                        const next = [...r.education];
                        next[i] = { ...ed, score: ev.target.value };
                        update("education", next);
                      }}
                    />
                  </div>
                </RepeaterCard>
              ))}
            </Section>

            <Section title="Certifications & Achievements">
              <Field label="Certifications (one per line)">
                <Textarea
                  rows={3}
                  defaultValue={r.certifications.join("\n")}
                  onBlur={(e) => update("certifications", splitLines(e.target.value))}
                />
              </Field>
              <Field label="Achievements (one per line)">
                <Textarea
                  rows={3}
                  defaultValue={r.achievements.join("\n")}
                  onBlur={(e) => update("achievements", splitLines(e.target.value))}
                />
              </Field>
            </Section>

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (!canPreview) {
                  toast.error("Add your name first.");
                  return;
                }
                document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Preview & Download PDF
            </Button>
          </div>

          {/* Preview */}
          <div id="preview" className="lg:sticky lg:top-6 lg:self-start">
            {canPreview ? (
              <ResumePreview resume={r} template={template} />
            ) : (
              <Card className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                Start filling the form — your resume preview shows up here.
              </Card>
            )}
          </div>
        </div>

        {/* Single, tasteful ad slot — bottom of page only */}
        <div className="mt-16">
          <AdSlot slot={(import.meta as any).env?.VITE_ADSENSE_SLOT_BUILDER ?? ""} />
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function RepeaterCard({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/40 p-3">
      {children}
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={onRemove}>
          <Trash2 className="mr-1 size-3" /> Remove
        </Button>
      </div>
    </div>
  );
}

function AtsMeter({ score }: { score: number }) {
  const tone =
    score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
  const barTone =
    score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className={cn("text-3xl font-bold", tone)}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100 ATS</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all duration-500", barTone)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}