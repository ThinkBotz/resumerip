import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "About ResumeRIP — Free AI Resume Roast & Builder for Indian Students";
const DESC =
  "ResumeRIP is a free AI tool built for Indian freshers, students, and interns. Roast your resume, get an ATS score, and build a recruiter-ready PDF in seconds.";
const URL = "https://resumerip.vercel.app/about";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "keywords", content: "AI resume checker India, ATS score free, resume roast, fresher resume, internship resume, resume builder students" },
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
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://resumerip.vercel.app/" },
            { "@type": "ListItem", position: 2, name: "About", item: URL },
          ],
        }),
      },
    ],
  }),
});

function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span> <span>About</span>
      </nav>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About ResumeRIP</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Free AI resume feedback and a fast, ATS-safe resume builder — built specifically
        for Indian students, freshers, and interns.
      </p>

      <section className="prose-invert mt-10 space-y-6 text-foreground/90">
        <h2 className="text-xl font-semibold">Why we built this</h2>
        <p>
          Most resume tools either cost money, require a signup, or were built for
          experienced US engineers. We built ResumeRIP for the Indian fresher: brutally
          honest, fast, mobile-first, and free forever — no login, no paywall, no email harvesting.
        </p>
        <h2 className="text-xl font-semibold">What you can do</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><Link to="/" className="text-primary hover:underline">Roast your resume</Link> — get an ATS score, recruiter reactions, and a brutally honest review.</li>
          <li><Link to="/builder" className="text-primary hover:underline">Build a new resume</Link> — 10+ ATS-safe and graphical templates, live ATS meter, instant PDF.</li>
          <li>Tailor keywords to a specific job description automatically.</li>
        </ul>
        <h2 className="text-xl font-semibold">Privacy</h2>
        <p>
          Your resume never leaves the request. We don't store your file. Read our{" "}
          <Link to="/privacy" className="text-primary hover:underline">privacy policy</Link>.
        </p>
      </section>
    </main>
  );
}