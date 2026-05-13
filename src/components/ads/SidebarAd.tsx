import { AdBanner } from "./AdBanner";

/** Desktop-only sidebar ad. Hidden on mobile/tablet. */
export function SidebarAd({ slot }: { slot: string }) {
  return (
    <div className="hidden lg:block sticky top-24">
      <AdBanner slot={slot} size="rectangle" />
    </div>
  );
}