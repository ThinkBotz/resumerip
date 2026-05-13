import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileStickyAd } from "@/components/ads/MobileStickyAd";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0b0a09" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { title: "ResumeRIP — Your Resume Might Be Cooked" },
      { name: "description", content: "Brutally honest AI roast + ATS analysis for Indian resumes." },
      { name: "author", content: "ResumeRIP" },
      { property: "og:title", content: "ResumeRIP — Your Resume Might Be Cooked" },
      { property: "og:description", content: "Brutally honest AI roast + ATS analysis for Indian resumes." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ResumeRIP" },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "ResumeRIP — Your Resume Might Be Cooked" },
      { name: "twitter:description", content: "Brutally honest AI roast + ATS analysis for Indian resumes." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/02d33f92-9e63-447e-ad1f-d6d93f3ab547" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/02d33f92-9e63-447e-ad1f-d6d93f3ab547" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
    ],
    scripts: (import.meta as any).env?.VITE_ADSENSE_CLIENT
      ? [
          {
            async: true,
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${(import.meta as any).env.VITE_ADSENSE_CLIENT}`,
            crossOrigin: "anonymous",
          },
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "ResumeRIP",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://resumerip.lovable.app",
              description:
                "Free AI resume roast, ATS score checker, and resume builder built for Indian students and freshers.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1240" },
            }),
          },
        ]
      : [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "ResumeRIP",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://resumerip.lovable.app",
              description:
                "Free AI resume roast, ATS score checker, and resume builder built for Indian students and freshers.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1240" },
            }),
          },
        ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-1 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <div id="main-content" className="pb-16 sm:pb-0">
        <Outlet />
      </div>
      <Footer />
      <MobileBottomNav />
      <MobileStickyAd slot={(import.meta as any).env?.VITE_ADSENSE_SLOT_MOBILE_STICKY ?? ""} />
    </QueryClientProvider>
  );
}
