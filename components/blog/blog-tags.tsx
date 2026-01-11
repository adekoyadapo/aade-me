"use client";

import React from "react";
import { motion } from "framer-motion";

type BlogTagsProps = {
  tags: string[];
  activeTag: string | null;
  onTagClick: (tag: string | null) => void;
};

export default function BlogTags({ tags, activeTag, onTagClick }: BlogTagsProps) {
  const allTags = ["All", ...tags];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-wrap gap-2"
    >
      {allTags.map((tag) => (
        <motion.button
          key={tag}
          onClick={() => onTagClick(tag === "All" ? null : tag)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            (tag === "All" && !activeTag) || tag === activeTag
              ? "bg-blue-600 text-white shadow-md scale-105"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tag}
        </motion.button>
      ))}
    </motion.div>
  );
}
