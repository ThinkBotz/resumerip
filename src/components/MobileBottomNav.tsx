import { Link, useLocation } from "@tanstack/react-router";
import { Flame, FileText, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Roast", icon: Flame },
  { to: "/builder", label: "Builder", icon: FileText },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
] as const;

export function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/85 backdrop-blur-md sm:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}