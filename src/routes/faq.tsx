import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "FAQ — ResumeRIP | AI Resume Checker & Builder for Indian Students";
const DESC =
  "Common questions about ResumeRIP — the free AI resume roast, ATS score checker, and resume builder for Indian freshers and interns.";
const URL = "https://resumerip.vercel.app/faq";

const faqs = [
  {
    q: "Is ResumeRIP really free?",
    a: "Yes — 100% free, no signup, no credit card. We may show small ads to keep the lights on, but every feature stays free for students.",
  },
  {
    q: "Do you store my resume?",
    a: "No. Your PDF is processed in-memory during the request and never written to disk or saved in a database.",
  },
  {
    q: "How does the ATS score work?",
    a: "We extract keywords, formatting signals, and section structure from your resume and compare them against patterns recruiters and ATS systems look for. The live meter updates as you type in the builder.",
  },
  {
    q: "Will this work for non-tech roles?",
    a: "Yes. The builder supports any role. The roast is sharper for tech / engineering / internship resumes because that's our primary audience.",
  },
  {
    q: "Can I tailor my resume to a specific job?",
    a: "Yes — paste the job description in the builder and we automatically suggest keywords and skills to highlight.",
  },
  {
    q: "Which template should I pick?",
    a: "If you're applying through a company portal or LinkedIn Easy Apply, choose an ATS-safe template (Minimal or Classic Serif). For startup or creative roles, the graphical sidebar / band templates look stronger.",
  },
];

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://resumerip.vercel.app/" },
            { "@type": "ListItem", position: 2, name: "FAQ", item: URL },
          ],
        }),
      },
    ],
  }),
});

function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span> <span>FAQ</span>
      </nav>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Frequently asked questions</h1>
      <p className="mt-3 text-muted-foreground">Everything about ResumeRIP, in one place.</p>

      <dl className="mt-10 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/40 backdrop-blur">
        {faqs.map((f) => (
          <details key={f.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-foreground">
              {f.q}
              <span aria-hidden className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </dl>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Ready? <Link to="/" className="text-primary hover:underline">Roast your resume →</Link>
      </p>
    </main>
  );
}