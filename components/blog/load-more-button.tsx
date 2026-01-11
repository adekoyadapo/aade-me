"use client";

import React from "react";
import { motion } from "framer-motion";
import { HiChevronDown } from "react-icons/hi";

type LoadMoreButtonProps = {
  onClick: () => void;
  isVisible: boolean;
};

export default function LoadMoreButton({ onClick, isVisible }: LoadMoreButtonProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex justify-center mt-12"
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
      >
        <span>Load More</span>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <HiChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
