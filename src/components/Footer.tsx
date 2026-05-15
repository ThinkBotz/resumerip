import { Link } from "@tanstack/react-router";
import { Skull } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Skull className="size-5 text-primary" aria-hidden />
            <span className="font-mono text-base font-bold tracking-tight">
              Resume<span className="text-primary">RIP</span>
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Brutally honest AI resume feedback + a free ATS-friendly resume builder.
            Built for Indian students, freshers, and interns.
          </p>
        </div>

        <nav aria-label="Product" className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Product
          </p>
          <ul className="space-y-2">
            <li><Link to="/" className="text-foreground/80 hover:text-primary">Resume Roast</Link></li>
            <li><Link to="/builder" className="text-foreground/80 hover:text-primary">Resume Builder</Link></li>
            <li><Link to="/faq" className="text-foreground/80 hover:text-primary">FAQ</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company" className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Company
          </p>
          <ul className="space-y-2">
            <li><Link to="/about" className="text-foreground/80 hover:text-primary">About</Link></li>
            <li><Link to="/privacy" className="text-foreground/80 hover:text-primary">Privacy</Link></li>
            <li><Link to="/terms" className="text-foreground/80 hover:text-primary">Terms</Link></li>
          </ul>
        </nav>

        <nav aria-label="Resources" className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Free tools
          </p>
          <ul className="space-y-2">
            <li><Link to="/" className="text-foreground/80 hover:text-primary">ATS resume checker</Link></li>
            <li><Link to="/builder" className="text-foreground/80 hover:text-primary">Fresher resume builder</Link></li>
            <li><Link to="/builder" className="text-foreground/80 hover:text-primary">Internship resume templates</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ResumeRIP. Free forever for students.</p>
          <p>Made in India · No login for roast · Login unlocks personalization.</p>
        </div>
      </div>
    </footer>
  );
}