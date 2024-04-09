"use client";

import React from "react";
import SectionHeading from "./section-heading";
import { badgesData } from "@/lib/data";
import { useSectionInView } from "@/lib/hooks";
import { motion } from "framer-motion";
import Image from "next/image";

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

export default function Badges() {
  const { ref } = useSectionInView('Certifications');

  return (
    <section
      id="certifications"
      ref={ref}
      className="mb-28 max-w-[53rem] scroll-mt-28 text-center sm:mb-40"
    >
      <SectionHeading>Certification Badges</SectionHeading>
      <ul className="flex flex-wrap justify-center gap-2 text-4xl font-bold tex text-gray-500">
        {badgesData.map(({ link, imageUrl }, index) => (
          <motion.li
            className="relative bg-white border-black rounded-xl px-4 py-4 dark:bg-white/10 dark:text-white/80"
            key={index}
            variants={fadeInAnimationVariants}
            initial="initial"
            whileInView="animate"
            viewport={{
              once: true,
            }}
            custom={index}
          >
            <a href={link} target="_blank">
              <Image
                src={imageUrl}
                alt="Project I worked on"
                quality={95}
                width={120}
                height={120}
              />
            </a>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
