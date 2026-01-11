"use client";

import React from "react";
import { motion } from "framer-motion";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const makeRange = () => {
    const pages: number[] = [];
    const delta = 1; // how many pages to show around current
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    // Always show first/last with gaps
    if (start > 1) pages.push(1);
    if (start > 2) pages.push(-1); // gap marker

    for (let p = start; p <= end; p++) pages.push(p);

    if (end < totalPages - 1) pages.push(-1); // gap marker
    if (end < totalPages) pages.push(totalPages);

    return pages;
  };

  const pages = makeRange();

  return (
    <motion.nav
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-2 select-none"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        aria-label="Previous page"
      >
        <HiChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pages.map((p, idx) =>
        p === -1 ? (
          <span key={`gap-${idx}`} className="px-2 text-zinc-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all border ${
              p === currentPage
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <HiChevronRight className="w-5 h-5" />
      </button>
    </motion.nav>
  );
}

