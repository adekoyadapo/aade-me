import type { Metadata } from "next";
import About from "@/components/about";
import Contact from "@/components/contact";
import Experience from "@/components/experience";
import Intro from "@/components/intro";
import Projects from "@/components/projects";
import SectionDivider from "@/components/section-divider";
import Skills from "@/components/skills";
import Badges from "@/components/badges";

export const metadata: Metadata = {
  title: "Ade A. | Enterprise Architect",
  description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
  alternates: { canonical: "https://aade.me" },
  openGraph: {
    title: "Ade A. | Enterprise Architect",
    description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
    url: "https://aade.me",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ade A. | Enterprise Architect",
    description: "Enterprise Architect specializing in AI/ML platforms, cloud-native infrastructure, Elasticsearch, observability, and large-scale distributed systems.",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
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
    <main className="flex flex-col items-center px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Intro />
      <SectionDivider />
      <About />
      <Projects />
      <Skills />
      <Experience />
      <Badges />
      <Contact />
    </main>
  );
}
