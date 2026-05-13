import { Link, useLocation } from "@tanstack/react-router";
import { Skull } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Roast" },
  { to: "/builder", label: "Builder" },
  { to: "/faq", label: "FAQ" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2" aria-label="ResumeRIP home">
          <Skull className="size-5 text-primary" aria-hidden />
          <span className="font-mono text-base font-bold tracking-tight">
            Resume<span className="text-primary">RIP</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/builder"
            className="ml-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Build resume →
          </Link>
        </nav>
      </div>
    </header>
  );
}