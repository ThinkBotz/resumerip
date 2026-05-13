import { AdBanner } from "./AdBanner";

/** Native-feeling inline ad. Use sparingly between content blocks. */
export function InlineAd({ slot, className }: { slot: string; className?: string }) {
  return (
    <div className={"my-8 " + (className ?? "")}>
      <AdBanner slot={slot} size="responsive" labelText="Sponsored" />
    </div>
  );
}