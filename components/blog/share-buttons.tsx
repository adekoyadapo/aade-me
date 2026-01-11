"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { HiShare } from "react-icons/hi";
import { FaTwitter, FaLinkedin, FaLink } from "react-icons/fa";
import toast from "react-hot-toast";

type ShareButtonsProps = {
  title: string;
  url: string;
};

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareOnTwitter = () => {
    const text = encodeURIComponent(title);
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareOnLinkedIn = () => {
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3"
    >
      <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <HiShare className="w-4 h-4" />
        Share:
      </span>
      <div className="flex gap-2">
        <motion.button
          onClick={shareOnTwitter}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-500 hover:text-white transition-colors"
          aria-label="Share on Twitter"
        >
          <FaTwitter className="w-4 h-4" />
        </motion.button>
        <motion.button
          onClick={shareOnLinkedIn}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-700 hover:text-white transition-colors"
          aria-label="Share on LinkedIn"
        >
          <FaLinkedin className="w-4 h-4" />
        </motion.button>
        <motion.button
          onClick={copyToClipboard}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`p-2 rounded-full transition-colors ${
            copied
              ? "bg-green-500 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
          aria-label="Copy link"
        >
          <FaLink className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
