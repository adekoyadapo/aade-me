"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BlogPost } from "@/lib/blog-data";
import { formatDate } from "@/lib/blog-utils";
import { HiClock, HiCalendar } from "react-icons/hi";

type BlogCardProps = {
  post: BlogPost;
  index: number;
};

export default function BlogCard({ post, index }: BlogCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        delay: 0.1 * (index % 6),
        duration: 0.5,
      }}
      className="group"
    >
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:scale-[1.02]">
          {/* Image */}
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={post.imageUrl}
              alt={post.imageAlt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Colored overlay based on primary tag */}
            <div className={`absolute inset-0 ${getTagColor(post.tags[0])} opacity-10`} />
          </div>

          <div className="p-6">
            {/* Title */}
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {post.title}
            </h3>

            {/* Excerpt */}
            <p className="text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">
              {post.excerpt}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-500 mb-4">
              <span className="flex items-center gap-1">
                <HiCalendar className="w-4 h-4" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1">
                <HiClock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// Helper function to get tag color
function getTagColor(tag: string): string {
  const colorMap: { [key: string]: string } = {
    Cloud: "bg-blue-500",
    AI: "bg-purple-500",
    Architecture: "bg-green-500",
    Search: "bg-yellow-500",
    Database: "bg-red-500",
    Observability: "bg-indigo-500",
    Automation: "bg-pink-500",
  };

  return colorMap[tag] || "bg-zinc-500";
}
