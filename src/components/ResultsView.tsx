import { useState } from "react";
import type { ResumeAnalysis } from "@/lib/analyze.functions";
import { analyzeResume, type ResumeAnalysis as ResumeAnalysisType } from "@/lib/analyze.functions";
import { rewriteResume, type RewrittenResume as RewrittenResumeType } from "@/lib/rewrite.functions";
import { useFirebaseAuth, usePersonalizationProfile } from "@/integrations/firebase/session";
import { useServerFn } from "@tanstack/react-start";
import { ScoreRing } from "./ScoreRing";
import { RewrittenResume } from "./RewrittenResume";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, AlertTriangle, CheckCircle2, Wrench, Users, RotateCcw, Copy, Sparkles, Loader2, X } from "lucide-react";
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
  const analyzeFn = useServerFn(analyzeResume);
  const { user } = useFirebaseAuth();
  const { profile } = usePersonalizationProfile(user?.uid ?? null);
  const [rewriting, setRewriting] = useState(false);
  const [rewritten, setRewritten] = useState<RewrittenResumeType | null>(null);
  const [rewriteAnalysis, setRewriteAnalysis] = useState<ResumeAnalysisType | null>(null);
  const [showFeedbackChoice, setShowFeedbackChoice] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Set<string>>(new Set());

  const handleRewriteClick = () => {
    setShowFeedbackChoice(true);
  };

  const handleRewrite = async (useFeedback: boolean) => {
    setRewriting(true);
    setShowFeedbackChoice(false);
    try {
      const result = await rewriteFn({
        data: {
          resumeText,
          redFlags: useFeedback ? analysis.red_flags.filter((f) => selectedFeedback.has(f)) : undefined,
          keywordsMissing: useFeedback ? analysis.keywords_missing.filter((k) => selectedFeedback.has(k)) : undefined,
          useFeedback,
          personalization: user ? profile : undefined,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRewritten(result.resume as RewrittenResumeType);
      toast.success("Fresh resume served. Analyzing improvements...");

      // Auto-analyze the rewritten resume
      const rewrittenResumeText = formatResumeAsText(result.resume);
      const analysisResult = await analyzeFn({ data: { resumeText: rewrittenResumeText } });
      if (analysisResult.ok) {
        setRewriteAnalysis(analysisResult.analysis as ResumeAnalysisType);
      }
    } catch (e) {
      console.error(e);
      toast.error("Rewrite failed. Try again.");
    } finally {
      setRewriting(false);
    }
  };

  const toggleFeedback = (item: string) => {
    const newSet = new Set(selectedFeedback);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    setSelectedFeedback(newSet);
  };

  const formatResumeAsText = (resume: RewrittenResumeType): string => {
    const lines = [];
    lines.push(resume.name);
    lines.push(resume.headline);
    lines.push("");
    lines.push(`Email: ${resume.contact.email}`);
    lines.push(`Phone: ${resume.contact.phone}`);
    lines.push(`Location: ${resume.contact.location}`);
    if (resume.contact.linkedin) lines.push(`LinkedIn: ${resume.contact.linkedin}`);
    if (resume.contact.github) lines.push(`GitHub: ${resume.contact.github}`);
    if (resume.contact.portfolio) lines.push(`Portfolio: ${resume.contact.portfolio}`);
    lines.push("");
    if (resume.summary) {
      lines.push("SUMMARY");
      lines.push(resume.summary);
      lines.push("");
    }
    if (resume.skills.languages.length || resume.skills.frameworks.length) {
      lines.push("SKILLS");
      if (resume.skills.languages.length)
        lines.push(`Languages: ${resume.skills.languages.join(", ")}`);
      if (resume.skills.frameworks.length)
        lines.push(`Frameworks: ${resume.skills.frameworks.join(", ")}`);
      if (resume.skills.tools.length) lines.push(`Tools: ${resume.skills.tools.join(", ")}`);
      if (resume.skills.concepts.length)
        lines.push(`Concepts: ${resume.skills.concepts.join(", ")}`);
      lines.push("");
    }
    if (resume.experience.length) {
      lines.push("EXPERIENCE");
      resume.experience.forEach((exp) => {
        lines.push(`${exp.role} at ${exp.company}`);
        lines.push(`${exp.dates} | ${exp.location}`);
        exp.bullets.forEach((b) => lines.push(`- ${b}`));
        lines.push("");
      });
    }
    if (resume.projects.length) {
      lines.push("PROJECTS");
      resume.projects.forEach((proj) => {
        lines.push(`${proj.name}`);
        lines.push(`Stack: ${proj.stack}`);
        if (proj.link) lines.push(`Link: ${proj.link}`);
        proj.bullets.forEach((b) => lines.push(`- ${b}`));
        lines.push("");
      });
    }
    if (resume.education.length) {
      lines.push("EDUCATION");
      resume.education.forEach((edu) => {
        lines.push(`${edu.degree} from ${edu.institution}`);
        lines.push(`${edu.dates}${edu.score ? ` | CGPA: ${edu.score}` : ""}`);
        lines.push("");
      });
    }
    return lines.join("\n");
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

      {/* Rewrite CTA or Feedback Choice */}
      {!showFeedbackChoice && !rewritten && (
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
            <Button onClick={handleRewriteClick} disabled={rewriting} className="shrink-0">
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
      )}

      {/* Feedback Choice Modal */}
      {showFeedbackChoice && !rewritten && (
        <Card className="border-primary/40 bg-card p-6">
          <h3 className="mb-4 text-lg font-bold">Include analysis feedback in rewrite?</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Select which issues to fix. The rewrite will address these specifically.
          </p>

          {analysis.red_flags.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold">Red Flags to Fix:</p>
              <div className="space-y-2">
                {analysis.red_flags.map((flag) => (
                  <label key={flag} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFeedback.has(flag)}
                      onChange={() => toggleFeedback(flag)}
                      className="size-4 rounded border border-border"
                    />
                    <span>{flag}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {analysis.keywords_missing.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold">Keywords to Add (top 8):</p>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords_missing.slice(0, 8).map((kw) => (
                  <button
                    key={kw}
                    onClick={() => toggleFeedback(kw)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedFeedback.has(kw)
                        ? "bg-primary text-primary-foreground"
                        : "border border-primary/40 bg-card text-primary hover:bg-primary/10"
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => handleRewrite(false)}
              disabled={rewriting}
              variant="outline"
            >
              Rewrite without feedback
            </Button>
            <Button
              onClick={() => handleRewrite(true)}
              disabled={rewriting || selectedFeedback.size === 0}
            >
              {rewriting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Rebuilding…
                </>
              ) : (
                "Rewrite with selected feedback"
              )}
            </Button>
            <Button
              onClick={() => setShowFeedbackChoice(false)}
              variant="ghost"
              disabled={rewriting}
            >
              <X className="size-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Score Comparison */}
      {rewritten && rewriteAnalysis && (
        <Card className="border-success/40 bg-gradient-to-br from-success/5 to-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold">Score Improvement</h3>
            <p className="text-sm text-muted-foreground">
              Original vs. Rewritten Resume
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Overall</p>
              <p className="text-sm">
                <span className="font-bold text-primary">{analysis.scores.overall}</span>
                {" → "}
                <span className="font-bold text-success">{rewriteAnalysis.scores.overall}</span>
              </p>
              {rewriteAnalysis.scores.overall > analysis.scores.overall && (
                <p className="text-xs text-success font-semibold">
                  +{rewriteAnalysis.scores.overall - analysis.scores.overall}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ATS</p>
              <p className="text-sm">
                <span className="font-bold text-primary">{analysis.scores.ats}</span>
                {" → "}
                <span className="font-bold text-success">{rewriteAnalysis.scores.ats}</span>
              </p>
              {rewriteAnalysis.scores.ats > analysis.scores.ats && (
                <p className="text-xs text-success font-semibold">
                  +{rewriteAnalysis.scores.ats - analysis.scores.ats}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recruiter</p>
              <p className="text-sm">
                <span className="font-bold text-primary">{analysis.scores.recruiter}</span>
                {" → "}
                <span className="font-bold text-success">
                  {rewriteAnalysis.scores.recruiter}
                </span>
              </p>
              {rewriteAnalysis.scores.recruiter > analysis.scores.recruiter && (
                <p className="text-xs text-success font-semibold">
                  +{rewriteAnalysis.scores.recruiter - analysis.scores.recruiter}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fresher</p>
              <p className="text-sm">
                <span className="font-bold text-primary">{analysis.scores.fresher}</span>
                {" → "}
                <span className="font-bold text-success">{rewriteAnalysis.scores.fresher}</span>
              </p>
              {rewriteAnalysis.scores.fresher > analysis.scores.fresher && (
                <p className="text-xs text-success font-semibold">
                  +{rewriteAnalysis.scores.fresher - analysis.scores.fresher}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

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