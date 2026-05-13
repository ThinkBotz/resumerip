import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AdBanner } from "./AdBanner";

/**
 * Small, dismissible sticky ad anchored to the bottom of the screen on mobile.
 * Hidden on desktop; reserves its own height so it never covers content.
 */
export function MobileStickyAd({ slot }: { slot: string }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  if (!open || dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-14 z-40 mx-auto w-full max-w-md px-2 sm:hidden"
      role="complementary"
      aria-label="Sponsored"
    >
      <div className="relative rounded-xl border border-border/60 bg-card/90 p-2 shadow-lg backdrop-blur">
        <button
          type="button"
          aria-label="Dismiss ad"
          onClick={() => setDismissed(true)}
          className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" />
        </button>
        <AdBanner slot={slot} size="mobile" label={false} />
      </div>
    </div>
  );
}