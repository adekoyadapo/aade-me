import type { Metadata } from "next";
import PageTransition from "@/components/page-transition";

export const metadata: Metadata = {
  title: { absolute: "Resume of Ade A. | Enterprise Solutions Architect, Elastic" },
  description: "Resume of Ade Adekoya, Enterprise Solutions Architect specialising in AI-powered search, Elasticsearch, cloud-native platforms, and large-scale observability.",
  alternates: { canonical: "https://aade.me/cv" },
  openGraph: {
    title: "Resume of Ade A. | Enterprise Solutions Architect, Elastic",
    description: "Resume of Ade Adekoya, Enterprise Solutions Architect specialising in AI-powered search, Elasticsearch, cloud-native platforms, and large-scale observability.",
    url: "https://aade.me/cv",
    type: "profile",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ade A. — Enterprise Solutions Architect" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume of Ade A. | Enterprise Solutions Architect, Elastic",
    description: "Resume of Ade Adekoya, Enterprise Solutions Architect specialising in AI-powered search, Elasticsearch, cloud-native platforms, and large-scale observability.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function CVLayout({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
