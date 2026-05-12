import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import type { RewrittenResume as RewrittenResumeType } from "@/lib/rewrite.functions";

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

export function RewrittenResume({ resume }: { resume: RewrittenResumeType }) {
  const handleDownload = async () => {
    try {
      const filename = `${(resume.name || "resume").replace(/\s+/g, "_")}_ResumeRIP.pdf`;
      const { downloadResumePdf } = await import("@/lib/resumePdf");
      await downloadResumePdf(resume, filename);
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

  return (
    <Card className="overflow-hidden border-success/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-6 py-3">
        <p className="text-sm font-semibold text-success">Your rewritten resume</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-2 size-4" /> Copy text
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-2 size-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Document preview — light theme inside */}
      <div className="bg-white p-8 text-neutral-900">
        <h2 className="text-2xl font-bold">{resume.name || "Your Name"}</h2>
        {resume.headline && (
          <p className="text-sm text-neutral-600">{resume.headline}</p>
        )}
        <p className="mt-1 text-xs text-neutral-700">
          {[resume.contact.email, resume.contact.phone, resume.contact.location]
            .filter(Boolean)
            .join("  |  ")}
        </p>
        {links.length > 0 && (
          <p className="mt-1 text-xs text-blue-700">{links.join("  |  ")}</p>
        )}
        <hr className="my-3 border-neutral-300" />

        {resume.summary && (
          <Section title="Summary">
            <p className="text-sm">{resume.summary}</p>
          </Section>
        )}

        {(resume.skills.languages.length ||
          resume.skills.frameworks.length ||
          resume.skills.tools.length ||
          resume.skills.concepts.length) > 0 && (
          <Section title="Skills">
            <SkillRow label="Languages" items={resume.skills.languages} />
            <SkillRow label="Frameworks" items={resume.skills.frameworks} />
            <SkillRow label="Tools" items={resume.skills.tools} />
            <SkillRow label="Concepts" items={resume.skills.concepts} />
          </Section>
        )}

        {resume.experience.length > 0 && (
          <Section title="Experience">
            {resume.experience.map((e, i) => (
              <div key={i} className="mt-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">
                    {e.role}
                    {e.company ? ` — ${e.company}` : ""}
                  </span>
                  <span className="text-neutral-600">{e.dates}</span>
                </div>
                {e.location && (
                  <p className="text-xs text-neutral-600">{e.location}</p>
                )}
                <BulletList items={e.bullets} />
              </div>
            ))}
          </Section>
        )}

        {resume.projects.length > 0 && (
          <Section title="Projects">
            {resume.projects.map((p, i) => (
              <div key={i} className="mt-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{p.name}</span>
                  {p.link && <span className="text-blue-700">{p.link}</span>}
                </div>
                {p.stack && <p className="text-xs text-neutral-600">{p.stack}</p>}
                <BulletList items={p.bullets} />
              </div>
            ))}
          </Section>
        )}

        {resume.education.length > 0 && (
          <Section title="Education">
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
        )}

        {resume.certifications.length > 0 && (
          <Section title="Certifications">
            <BulletList items={resume.certifications} />
          </Section>
        )}

        {resume.achievements.length > 0 && (
          <Section title="Achievements">
            <BulletList items={resume.achievements} />
          </Section>
        )}
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="border-b border-neutral-400 pb-1 text-xs font-bold uppercase tracking-widest text-neutral-800">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
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