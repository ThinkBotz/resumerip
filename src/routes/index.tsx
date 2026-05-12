import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Flame, Skull, Zap } from "lucide-react";
import { extractPdfText } from "@/lib/pdf";
import { analyzeResume, type ResumeAnalysis } from "@/lib/analyze.functions";
import { UploadZone } from "@/components/UploadZone";
import { ResultsView } from "@/components/ResultsView";
import { AdSlot } from "@/components/AdSlot";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ResumeRIP — Your Resume Might Be Cooked" },
      {
        name: "description",
        content:
          "Upload your resume. Get a brutally honest ATS score, recruiter reactions, and a roast you'll never recover from. Built for Indian freshers.",
      },
      { property: "og:title", content: "ResumeRIP — Your Resume Might Be Cooked" },
      {
        property: "og:description",
        content: "Brutally honest AI roast + ATS analysis for Indian resumes.",
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

      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <Skull className="size-6 text-primary" />
          <span className="font-mono text-lg font-bold tracking-tight">
            Resume<span className="text-primary">RIP</span>
          </span>
        </div>
        <nav className="flex items-center gap-4 text-xs">
          <Link
            to="/builder"
            className="rounded-full border border-border px-3 py-1 font-medium text-foreground hover:bg-accent"
          >
            Resume Builder
          </Link>
          <span className="hidden items-center gap-1 text-muted-foreground sm:flex">
            <Zap className="size-3 text-accent" /> Built for Indian freshers
          </span>
        </nav>
      </header>

      {analysis ? (
        <ResultsView
          analysis={analysis}
          resumeText={resumeText}
          onReset={() => setAnalysis(null)}
        />
      ) : (
        <main className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-24 pt-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs uppercase tracking-widest text-primary">
            <Flame className="size-3" /> No mercy edition
          </div>

          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Your resume <br />
            <span className="bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent">
              might be cooked.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Upload your PDF. AI scans it like a TCS HR, judges it like a startup
            founder, and roasts it like your batchmates would — but useful.
          </p>

          <div className="mt-10 w-full">
            <UploadZone onFile={handleFile} loading={loading} />
          </div>

          {/* Feature strip */}
          <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {[
              { t: "ATS Score", d: "Real recruiter compatibility" },
              { t: "🔥 Roast", d: "Brutally specific" },
              { t: "5 Recruiters", d: "TCS to FAANG reactions" },
              { t: "Rewrites", d: "Before → after fixes" },
            ].map((f) => (
              <div
                key={f.t}
                className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur"
              >
                <p className="text-sm font-semibold text-foreground">{f.t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 font-mono text-xs text-muted-foreground">
            Free. No login. Your file never leaves the request.
          </p>

          {/* One ad slot, bottom of page only */}
          <div className="mt-16 w-full">
            <AdSlot slot={(import.meta as any).env?.VITE_ADSENSE_SLOT_HOME ?? ""} />
          </div>
        </main>
      )}
    </div>
  );
}
