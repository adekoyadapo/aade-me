"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { blogPosts } from "@/lib/blog-data";
import { filterPostsByTag, searchPosts, sortPostsByDate, getAllTags } from "@/lib/blog-utils";
import BlogCard from "@/components/blog/blog-card";
import BlogSearch from "@/components/blog/blog-search";
import BlogTags from "@/components/blog/blog-tags";
import LoadMoreButton from "@/components/blog/load-more-button";
import Link from "next/link";
import { HiArrowLeft, HiHome } from "react-icons/hi";

const INITIAL_POSTS_COUNT = 6;

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_POSTS_COUNT);

  // Get all tags
  const allTags = getAllTags();

  // Filter and search posts
  const filteredPosts = useMemo(() => {
    let posts = sortPostsByDate(blogPosts);

    // Apply tag filter
    posts = filterPostsByTag(posts, activeTag);

    // Apply search
    posts = searchPosts(posts, searchQuery);

    return posts;
  }, [searchQuery, activeTag]);

  // Visible posts based on load more
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + INITIAL_POSTS_COUNT);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(INITIAL_POSTS_COUNT); // Reset visible count on new search
  };

  const handleTagClick = (tag: string | null) => {
    setActiveTag(tag);
    setVisibleCount(INITIAL_POSTS_COUNT); // Reset visible count on tag change
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pt-28 sm:pt-36 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <HiHome className="w-4 h-4" />
              Home
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Blog
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Insights on cloud architecture, distributed systems, AI, and modern software engineering practices.
          </p>
        </motion.div>

        {/* Search */}
        <div className="mb-6">
          <BlogSearch onSearch={handleSearch} />
        </div>

        {/* Tags */}
        <div className="mb-8">
          <BlogTags tags={allTags} activeTag={activeTag} onTagClick={handleTagClick} />
        </div>

        {/* Results count */}
        {(searchQuery || activeTag) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-zinc-600 dark:text-zinc-400 mb-6"
          >
            {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"} found
          </motion.p>
        )}

        {/* Blog Grid */}
        {visiblePosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {visiblePosts.map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </div>

            {/* Load More Button */}
            <LoadMoreButton onClick={handleLoadMore} isVisible={hasMore} />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg text-zinc-500 dark:text-zinc-400">
              No blog posts found. Try adjusting your search or filters.
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
