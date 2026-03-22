"use client";

import React from "react";
import SectionHeading from "./section-heading";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/hooks";

export default function About() {
  const { ref } = useSectionInView("About");

  return (
    <motion.section
      ref={ref}
      className="mb-28 max-w-[45rem] text-center leading-8 sm:mb-40 scroll-mt-28"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      id="about"
    >
      <SectionHeading>About me</SectionHeading>
      <p className="mb-3 text-left">
        I have spent 15+ years at the intersection of infrastructure, cloud, and software — starting with physical data centres and routing tables in Lagos, and working my way through DevOps, SRE, platform engineering, and now{" "}
        <span className="font-bold">Enterprise Solutions Architecture</span>. Each role taught me that the best technical decisions are the ones grounded in real-world constraints, not just what looks clean on a whiteboard.
      </p>
      <p className="mb-3 text-left">
        Today I work as a <span className="font-bold italic">Customer Architect at Elastic</span>, helping enterprise teams unlock the full potential of the Elastic Stack across{" "}
        <span className="font-bold">Search, Observability, and Security</span>. That means designing AI-powered search pipelines with vector embeddings and ELSER, building petabyte-scale log analytics platforms with OpenTelemetry and LogsDB, and architecting SIEM and threat-detection solutions for Fortune 500 environments.
      </p>
      <p className="mb-3 text-left">
        The thread running through all of it is the same: I like hard problems. Whether it is shaving 65% off Elasticsearch storage costs, wiring up an{" "}
        <span className="font-bold italic">AI/ML inference pipeline</span>{" "}in the cloud, or helping a platform team get their first real SLO in place — I get satisfaction from making complex systems simpler and more reliable for the people who depend on them.
      </p>

    </motion.section>
  );
}
