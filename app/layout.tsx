import Header from "@/components/header";
import MobileMenu from "@/components/mobile-menu";
import ScrollToTop from "@/components/scroll-to-top";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";
import ActiveSectionContextProvider from "@/context/active-section-context";
import Footer from "@/components/footer";
import ThemeSwitch from "@/components/theme-switch";
import ThemeContextProvider from "@/context/theme-context";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

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
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Ade A. — Enterprise Architect" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ade A. | Enterprise Architect",
    description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "https://aade.me" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="!scroll-smooth">
      <body
        className={`${inter.className} bg-zinc-50 text-zinc-950 relative pt-28 sm:pt-36 dark:bg-zinc-900 dark:text-zinc-50 dark:text-opacity-90`}
        suppressHydrationWarning
      >
        <ThemeContextProvider>
          <ActiveSectionContextProvider>
            <Header />
            <MobileMenu />
            {children}
            {process.env.NODE_ENV === 'production' && (
              <>
                <Analytics />
                <SpeedInsights />
                {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS ? (
                  <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
                ) : null}
              </>
            )}
            <Footer />
            <Toaster position="top-right" />
            <ScrollToTop />
            <ThemeSwitch />
          </ActiveSectionContextProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
