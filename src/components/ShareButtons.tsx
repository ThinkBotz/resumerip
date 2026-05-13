import { useState } from "react";
import { Twitter, Linkedin, Link2, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  url?: string;
  text?: string;
  className?: string;
};

export function ShareButtons({
  url,
  text = "I just got my resume roasted by AI on ResumeRIP 💀 — try it free:",
  className,
}: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.href : "https://resumerip.vercel.app");

  const enc = encodeURIComponent;
  const twitter = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(shareUrl)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`;
  const whatsapp = `https://wa.me/?text=${enc(text + " " + shareUrl)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const base =
    "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground/90 backdrop-blur transition-colors hover:bg-accent/15 hover:text-foreground";

  return (
    <div className={"flex flex-wrap items-center gap-2 " + (className ?? "")}>
      <span className="text-xs text-muted-foreground">Share:</span>
      <a className={base} href={twitter} target="_blank" rel="noreferrer" aria-label="Share on Twitter">
        <Twitter className="size-3.5" /> Twitter
      </a>
      <a className={base} href={linkedin} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn">
        <Linkedin className="size-3.5" /> LinkedIn
      </a>
      <a className={base} href={whatsapp} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp">
        WhatsApp
      </a>
      <button type="button" onClick={copy} className={base} aria-label="Copy link">
        {copied ? <Check className="size-3.5 text-success" /> : <Link2 className="size-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}