import { Document, Page, Text, View, StyleSheet, pdf, Link } from "@react-pdf/renderer";
import type { RewrittenResume } from "./rewrite.functions";
import { TEMPLATE_PRESETS, type TemplatePreset } from "./atsScore";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111111",
    lineHeight: 1.4,
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  headline: { fontSize: 11, color: "#444444", marginBottom: 4 },
  contactRow: { fontSize: 9, color: "#333333", marginBottom: 10 },
  hr: { borderBottomWidth: 1, borderBottomColor: "#222222", marginBottom: 8 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#888888",
    paddingBottom: 2,
  },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  itemTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  itemSub: { fontSize: 9, color: "#444444" },
  itemDates: { fontSize: 9, color: "#444444" },
  bullet: { flexDirection: "row", marginTop: 2 },
  bulletDot: { width: 10, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 10 },
  skillRow: { flexDirection: "row", marginTop: 2 },
  skillLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, width: 90 },
  skillVals: { flex: 1, fontSize: 10 },
  link: { color: "#0a58ca", textDecoration: "none" },
});

function joinContact(c: RewrittenResume["contact"]) {
  return [c.email, c.phone, c.location].filter(Boolean).join("  |  ");
}

function joinLinks(c: RewrittenResume["contact"]) {
  return [c.linkedin, c.github, c.portfolio].filter(Boolean);
}

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((b, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </>
  );
}

function ResumeDoc({ r, template = "fresher" }: { r: RewrittenResume; template?: TemplatePreset }) {
  const links = joinLinks(r.contact);
  const hasSkills =
    r.skills.languages.length +
      r.skills.frameworks.length +
      r.skills.tools.length +
      r.skills.concepts.length >
    0;
  const order = TEMPLATE_PRESETS[template].sectionOrder;

  const blocks: Record<string, React.ReactNode> = {
    summary: r.summary ? (
      <View key="summary">
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text>{r.summary}</Text>
      </View>
    ) : null,
    skills: hasSkills ? (
      <View key="skills">
        <Text style={styles.sectionTitle}>Skills</Text>
        {r.skills.languages.length > 0 && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Languages:</Text>
            <Text style={styles.skillVals}>{r.skills.languages.join(", ")}</Text>
          </View>
        )}
        {r.skills.frameworks.length > 0 && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Frameworks:</Text>
            <Text style={styles.skillVals}>{r.skills.frameworks.join(", ")}</Text>
          </View>
        )}
        {r.skills.tools.length > 0 && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Tools:</Text>
            <Text style={styles.skillVals}>{r.skills.tools.join(", ")}</Text>
          </View>
        )}
        {r.skills.concepts.length > 0 && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Concepts:</Text>
            <Text style={styles.skillVals}>{r.skills.concepts.join(", ")}</Text>
          </View>
        )}
      </View>
    ) : null,
    experience: r.experience.length > 0 ? (
      <View key="experience">
        <Text style={styles.sectionTitle}>Experience</Text>
        {r.experience.map((e, i) => (
          <View key={i} wrap={false}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemTitle}>
                {e.role}
                {e.company ? ` — ${e.company}` : ""}
              </Text>
              <Text style={styles.itemDates}>{e.dates}</Text>
            </View>
            {e.location ? <Text style={styles.itemSub}>{e.location}</Text> : null}
            <Bullets items={e.bullets} />
          </View>
        ))}
      </View>
    ) : null,
    projects: r.projects.length > 0 ? (
      <View key="projects">
        <Text style={styles.sectionTitle}>Projects</Text>
        {r.projects.map((p, i) => (
          <View key={i} wrap={false}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemTitle}>{p.name}</Text>
              {p.link ? (
                <Link src={p.link} style={[styles.itemDates, styles.link]}>
                  {p.link}
                </Link>
              ) : null}
            </View>
            {p.stack ? <Text style={styles.itemSub}>{p.stack}</Text> : null}
            <Bullets items={p.bullets} />
          </View>
        ))}
      </View>
    ) : null,
    education: r.education.length > 0 ? (
      <View key="education">
        <Text style={styles.sectionTitle}>Education</Text>
        {r.education.map((ed, i) => (
          <View key={i} wrap={false}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemTitle}>{ed.institution}</Text>
              <Text style={styles.itemDates}>{ed.dates}</Text>
            </View>
            <Text style={styles.itemSub}>
              {ed.degree}
              {ed.score ? `  •  ${ed.score}` : ""}
            </Text>
          </View>
        ))}
      </View>
    ) : null,
    certifications: r.certifications.length > 0 ? (
      <View key="certifications">
        <Text style={styles.sectionTitle}>Certifications</Text>
        <Bullets items={r.certifications} />
      </View>
    ) : null,
    achievements: r.achievements.length > 0 ? (
      <View key="achievements">
        <Text style={styles.sectionTitle}>Achievements</Text>
        <Bullets items={r.achievements} />
      </View>
    ) : null,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{r.name || "Your Name"}</Text>
        {r.headline ? <Text style={styles.headline}>{r.headline}</Text> : null}
        <Text style={styles.contactRow}>
          {joinContact(r.contact)}
          {links.length > 0 ? "  |  " : ""}
          {links.map((l, i) => (
            <Text key={i}>
              {i > 0 ? "  |  " : ""}
              <Link src={l} style={styles.link}>
                {l}
              </Link>
            </Text>
          ))}
        </Text>
        <View style={styles.hr} />

        {order.map((id) => blocks[id])}
      </Page>
    </Document>
  );
}

