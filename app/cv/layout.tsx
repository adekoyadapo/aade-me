import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Ade A. | Resume — Enterprise Solutions Architect" },
  description: "Resume of Ade A., Enterprise Solutions Architect specialising in AI-powered search, cloud-native platforms, Elasticsearch, and large-scale observability.",
  alternates: { canonical: "https://aade.me/cv" },
  robots: { index: false, follow: false },
};

export default function CVLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
