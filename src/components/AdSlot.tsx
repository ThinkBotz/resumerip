import { useEffect, useRef } from "react";

/**
 * AdSense slot — renders a single Google AdSense unit when VITE_ADSENSE_CLIENT
 * and the given slot ID are configured. Otherwise renders a subtle placeholder
 * so layout stays stable in dev/preview without violating AdSense policies
 * (we never inject the script unless a real client ID is set).
 *
 * Usage (kept intentionally sparse — max 1 unit per page for a good UX):
 *   <AdSlot slot="1234567890" format="auto" />
 */
type Props = {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
  /** Show a small "Advertisement" label above the unit (AdSense best practice). */
  label?: boolean;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT = (import.meta as any).env?.VITE_ADSENSE_CLIENT as string | undefined;

export function AdSlot({ slot, format = "auto", className, label = true }: Props) {
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!CLIENT || typeof window === "undefined") return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("[adsense] push failed", e);
    }
  }, []);

  if (!CLIENT) {
    return (
      <div
        className={
          "mx-auto flex w-full max-w-3xl items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 py-10 text-xs uppercase tracking-widest text-muted-foreground/60 " +
          (className ?? "")
        }
      >
        Ad space
      </div>
    );
  }

  return (
    <div className={"mx-auto w-full max-w-3xl " + (className ?? "")}>
      {label && (
        <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground/50">
          Advertisement
        </p>
      )}
      <ins
        ref={insRef as any}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}