export function resumeToPlainText(r: RewrittenResume): string {
  const lines: string[] = [];
  if (r.name) lines.push(r.name);
  if (r.headline) lines.push(r.headline);
  lines.push(
    [r.contact.email, r.contact.phone, r.contact.location].filter(Boolean).join(" | "),
  );
  const links = [r.contact.linkedin, r.contact.github, r.contact.portfolio].filter(Boolean);
  if (links.length) lines.push(links.join(" | "));
  lines.push("");
  if (r.summary) {
    lines.push("SUMMARY");
    lines.push(r.summary, "");
  }
  const skillParts: string[] = [];
  if (r.skills.languages.length) skillParts.push(`Languages: ${r.skills.languages.join(", ")}`);
  if (r.skills.frameworks.length) skillParts.push(`Frameworks: ${r.skills.frameworks.join(", ")}`);
  if (r.skills.tools.length) skillParts.push(`Tools: ${r.skills.tools.join(", ")}`);
  if (r.skills.concepts.length) skillParts.push(`Concepts: ${r.skills.concepts.join(", ")}`);
  if (skillParts.length) {
    lines.push("SKILLS", ...skillParts, "");
  }
  if (r.experience.length) {
    lines.push("EXPERIENCE");
    for (const e of r.experience) {
      lines.push(`${e.role} — ${e.company} (${e.dates})`);
      if (e.location) lines.push(e.location);
      e.bullets.forEach((b) => lines.push(`  • ${b}`));
      lines.push("");
    }
  }
  if (r.projects.length) {
    lines.push("PROJECTS");
    for (const p of r.projects) {
      lines.push(`${p.name}${p.link ? ` — ${p.link}` : ""}`);
      if (p.stack) lines.push(p.stack);
      p.bullets.forEach((b) => lines.push(`  • ${b}`));
      lines.push("");
    }
  }
  if (r.education.length) {
    lines.push("EDUCATION");
    for (const ed of r.education) {
      lines.push(`${ed.institution} (${ed.dates})`);
      lines.push(`${ed.degree}${ed.score ? `  •  ${ed.score}` : ""}`);
      lines.push("");
    }
  }
  if (r.certifications.length) {
    lines.push("CERTIFICATIONS");
    r.certifications.forEach((c) => lines.push(`  • ${c}`));
    lines.push("");
  }
  if (r.achievements.length) {
    lines.push("ACHIEVEMENTS");
    r.achievements.forEach((a) => lines.push(`  • ${a}`));
    lines.push("");
  }
  return lines.join("\n");
}

export async function downloadResumePdf(
  r: RewrittenResume,
  filename = "resume.pdf",
  template: TemplatePreset = "fresher",
) {
  const blob = await pdf(<ResumeDoc r={r} template={template} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}