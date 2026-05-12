import { useState } from "react";
import type { ResumeAnalysis } from "@/lib/analyze.functions";
import { rewriteResume, type RewrittenResume as RewrittenResumeType } from "@/lib/rewrite.functions";
import { useServerFn } from "@tanstack/react-start";
import { ScoreRing } from "./ScoreRing";
import { RewrittenResume } from "./RewrittenResume";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, AlertTriangle, CheckCircle2, Wrench, Users, RotateCcw, Copy, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const personaEmoji: Record<string, string> = {
  "TCS HR": "🏢",
  "Startup Founder": "🚀",
  "FAANG Recruiter": "💼",
  "Toxic HR": "😬",
  "Government Recruiter": "📜",
};

export function ResultsView({
  analysis,
  resumeText,
  onReset,
}: {
  analysis: ResumeAnalysis;
  resumeText: string;
  onReset: () => void;
}) {
  const [tab, setTab] = useState("scores");
  const rewriteFn = useServerFn(rewriteResume);
  const [rewriting, setRewriting] = useState(false);
  const [rewritten, setRewritten] = useState<RewrittenResumeType | null>(null);

  const handleRewrite = async () => {
    setRewriting(true);
    try {
      const result = await rewriteFn({ data: { resumeText } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRewritten(result.resume as RewrittenResumeType);
      toast.success("Fresh resume served. Hot.");
    } catch (e) {
      console.error(e);
      toast.error("Rewrite failed. Try again.");
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12">
      {/* Verdict bar */}
      <Card className="border-primary/40 bg-card p-6 shadow-[var(--shadow-rip)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Flame className="size-10 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                The Verdict
              </p>
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                "{analysis.verdict}"
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onReset} className="shrink-0">
            <RotateCcw className="mr-2 size-4" />
            New Resume
          </Button>
        </div>
      </Card>

      {/* Rewrite CTA */}
      <Card className="border-accent/40 bg-gradient-to-br from-accent/10 to-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 size-6 text-accent" />
            <div>
              <p className="text-base font-semibold text-foreground">
                Want a better version?
              </p>
              <p className="text-sm text-muted-foreground">
                Let ResumeRIP rebuild your resume — clean, ATS-safe, recruiter-ready.
                Download as PDF.
              </p>
            </div>
          </div>
          <Button onClick={handleRewrite} disabled={rewriting} className="shrink-0">
            {rewriting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Rebuilding…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Rewrite my resume
              </>
            )}
          </Button>
        </div>
      </Card>

      {rewritten && <RewrittenResume resume={rewritten} />}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 bg-muted/50 p-1 sm:grid-cols-4">
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="roast">🔥 Roast</TabsTrigger>
          <TabsTrigger value="fixes">Fixes</TabsTrigger>
          <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
        </TabsList>

        {/* SCORES */}
        <TabsContent value="scores" className="mt-6 space-y-6">
          <Card className="p-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <ScoreRing score={analysis.scores.overall} label="Overall" />
              <ScoreRing score={analysis.scores.ats} label="ATS" />
              <ScoreRing score={analysis.scores.recruiter} label="Recruiter" />
              <ScoreRing score={analysis.scores.fresher} label="Fresher" />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-success">
                <CheckCircle2 className="size-4" /> Strengths
              </h3>
              <ul className="space-y-2 text-sm text-foreground">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-success">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                <AlertTriangle className="size-4" /> Red Flags
              </h3>
              <ul className="space-y-2 text-sm text-foreground">
                {analysis.red_flags.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">✗</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {analysis.keywords_missing.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords_missing.map((k, i) => (
                  <Badge key={i} variant="outline" className="border-primary/40 text-primary">
                    {k}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ROAST */}
        <TabsContent value="roast" className="mt-6">
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-card to-card/40 p-8">
            <div className="mb-6 flex items-center gap-3">
              <Flame className="size-7 text-primary animate-pulse" />
              <h2 className="text-2xl font-bold">Roast Mode</h2>
            </div>
            <ol className="space-y-4">
              {analysis.roast.map((line, i) => (
                <li
                  key={i}
                  className="flex gap-4 rounded-lg border border-border/50 bg-background/40 p-4"
                >
                  <span className="font-mono text-2xl font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base leading-relaxed text-foreground">{line}</p>
                </li>
              ))}
            </ol>
            <Button
              variant="ghost"
              className="mt-6"
              onClick={() => {
                navigator.clipboard.writeText(analysis.roast.join("\n\n"));
                toast.success("Roast copied. Now share with your batchmates.");
              }}
            >
              <Copy className="mr-2 size-4" /> Copy roast
            </Button>
          </Card>
        </TabsContent>

        {/* FIXES */}
        <TabsContent value="fixes" className="mt-6 space-y-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="size-4" /> Rewrite suggestions
          </div>
          {analysis.fixes.map((f, i) => (
            <Card key={i} className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="secondary">{f.section}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-destructive">
                    Before
                  </p>
                  <p className="text-sm text-foreground/80 line-through decoration-destructive/40">
                    {f.before}
                  </p>
                </div>
                <div className="rounded-md border border-success/40 bg-success/5 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-success">
                    After
                  </p>
                  <p className="text-sm text-foreground">{f.after}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-semibold text-accent">Why:</span> {f.why}
              </p>
            </Card>
          ))}
        </TabsContent>

        {/* RECRUITERS */}
        <TabsContent value="recruiters" className="mt-6 space-y-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" /> Five recruiters reacting to your resume
          </div>
          {analysis.recruiters.map((r, i) => (
            <Card key={i} className="p-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{personaEmoji[r.persona] ?? "🧑‍💼"}</span>
                  <h4 className="font-semibold text-foreground">{r.persona}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Shortlist
                  </p>
                  <p
                    className={
                      r.shortlist_chance >= 60
                        ? "text-lg font-bold text-success"
                        : r.shortlist_chance >= 30
                          ? "text-lg font-bold text-warning"
                          : "text-lg font-bold text-primary"
                    }
                  >
                    {r.shortlist_chance}%
                  </p>
                </div>
              </div>
              <p className="mb-3 text-sm italic text-foreground/90">"{r.reaction}"</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Reason:</span>{" "}
                {r.rejection_reason}
              </p>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}