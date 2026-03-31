import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Ade A. | Resume — Enterprise Solutions Architect" },
  description: "Resume of Ade Adekoya, Enterprise Solutions Architect specialising in AI-powered search, Elasticsearch, cloud-native platforms, and large-scale observability.",
  alternates: { canonical: "https://aade.me/cv" },
  openGraph: {
    title: "Ade A. | Resume — Enterprise Solutions Architect",
    description: "Resume of Ade Adekoya, Enterprise Solutions Architect specialising in AI-powered search, Elasticsearch, cloud-native platforms, and large-scale observability.",
    url: "https://aade.me/cv",
    type: "profile",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Ade A. — Enterprise Solutions Architect" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ade A. | Resume — Enterprise Solutions Architect",
    description: "Resume of Ade Adekoya, Enterprise Solutions Architect specialising in AI-powered search, Elasticsearch, cloud-native platforms, and large-scale observability.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function CVLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
