"use client";

import React, { useState, useEffect } from "react";
import { HiSearch, HiX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "@/lib/blog-utils";

type BlogSearchProps = {
  onSearch: (query: string) => void;
};

export default function BlogSearch({ onSearch }: BlogSearchProps) {
  const [query, setQuery] = useState("");

  // Debounced search
  useEffect(() => {
    const debouncedSearch = debounce((searchQuery: string) => {
      onSearch(searchQuery);
    }, 300);

    debouncedSearch(query);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="relative">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search blog posts..."
          className="w-full pl-12 pr-12 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Clear search"
            >
              <HiX className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
