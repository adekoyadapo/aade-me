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
        Experienced Infrastructure Architect with a background in{" "}
        <span className="font-bold">IT infrastructure and networking,{" "}</span>
        and indept expertise in{" "}
        <span className="font-bold italic">DevOps, SRE and Platform Engineering{" "}</span>-
        skilled in designing and implementing complex <span className="font-bold">cloud solutions</span> that meets business requirements.
      </p>
      <p className="mb-3 text-left">
        <span>I am passionate about using technology and years of experience to improve operational efficiency and deliver measurable business value.</span>
      </p>
      <p className="mb-3 text-left">
        I currently expanding my skills and knowledge into designing and implementing infrastructure geared towards{" "}<span className="font-bold italic">Big Data, Machine Learning and AI based solutions{" "}</span>
        in the cloud to improve on exisiting solutions and ensure optimal business value.
      </p>

    </motion.section>
  );
}
