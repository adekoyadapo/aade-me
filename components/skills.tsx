"use client";

import React from "react";
import SectionHeading from "./section-heading";
import { skillsData } from "@/lib/data";
import { useSectionInView } from "@/lib/hooks";
import { motion } from "framer-motion";

const fadeInAnimationVariants = {
  initial: {
    opacity: 0,
    y: 100,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * index,
    },
  }),
};

export default function Skills() {
  const { ref } = useSectionInView("Skills");

  return (
    <section
      id="skills"
      ref={ref}
      className="mb-28 max-w-[53rem] scroll-mt-28 text-center sm:mb-40"
    >
      <SectionHeading>My skills</SectionHeading>
      <ul className="flex flex-wrap justify-center gap-2 text-4xl font-bold tex text-gray-500">
        {skillsData.map(({ name, icon }, index) => (
          <motion.li
            className="relative bg-white border-black rounded-xl px-4 py-4 dark:bg-white/10 dark:text-white/80 hover:grayscale hover:bg-gray-500 dark:hover:bg-gray-200 hover:opacity-90"
            key={index}
            variants={fadeInAnimationVariants}
            initial="initial"
            whileInView="animate"
            viewport={{
              once: true,
            }}
            custom={index}
          >
            {icon}
            <span className="absolute top-0 text-zinc-100 dark:text-zinc-900 text-[9px] left-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              {name}
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
