import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Flame, Zap, ShieldCheck, Sparkles, Star } from "lucide-react";
import { extractPdfText } from "@/lib/pdf";
import { analyzeResume, type ResumeAnalysis } from "@/lib/analyze.functions";
import { UploadZone } from "@/components/UploadZone";
import { ResultsView } from "@/components/ResultsView";
import { ShareButtons } from "@/components/ShareButtons";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Free AI Resume Roast & ATS Checker for Indian Students | ResumeRIP" },
      {
        name: "description",
        content:
          "Free AI resume checker for Indian freshers. Upload your PDF, get an ATS score, brutally honest feedback, recruiter reactions, and instant rewrites. No signup.",
      },
      {
        name: "keywords",
        content:
          "AI resume checker, ATS score free, resume roast, Indian fresher resume, internship resume tips, resume builder students, resume rewrite AI",
      },
      { property: "og:title", content: "Free AI Resume Roast & ATS Checker | ResumeRIP" },
      {
        property: "og:description",
        content: "Brutally honest AI roast + ATS analysis for Indian resumes.",
      },
      { property: "og:url", content: "https://resumerip.vercel.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Free AI Resume Roast & ATS Checker | ResumeRIP" },
      {
        name: "twitter:description",
        content: "Brutally honest AI roast + ATS analysis for Indian resumes.",
      },
    ],
    links: [{ rel: "canonical", href: "https://resumerip.vercel.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ResumeRIP",
          url: "https://resumerip.vercel.app/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://resumerip.vercel.app/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
});

function Index() {
  const analyzeFn = useServerFn(analyzeResume);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [resumeText, setResumeText] = useState<string>("");

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const text = await extractPdfText(file);
      if (text.length < 100) {
        toast.error("Couldn't read this PDF. Is it a scanned image?");
        setLoading(false);
        return;
      }
      setResumeText(text);
      const result = await analyzeFn({ data: { resumeText: text } });
      if (!result.ok) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
      setAnalysis(result.analysis as ResumeAnalysis);
    } catch (e) {
      console.error(e);
      toast.error("Something broke. Try a different PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <Toaster position="top-center" theme="dark" />

      {analysis ? (
        <>
          <ResultsView
            analysis={analysis}
            resumeText={resumeText}
            onReset={() => setAnalysis(null)}
          />
          <div className="mx-auto w-full max-w-3xl px-4">
            <ShareButtons className="justify-center" />
          </div>
        </>
      ) : (
        <>
          <main className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-16 pt-12 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs uppercase tracking-widest text-primary">
              <Flame className="size-3" aria-hidden /> No mercy edition · 2026
            </div>

            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
              Free AI resume roast <br />
              <span className="bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent">
                + ATS checker for India.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Upload your PDF. Get a real ATS score, recruiter reactions from TCS to
              FAANG, and rewrites you can actually copy into your resume — in under 30 seconds.
            </p>

            <ul className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <li className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5 text-success" aria-hidden /> No signup</li>
              <li className="inline-flex items-center gap-1"><Zap className="size-3.5 text-accent" aria-hidden /> Free forever</li>
              <li className="inline-flex items-center gap-1"><Star className="size-3.5 text-warning" aria-hidden /> 1,200+ students</li>
            </ul>

            <div className="mt-10 w-full">
              <UploadZone onFile={handleFile} loading={loading} />
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Or{" "}
              <Link to="/builder" className="text-primary underline-offset-2 hover:underline">
                build a fresh resume from scratch →
              </Link>
            </p>

            {/* Feature strip */}
            <section aria-labelledby="features-heading" className="mt-16 w-full max-w-3xl">
              <h2 id="features-heading" className="sr-only">What you get</h2>
              <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
                {[
                  { t: "ATS Score", d: "Real recruiter compatibility" },
                  { t: "🔥 Roast", d: "Brutally specific" },
                  { t: "5 Recruiters", d: "TCS to FAANG reactions" },
                  { t: "Rewrites", d: "Before → after fixes" },
                ].map((f) => (
                  <div
                    key={f.t}
                    className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur transition-colors hover:bg-card/60"
                  >
                    <p className="text-sm font-semibold text-foreground">{f.t}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{f.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-10 font-mono text-xs text-muted-foreground">
              Free roast and ATS analysis with no login. Login only unlocks saved personalization.
            </p>
          </main>

          <section
            aria-labelledby="builder-cta"
            className="mx-auto w-full max-w-4xl px-4 pb-16"
          >
            <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-8 text-center backdrop-blur sm:p-12">
              <Sparkles className="mx-auto size-6 text-primary" aria-hidden />
              <h2 id="builder-cta" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Don't have a resume yet?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Build an ATS-safe resume in 5 minutes with our free Resume Builder — 10+
                templates, live ATS meter, instant PDF.
              </p>
              <Link
                to="/builder"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
              >
                Open Resume Builder →
              </Link>
            </div>
          </section>

          {/* Internal linking for SEO */}
          <section
            aria-labelledby="related"
            className="mx-auto w-full max-w-4xl px-4 pb-24"
          >
            <h2 id="related" className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Explore more
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link to="/builder" className="rounded-xl border border-border/60 bg-card/40 p-4 hover:bg-card/60">
                <p className="text-sm font-semibold">Resume Builder</p>
                <p className="mt-1 text-xs text-muted-foreground">10+ ATS-safe templates, live ATS meter</p>
              </Link>
              <Link to="/faq" className="rounded-xl border border-border/60 bg-card/40 p-4 hover:bg-card/60">
                <p className="text-sm font-semibold">FAQ</p>
                <p className="mt-1 text-xs text-muted-foreground">How the ATS score works, privacy, formats</p>
              </Link>
              <Link to="/about" className="rounded-xl border border-border/60 bg-card/40 p-4 hover:bg-card/60">
                <p className="text-sm font-semibold">About ResumeRIP</p>
                <p className="mt-1 text-xs text-muted-foreground">Built for Indian students, free forever</p>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
