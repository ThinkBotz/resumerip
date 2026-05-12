import { Document, Page, Text, View, StyleSheet, pdf, Link } from "@react-pdf/renderer";
import type { RewrittenResume } from "./rewrite.functions";
import { TEMPLATE_PRESETS, type TemplatePreset, type TemplateMeta } from "./atsScore";

function makeStyles(meta: TemplateMeta) {
  const baseFont = meta.font === "Times-Roman" ? "Times-Roman" : "Helvetica";
  const boldFont = meta.font === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold";
  const accent = meta.accent;
  return {
    baseFont,
    boldFont,
    accent,
    s: StyleSheet.create({
      page: {
        paddingTop: meta.layout === "band" ? 0 : 36,
        paddingBottom: 36,
        paddingHorizontal: meta.layout === "sidebar" ? 0 : meta.layout === "band" ? 0 : 40,
        fontSize: 10,
        fontFamily: baseFont,
        color: "#111111",
        lineHeight: 1.4,
      },
      name: { fontSize: 20, fontFamily: boldFont, marginBottom: 2 },
      headline: { fontSize: 11, color: "#444444", marginBottom: 4 },
      contactRow: { fontSize: 9, color: "#333333", marginBottom: 10 },
      hr: { borderBottomWidth: 1, borderBottomColor: accent, marginBottom: 8 },
      sectionTitle: {
        fontSize: 11,
        fontFamily: boldFont,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 10,
        marginBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: accent,
        paddingBottom: 2,
        color: accent,
      },
      itemHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
      itemTitle: { fontFamily: boldFont, fontSize: 10 },
      itemSub: { fontSize: 9, color: "#444444" },
      itemDates: { fontSize: 9, color: "#444444" },
      bullet: { flexDirection: "row", marginTop: 2 },
      bulletDot: { width: 10, fontSize: 10 },
      bulletText: { flex: 1, fontSize: 10 },
      skillRow: { flexDirection: "row", marginTop: 2 },
      skillLabel: { fontFamily: boldFont, fontSize: 10, width: 90 },
      skillVals: { flex: 1, fontSize: 10 },
      link: { color: accent, textDecoration: "none" },
      // Sidebar layout
      sidebarRow: { flexDirection: "row", minHeight: "100%" },
      sidebar: {
        width: "34%",
        backgroundColor: accent,
        color: "#ffffff",
        padding: 18,
      },
      sidebarName: { fontSize: 16, fontFamily: boldFont, color: "#ffffff" },
      sidebarHeadline: { fontSize: 9, color: "#ffffff", opacity: 0.9, marginTop: 2 },
      sidebarBlockTitle: {
        fontSize: 9,
        fontFamily: boldFont,
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: 1,
        borderBottomWidth: 0.5,
        borderBottomColor: "#ffffff",
        paddingBottom: 2,
        marginTop: 14,
        marginBottom: 4,
      },
      sidebarText: { fontSize: 9, color: "#ffffff", marginTop: 2 },
      sidebarSubLabel: {
        fontSize: 8,
        fontFamily: boldFont,
        color: "#ffffff",
        opacity: 0.85,
        marginTop: 4,
        textTransform: "uppercase",
      },
      mainCol: { width: "66%", padding: 22 },
      // Band layout
      band: { backgroundColor: accent, paddingHorizontal: 36, paddingVertical: 22 },
      bandName: { fontSize: 22, fontFamily: boldFont, color: "#ffffff" },
      bandHeadline: { fontSize: 11, color: "#ffffff", opacity: 0.9, marginTop: 2 },
      bandContact: { fontSize: 9, color: "#ffffff", opacity: 0.9, marginTop: 6 },
      bandBody: { padding: 36 },
    }),
  };
}

function joinContact(c: RewrittenResume["contact"]) {
  return [c.email, c.phone, c.location].filter(Boolean).join("  |  ");
}

