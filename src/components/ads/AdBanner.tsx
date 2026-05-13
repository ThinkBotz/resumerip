import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable AdSense banner that reserves layout space (no CLS) and
 * gracefully degrades to a tasteful placeholder when no client ID is set.
 * One unit per page is recommended for a premium feel.
 */
const CLIENT = (import.meta as any).env?.VITE_ADSENSE_CLIENT as string | undefined;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type AdSize = "leaderboard" | "rectangle" | "skyscraper" | "mobile" | "responsive";

const SIZE_CLASS: Record<AdSize, string> = {
  leaderboard: "h-[90px] max-w-[728px]",
  rectangle: "h-[250px] max-w-[300px]",
  skyscraper: "h-[600px] max-w-[160px]",
  mobile: "h-[100px] max-w-[320px]",
  responsive: "min-h-[120px] w-full max-w-3xl",
};

type Props = {
  slot: string;
  size?: AdSize;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  label?: boolean;
  /** "Sponsored" instead of "Advertisement" — for native sections */
  labelText?: string;
};

export function AdBanner({
  slot,
  size = "responsive",
  format = "auto",
  className,
  label = true,
  labelText = "Advertisement",
}: Props) {
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!CLIENT || typeof window === "undefined") return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("[adsense] push failed", e);
    }
  }, []);

  return (
    <aside
      role="complementary"
      aria-label="Advertisement"
      className={cn("mx-auto w-full", SIZE_CLASS[size], className)}
    >
      {label && (
        <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground/50">
          {labelText}
        </p>
      )}
      {CLIENT ? (
        <ins
          ref={insRef as any}
          className="adsbygoogle block h-full w-full"
          style={{ display: "block" }}
          data-ad-client={CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex h-full min-h-[80px] w-full items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/10 text-[10px] uppercase tracking-widest text-muted-foreground/50">
          Ad space
        </div>
      )}
    </aside>
  );
}