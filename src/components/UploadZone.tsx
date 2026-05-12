import { useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGES = [
  "Reading your PDF...",
  "Running ATS scanner...",
  "Recruiter is judging...",
  "AI is composing roast...",
];

export function UploadZone({
  onFile,
  loading,
}: {
  onFile: (file: File) => void;
  loading: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const [stage, setStage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // rotate loading messages
  if (loading && intervalRef.current === null) {
    intervalRef.current = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 1400);
  }
  if (!loading && intervalRef.current !== null) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      alert("Only PDF files. Convert your DOCX first.");
      return;
    }
    onFile(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        pick(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "relative mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card/50 p-12 text-center backdrop-blur transition-all",
        drag
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/60",
        loading && "border-primary",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {loading ? (
        <>
          <Loader2 className="mb-4 size-12 animate-spin text-primary" />
          <p className="font-mono text-sm text-foreground">{STAGES[stage]}</p>
          <p className="mt-2 text-xs text-muted-foreground">This usually takes 10-20s</p>
        </>
      ) : (
        <>
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Upload className="size-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Drop your resume here
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF only. We don't store it.
          </p>
          <Button
            variant="default"
            size="lg"
            className="mt-6 bg-gradient-to-r from-primary to-destructive text-primary-foreground shadow-[var(--shadow-rip)] hover:opacity-90"
            onClick={() => inputRef.current?.click()}
          >
            <FileText className="mr-2 size-4" />
            Choose PDF
          </Button>
        </>
      )}
    </div>
  );
}