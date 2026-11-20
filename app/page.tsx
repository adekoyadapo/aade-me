import type { Metadata } from "next";
import Intro from "@/components/intro";
import ProjectStage from "@/components/project-stage";
import LatestWriting from "@/components/latest-writing";
import ContactCta from "@/components/contact-cta";
import { ldJson } from "@/lib/jsonld";
import PageTransition from "@/components/page-transition";

export const metadata: Metadata = {
  title: { absolute: "Ade A. | Enterprise Architect for Elasticsearch, Cloud, AI" },
  description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
  alternates: { canonical: "https://aade.me" },
  openGraph: {
    title: "Ade A. | Enterprise Architect for Elasticsearch, Cloud, AI",
    description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
    url: "https://aade.me",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ade A. | Enterprise Architect for Elasticsearch, Cloud, AI",
    description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://aade.me/#person",
    name: "Ade A.",
    url: "https://aade.me",
    jobTitle: "Enterprise Architect",
    sameAs: [
      "https://www.linkedin.com/in/adekoya-adedapomola/",
      "https://github.com/adekoyadapo",
      "https://twitter.com/Dapo_Ace",
      "https://blog.360ace.net",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ade A.",
    url: "https://aade.me",
  },
];

export default function Home() {
  return (
    <PageTransition>
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      <Intro />
      <ProjectStage />
      <LatestWriting />
      <ContactCta />
    </main>
    </PageTransition>
  );
}
