import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "Privacy Policy — ResumeRIP";
const DESC = "How ResumeRIP handles your resume data: we don't store your file, we don't sell your data.";
const URL = "https://resumerip.vercel.app/privacy";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
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

function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span> <span>Privacy</span>
      </nav>
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 13, 2026</p>

      <section className="mt-8 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          ResumeRIP is built with privacy in mind. We don't require an account and we don't
          ask for your email. Below is a plain-English summary of how your data is handled.
        </p>
        <h2 className="text-lg font-semibold">Resume files</h2>
        <p>
          When you upload a PDF, the file is parsed in-memory inside the request. We do
          not write your file to disk and we do not save its contents in our database.
          Once the response is sent, the data is gone.
        </p>
        <h2 className="text-lg font-semibold">AI processing</h2>
        <p>
          The extracted text is sent to our AI provider (Google Gemini API) solely to
          generate the analysis you see. It is not used for training.
        </p>
        <h2 className="text-lg font-semibold">Analytics & ads</h2>
        <p>
          We use anonymous aggregate analytics to improve the product. If ads are enabled,
          they are served by Google AdSense, which may set cookies as described in
          Google's policies.
        </p>
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>For privacy questions, reach out via the <Link to="/about" className="text-primary hover:underline">About page</Link>.</p>
      </section>
    </main>
  );
}