function joinLinks(c: RewrittenResume["contact"]) {
  return [c.linkedin, c.github, c.portfolio].filter(Boolean);
}

function Bullets({ items, s }: { items: string[]; s: any }) {
  return (
    <>
      {items.map((b, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </>
  );
}

function ResumeDoc({ r, template = "fresher" }: { r: RewrittenResume; template?: TemplatePreset }) {
  const meta = TEMPLATE_PRESETS[template];
  const { s } = makeStyles(meta);
  const links = joinLinks(r.contact);
  const hasSkills =
    r.skills.languages.length +
      r.skills.frameworks.length +
      r.skills.tools.length +
      r.skills.concepts.length >
    0;
  const order = meta.sectionOrder;
  const sidebarSections = new Set(meta.sidebarSections ?? []);

  const blocks: Record<string, React.ReactNode> = {
    summary: r.summary ? (
      <View key="summary">
        <Text style={s.sectionTitle}>Summary</Text>
        <Text>{r.summary}</Text>
      </View>
    ) : null,
    skills: hasSkills ? (
      <View key="skills">
        <Text style={s.sectionTitle}>Skills</Text>
        {r.skills.languages.length > 0 && (
          <View style={s.skillRow}>
            <Text style={s.skillLabel}>Languages:</Text>
            <Text style={s.skillVals}>{r.skills.languages.join(", ")}</Text>
          </View>
        )}
        {r.skills.frameworks.length > 0 && (
          <View style={s.skillRow}>
            <Text style={s.skillLabel}>Frameworks:</Text>
            <Text style={s.skillVals}>{r.skills.frameworks.join(", ")}</Text>
          </View>
        )}
        {r.skills.tools.length > 0 && (
          <View style={s.skillRow}>
            <Text style={s.skillLabel}>Tools:</Text>
            <Text style={s.skillVals}>{r.skills.tools.join(", ")}</Text>
          </View>
        )}
        {r.skills.concepts.length > 0 && (
          <View style={s.skillRow}>
            <Text style={s.skillLabel}>Concepts:</Text>
            <Text style={s.skillVals}>{r.skills.concepts.join(", ")}</Text>
          </View>
        )}
      </View>
    ) : null,
    experience: r.experience.length > 0 ? (
      <View key="experience">
        <Text style={s.sectionTitle}>Experience</Text>
        {r.experience.map((e, i) => (
          <View key={i} wrap={false}>
            <View style={s.itemHeaderRow}>
              <Text style={s.itemTitle}>
                {e.role}
                {e.company ? ` — ${e.company}` : ""}
              </Text>
              <Text style={s.itemDates}>{e.dates}</Text>
            </View>
            {e.location ? <Text style={s.itemSub}>{e.location}</Text> : null}
            <Bullets items={e.bullets} s={s} />
          </View>
        ))}
      </View>
    ) : null,
    projects: r.projects.length > 0 ? (
      <View key="projects">
        <Text style={s.sectionTitle}>Projects</Text>
        {r.projects.map((p, i) => (
          <View key={i} wrap={false}>
            <View style={s.itemHeaderRow}>
              <Text style={s.itemTitle}>{p.name}</Text>
              {p.link ? (
                <Link src={p.link} style={[s.itemDates, s.link]}>
                  {p.link}
                </Link>
              ) : null}
            </View>
            {p.stack ? <Text style={s.itemSub}>{p.stack}</Text> : null}
            <Bullets items={p.bullets} s={s} />
          </View>
        ))}
      </View>
    ) : null,
    education: r.education.length > 0 ? (
      <View key="education">
        <Text style={s.sectionTitle}>Education</Text>
        {r.education.map((ed, i) => (
          <View key={i} wrap={false}>
            <View style={s.itemHeaderRow}>
              <Text style={s.itemTitle}>{ed.institution}</Text>
              <Text style={s.itemDates}>{ed.dates}</Text>
            </View>
            <Text style={s.itemSub}>
              {ed.degree}
              {ed.score ? `  •  ${ed.score}` : ""}
            </Text>
          </View>
        ))}
      </View>
    ) : null,
    certifications: r.certifications.length > 0 ? (
      <View key="certifications">
        <Text style={s.sectionTitle}>Certifications</Text>
        <Bullets items={r.certifications} s={s} />
      </View>
    ) : null,
    achievements: r.achievements.length > 0 ? (
      <View key="achievements">
        <Text style={s.sectionTitle}>Achievements</Text>
        <Bullets items={r.achievements} s={s} />
      </View>
    ) : null,
  };

  // ---------- Sidebar layout ----------
  if (meta.layout === "sidebar") {
    const sidebarSkill = (label: string, items: string[]) =>
      items.length ? (
        <View key={label}>
          <Text style={s.sidebarSubLabel}>{label}</Text>
          <Text style={s.sidebarText}>{items.join(", ")}</Text>
        </View>
      ) : null;

    return (
      <Document>
        <Page size="A4" style={s.page}>
          <View style={s.sidebarRow}>
            <View style={s.sidebar}>
              <Text style={s.sidebarName}>{r.name || "Your Name"}</Text>
              {r.headline ? <Text style={s.sidebarHeadline}>{r.headline}</Text> : null}
              <Text style={s.sidebarBlockTitle}>Contact</Text>
              {r.contact.email ? <Text style={s.sidebarText}>{r.contact.email}</Text> : null}
              {r.contact.phone ? <Text style={s.sidebarText}>{r.contact.phone}</Text> : null}
              {r.contact.location ? (
                <Text style={s.sidebarText}>{r.contact.location}</Text>
              ) : null}
              {links.map((l, i) => (
                <Link key={i} src={l} style={[s.sidebarText, { color: "#ffffff" }]}>
                  {l}
                </Link>
              ))}
              {sidebarSections.has("skills") && hasSkills ? (
                <>
                  <Text style={s.sidebarBlockTitle}>Skills</Text>
                  {sidebarSkill("Languages", r.skills.languages)}
                  {sidebarSkill("Frameworks", r.skills.frameworks)}
                  {sidebarSkill("Tools", r.skills.tools)}
                  {sidebarSkill("Concepts", r.skills.concepts)}
                </>
              ) : null}
            </View>
            <View style={s.mainCol}>
              {order.filter((id) => !sidebarSections.has(id)).map((id) => blocks[id])}
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  // ---------- Band layout ----------
  if (meta.layout === "band") {
    return (
      <Document>
        <Page size="A4" style={s.page}>
          <View style={s.band}>
            <Text style={s.bandName}>{r.name || "Your Name"}</Text>
            {r.headline ? <Text style={s.bandHeadline}>{r.headline}</Text> : null}
            <Text style={s.bandContact}>
              {joinContact(r.contact)}
              {links.length > 0 ? "  |  " : ""}
              {links.map((l, i) => (
                <Text key={i}>
                  {i > 0 ? "  |  " : ""}
                  <Link src={l} style={{ color: "#ffffff", textDecoration: "none" }}>
                    {l}
                  </Link>
                </Text>
              ))}
            </Text>
          </View>
          <View style={s.bandBody}>{order.map((id) => blocks[id])}</View>
        </Page>
      </Document>
    );
  }

  // ---------- Default single-column ----------
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{r.name || "Your Name"}</Text>
        {r.headline ? <Text style={s.headline}>{r.headline}</Text> : null}
        <Text style={s.contactRow}>
          {joinContact(r.contact)}
          {links.length > 0 ? "  |  " : ""}
          {links.map((l, i) => (
            <Text key={i}>
              {i > 0 ? "  |  " : ""}
              <Link src={l} style={s.link}>
                {l}
              </Link>
            </Text>
          ))}
        </Text>
        <View style={s.hr} />
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