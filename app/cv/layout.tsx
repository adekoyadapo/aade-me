import type { Metadata } from "next";
import PageTransition from "@/components/page-transition";

export const metadata: Metadata = {
  title: { absolute: "Resume of Ade A. | Lead Architect, Enterprise Solutions Architecture" },
  description: "Resume of Ade Adekoya, Lead Architect for enterprise solutions, agentic AI programs and multi-cloud platforms. 15+ years across infrastructure, cloud, security and AI.",
  alternates: { canonical: "https://aade.me/cv" },
  openGraph: {
    title: "Resume of Ade A. | Lead Architect, Enterprise Solutions Architecture",
    description: "Resume of Ade Adekoya, Lead Architect for enterprise solutions, agentic AI programs and multi-cloud platforms. 15+ years across infrastructure, cloud, security and AI.",
    url: "https://aade.me/cv",
    type: "profile",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ade A., Lead Architect, Enterprise Solutions Architecture" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume of Ade A. | Lead Architect, Enterprise Solutions Architecture",
    description: "Resume of Ade Adekoya, Lead Architect for enterprise solutions, agentic AI programs and multi-cloud platforms. 15+ years across infrastructure, cloud, security and AI.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function CVLayout({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
