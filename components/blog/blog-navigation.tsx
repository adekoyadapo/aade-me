"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi";
import { BlogPost } from "@/lib/blog-data";

type BlogNavigationProps = {
  previous: BlogPost | null;
  next: BlogPost | null;
};

export default function BlogNavigation({ previous, next }: BlogNavigationProps) {
  if (!previous && !next) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-between items-center gap-4 mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800"
    >
      {/* Previous Post */}
      {previous ? (
        <Link
          href={`/blog/${previous.slug}`}
          className="group flex-1 flex items-center gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800"
        >
          <HiArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors group-hover:-translate-x-1" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Previous</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {previous.title}
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {/* Next Post */}
      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex-1 flex items-center gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Next</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {next.title}
            </p>
          </div>
          <HiArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors group-hover:translate-x-1" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </motion.nav>
  );
}
