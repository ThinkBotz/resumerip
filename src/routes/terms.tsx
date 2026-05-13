import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "Terms of Service — ResumeRIP";
const DESC = "Terms of using ResumeRIP, the free AI resume roast and builder.";
const URL = "https://resumerip.vercel.app/terms";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});

function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span> <span>Terms</span>
      </nav>
      <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 13, 2026</p>

      <section className="mt-8 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          ResumeRIP is provided free of charge for personal, non-commercial use. By using
          the site you agree to these terms.
        </p>
        <h2 className="text-lg font-semibold">Use of service</h2>
        <p>
          The AI feedback is generated automatically and may contain mistakes. It is for
          guidance only — final decisions about your resume are your own.
        </p>
        <h2 className="text-lg font-semibold">Acceptable use</h2>
        <p>
          Don't use the service to upload content you don't have rights to, attempt to
          reverse-engineer the API, or abuse rate limits.
        </p>
        <h2 className="text-lg font-semibold">No warranty</h2>
        <p>
          The service is provided "as is" without warranty of any kind. We're not liable
          for outcomes of job applications based on the feedback.
        </p>
        <p>
          Questions? See <Link to="/about" className="text-primary hover:underline">About</Link>.
        </p>
      </section>
    </main>
  );
}