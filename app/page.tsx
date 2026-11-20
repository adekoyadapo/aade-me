import type { Metadata } from "next";
import Intro from "@/components/intro";
import ProjectStage from "@/components/project-stage";
import LatestWriting from "@/components/latest-writing";
import ContactCta from "@/components/contact-cta";
import { ldJson } from "@/lib/jsonld";
import PageTransition from "@/components/page-transition";

export const metadata: Metadata = {
  title: { absolute: "Ade A. | Lead Architect, Enterprise Solutions Architecture" },
  description: "Lead Architect for enterprise solutions, agentic AI programs and multi-cloud platforms, with deep Elasticsearch, AI search, observability and security experience.",
  alternates: { canonical: "https://aade.me" },
  openGraph: {
    title: "Ade A. | Lead Architect, Enterprise Solutions Architecture",
    description: "Lead Architect for enterprise solutions, agentic AI programs and multi-cloud platforms, with deep Elasticsearch, AI search, observability and security experience.",
    url: "https://aade.me",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ade A. | Lead Architect, Enterprise Solutions Architecture",
    description: "Lead Architect for enterprise solutions, agentic AI programs and multi-cloud platforms, with deep Elasticsearch, AI search, observability and security experience.",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://aade.me/#person",
    name: "Ade A.",
    url: "https://aade.me",
    jobTitle: "Lead Architect, Enterprise Solutions Architecture",
    description: "Lead Architect, Enterprise Solutions Architecture | Agentic AI Programs | Multi-Cloud Platforms",
    worksFor: { "@type": "Organization", name: "Elastic", url: "https://www.elastic.co" },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Federal University of Technology, Akure" },
    knowsAbout: ["Agentic AI", "AI and ML solution architecture", "RAG and enterprise retrieval", "Model Context Protocol", "Vector and hybrid search", "AI evaluation and observability", "Elasticsearch", "Amazon Bedrock", "Kubernetes", "OpenTelemetry", "DevSecOps", "SIEM", "Infrastructure as Code", "AWS", "Azure", "Google Cloud"],
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
