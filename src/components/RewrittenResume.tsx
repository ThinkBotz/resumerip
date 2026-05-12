import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import type { RewrittenResume as RewrittenResumeType } from "@/lib/rewrite.functions";
import { TEMPLATE_PRESETS, type TemplatePreset } from "@/lib/atsScore";

function resumeToPlainText(r: RewrittenResumeType): string {
  const lines: string[] = [];
  if (r.name) lines.push(r.name);
  if (r.headline) lines.push(r.headline);
  lines.push(
    [r.contact.email, r.contact.phone, r.contact.location].filter(Boolean).join(" | "),
  );
  const links = [r.contact.linkedin, r.contact.github, r.contact.portfolio].filter(Boolean);
  if (links.length) lines.push(links.join(" | "));
  lines.push("");
  if (r.summary) lines.push("SUMMARY", r.summary, "");
  return lines.join("\n");
}

export function RewrittenResume({
  resume,
  template = "fresher",
}: {
  resume: RewrittenResumeType;
  template?: TemplatePreset;
}) {
  const handleDownload = async () => {
    try {
      const filename = `${(resume.name || "resume").replace(/\s+/g, "_")}_ResumeRIP.pdf`;
      const { downloadResumePdf } = await import("@/lib/resumePdf");
      await downloadResumePdf(resume, filename, template);
      toast.success("PDF downloaded. Send it. Get hired. Touch grass.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate PDF. Try again.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeToPlainText(resume));
    toast.success("Plain text copied. Paste into Word/Google Docs.");
  };

  const links = [resume.contact.linkedin, resume.contact.github, resume.contact.portfolio].filter(
    Boolean,
  );

  const meta = TEMPLATE_PRESETS[template];
  const order = meta.sectionOrder;
  const accent = meta.accent;
  const isSerif = meta.font === "Times-Roman";

  const sections: Record<string, React.ReactNode> = {
    summary: resume.summary ? (
      <Section key="summary" title="Summary" accent={accent}>
        <p className="text-sm">{resume.summary}</p>
      </Section>
    ) : null,
    skills:
      (resume.skills.languages.length ||
        resume.skills.frameworks.length ||
        resume.skills.tools.length ||
        resume.skills.concepts.length) > 0 ? (
        <Section key="skills" title="Skills" accent={accent}>
          <SkillRow label="Languages" items={resume.skills.languages} />
          <SkillRow label="Frameworks" items={resume.skills.frameworks} />
          <SkillRow label="Tools" items={resume.skills.tools} />
          <SkillRow label="Concepts" items={resume.skills.concepts} />
        </Section>
      ) : null,
    experience: resume.experience.length > 0 ? (
      <Section key="experience" title="Experience" accent={accent}>
        {resume.experience.map((e, i) => (
          <div key={i} className="mt-2">
            <div className="flex justify-between text-sm">
              <span className="font-bold">
                {e.role}
                {e.company ? ` — ${e.company}` : ""}
              </span>
              <span className="text-neutral-600">{e.dates}</span>
            </div>
            {e.location && <p className="text-xs text-neutral-600">{e.location}</p>}
            <BulletList items={e.bullets} />
          </div>
        ))}
      </Section>
    ) : null,
    projects: resume.projects.length > 0 ? (
      <Section key="projects" title="Projects" accent={accent}>
        {resume.projects.map((p, i) => (
          <div key={i} className="mt-2">
            <div className="flex justify-between text-sm">
              <span className="font-bold">{p.name}</span>
              {p.link && <span style={{ color: accent }}>{p.link}</span>}
            </div>
            {p.stack && <p className="text-xs text-neutral-600">{p.stack}</p>}
            <BulletList items={p.bullets} />
          </div>
        ))}
      </Section>
    ) : null,
    education: resume.education.length > 0 ? (
      <Section key="education" title="Education" accent={accent}>
        {resume.education.map((ed, i) => (
          <div key={i} className="mt-2 text-sm">
            <div className="flex justify-between">
              <span className="font-bold">{ed.institution}</span>
              <span className="text-neutral-600">{ed.dates}</span>
            </div>
            <p className="text-xs text-neutral-700">
              {ed.degree}
              {ed.score ? `  •  ${ed.score}` : ""}
            </p>
          </div>
        ))}
      </Section>
    ) : null,
    certifications: resume.certifications.length > 0 ? (
      <Section key="certifications" title="Certifications" accent={accent}>
        <BulletList items={resume.certifications} />
      </Section>
    ) : null,
    achievements: resume.achievements.length > 0 ? (
      <Section key="achievements" title="Achievements" accent={accent}>
        <BulletList items={resume.achievements} />
      </Section>
    ) : null,
  };

  const customSectionNodes = (resume.customSections ?? [])
    .filter((s) => s.title.trim() || s.fields.length || s.bullets.length)
    .map((s) => (
      <Section key={s.id} title={s.title || "Section"} accent={accent}>
        {s.fields.length > 0 && (
          <div className="space-y-1">
            {s.fields.map((f, i) => (
              <p key={i} className="text-sm">
                {f.label && <span className="font-bold">{f.label}: </span>}
                {f.value}
              </p>
            ))}
          </div>
        )}
        <BulletList items={s.bullets} />
      </Section>
    ));

  const contactLine = [resume.contact.email, resume.contact.phone, resume.contact.location]
    .filter(Boolean)
    .join("  |  ");

  return (
    <Card className="overflow-hidden border-success/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-6 py-3">
        <p className="text-sm font-semibold text-success">Your resume — {meta.label}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-2 size-4" /> Copy text
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-2 size-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div
        className={`bg-white text-neutral-900 ${isSerif ? "font-serif" : ""}`}
        style={{ fontFamily: isSerif ? "Georgia, 'Times New Roman', serif" : undefined }}
      >
        {meta.layout === "sidebar" ? (
          <div className="grid" style={{ gridTemplateColumns: "34% 66%" }}>
            <aside className="p-6 text-white" style={{ backgroundColor: accent }}>
              <h2 className="text-xl font-bold leading-tight">{resume.name || "Your Name"}</h2>
              {resume.headline && (
                <p className="mt-1 text-xs opacity-90">{resume.headline}</p>
              )}
              <div className="mt-4 space-y-1 text-xs">
                {resume.contact.email && <p>{resume.contact.email}</p>}
                {resume.contact.phone && <p>{resume.contact.phone}</p>}
                {resume.contact.location && <p>{resume.contact.location}</p>}
                {links.map((l, i) => (
                  <p key={i} className="break-all">{l}</p>
                ))}
              </div>
              {(meta.sidebarSections ?? []).includes("skills") && (
                <div className="mt-5">
                  <h3 className="border-b border-white/40 pb-1 text-[10px] font-bold uppercase tracking-widest">
                    Skills
                  </h3>
                  <div className="mt-2 space-y-2 text-xs">
                    <SkillStack label="Languages" items={resume.skills.languages} />
                    <SkillStack label="Frameworks" items={resume.skills.frameworks} />
                    <SkillStack label="Tools" items={resume.skills.tools} />
                    <SkillStack label="Concepts" items={resume.skills.concepts} />
                  </div>
                </div>
              )}
            </aside>
            <div className="p-6">
              {order
                .filter((id) => !(meta.sidebarSections ?? []).includes(id))
                .map((id) => sections[id])}
              {customSectionNodes}
            </div>
          </div>
        ) : meta.layout === "band" ? (
          <div>
            <div className="px-8 py-6 text-white" style={{ backgroundColor: accent }}>
              <h2 className="text-2xl font-bold">{resume.name || "Your Name"}</h2>
              {resume.headline && <p className="text-sm opacity-90">{resume.headline}</p>}
              <p className="mt-2 text-xs opacity-90">{contactLine}</p>
              {links.length > 0 && (
                <p className="mt-1 text-xs opacity-90">{links.join("  |  ")}</p>
              )}
            </div>
            <div className="p-8">
              {order.map((id) => sections[id])}
              {customSectionNodes}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <h2 className="text-2xl font-bold" style={{ color: accent }}>
              {resume.name || "Your Name"}
            </h2>
            {resume.headline && (
              <p className="text-sm text-neutral-600">{resume.headline}</p>
            )}
            <p className="mt-1 text-xs text-neutral-700">{contactLine}</p>
            {links.length > 0 && (
              <p className="mt-1 text-xs" style={{ color: accent }}>
                {links.join("  |  ")}
              </p>
            )}
            <hr className="my-3" style={{ borderColor: accent }} />
            {order.map((id) => sections[id])}
            {customSectionNodes}
          </div>
        )}
      </div>
    </Card>
  );
}

function Section({
  title,
  children,
  accent = "#111",
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="mt-4">
      <h3
        className="pb-1 text-xs font-bold uppercase tracking-widest"
        style={{ color: accent, borderBottom: `1px solid ${accent}` }}
      >
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SkillStack({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-xs">{items.join(", ")}</p>
    </div>
  );
}

function SkillRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <p className="text-sm">
      <span className="font-bold">{label}: </span>
      {items.join(", ")}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-1 list-disc pl-5 text-sm">
      {items.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}