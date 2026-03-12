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
  title: "Ade A. | IT Infrastructure Architect",
  description: "IT Infrastructure Architect with 13 years of experience in cloud architecture, distributed systems, AI, and modern software engineering practices.",
  alternates: { canonical: "https://aade.me" },
  openGraph: {
    title: "Ade A. | IT Infrastructure Architect",
    description: "IT Infrastructure Architect with 13 years of experience in cloud architecture, distributed systems, AI, and modern software engineering practices.",
    url: "https://aade.me",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ade A. | IT Infrastructure Architect",
    description: "IT Infrastructure Architect with 13 years of experience in cloud architecture, distributed systems, AI, and modern software engineering practices.",
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
