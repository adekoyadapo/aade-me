import Header from "@/components/header";
import SmoothScroll from "@/components/smooth-scroll";
import Ripple from "@/components/ripple";
import BgField from "@/components/bg-field";
import VtDebug from "@/components/vt-debug";
import ScrollToTop from "@/components/scroll-to-top";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";
import Footer from "@/components/footer";
import { themeInitScript } from "@/lib/theme-script";
import { viewInitScript } from "@/lib/cabinet-ctx";
import { preloadInitScript, preloadCriticalCss, preloadInertScript } from "@/lib/preload-script";
import Preloader from "@/components/preloader";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-geist-mono" });

export const metadata = {
  metadataBase: new URL("https://aade.me"),
  title: {
    default: "Ade A. | Enterprise Architect",
    template: "%s | Ade A.",
  },
  description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
  keywords: ["Enterprise Architect", "Cloud Architecture", "AI Platform", "Elasticsearch", "Observability", "Distributed Systems", "DevOps", "Platform Engineering"],
  authors: [{ name: "Ade A.", url: "https://aade.me" }],
  creator: "Ade A.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aade.me",
    siteName: "Ade A.",
    title: "Ade A. | Enterprise Architect",
    description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ade A. | Enterprise Architect",
    description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: "https://aade.me",
    types: { "application/rss+xml": [{ url: "/feed.xml", title: "Ade A. blog" }] },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable}`}
      style={{ viewTransitionName: "root" }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Writing page view (cabinet or list), decided before first paint; see lib/cabinet-ctx.ts. */}
        <script dangerouslySetInnerHTML={{ __html: viewInitScript }} />
        {/* Preloader: first visit of a session on the home route. The cover is display:none unless the script below sets data-preload. */}
        <style dangerouslySetInnerHTML={{ __html: preloadCriticalCss }} />
        <noscript><style>{".pl,.pl-status{display:none!important}"}</style></noscript>
        <script dangerouslySetInnerHTML={{ __html: preloadInitScript }} />
      </head>
      <body className="font-sans bg-bg text-fg relative overflow-x-clip">
          <Preloader />
          {/* The page shell is inert (not focusable, not clickable) while the preloader shows; it stays in the DOM for crawlers and readers. */}
          <div id="shell" suppressHydrationWarning>
            <a href="#content" className="skip-link">Skip to content</a>
            <Header />
            <div id="content" tabIndex={-1} className="outline-none">
              {children}
            </div>
            <Footer />
            <ScrollToTop />
          </div>
          <script dangerouslySetInnerHTML={{ __html: preloadInertScript }} />
          <SmoothScroll />
          <Ripple />
          <BgField />
          {process.env.NODE_ENV !== 'production' && <VtDebug />}
          {process.env.NODE_ENV === 'production' && (
            <>
              <Analytics />
              <SpeedInsights />
              {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS ? (
                <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
              ) : null}
            </>
          )}
      </body>
    </html>
  );
}
