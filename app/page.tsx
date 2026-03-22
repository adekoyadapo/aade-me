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

export default function Home() {
  return (
    <main className="flex flex-col items-center px-4">
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
