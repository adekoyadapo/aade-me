"use client";

import React, { useMemo, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { filterPostsByTag, searchPosts, sortPostsByDate, extractAllTags } from "@/lib/blog-utils";
import type { BlogPost } from "@/lib/blog-types";
import BlogCard from "@/components/blog/blog-card";
import BlogSearch from "@/components/blog/blog-search";
import BlogTags from "@/components/blog/blog-tags";
import Pagination from "@/components/blog/pagination";
import Link from "next/link";
import { HiHome } from "react-icons/hi";
import { useRouter, useSearchParams } from "next/navigation";

const POSTS_PER_PAGE = 6;

type Props = {
  initialSearchQuery?: string;
  initialTag?: string | null;
  posts: BlogPost[];
  currentPage: number;
};

export default function BlogListClient({ initialSearchQuery = "", initialTag = null, posts, currentPage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeTag, setActiveTag] = useState<string | null>(initialTag);

  const allTags = extractAllTags(posts);

  const filteredPosts = useMemo(() => {
    let list = sortPostsByDate(posts);
    list = filterPostsByTag(list, activeTag);
    list = searchPosts(list, searchQuery);
    return list;
  }, [searchQuery, activeTag, posts]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const clampedPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (clampedPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const visiblePosts = filteredPosts.slice(startIndex, endIndex);

  const pushWithParams = (updates: Record<string, string | null>, pageOverride?: number) => {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    });
    const nextPage = pageOverride ?? clampedPage;
    const qs = sp.toString();
    const path = nextPage <= 1 ? "/blog" : `/blog/page/${nextPage}`;
    router.push(qs ? `${path}?${qs}` : path);
  };

  const handleSearch = (query: string) => {
    if (query === searchQuery) return; // prevent resetting page on mount/no-op
    setSearchQuery(query);
    // Reset to page 1 path with updated query params
    pushWithParams({ q: query }, 1);
  };

  const handleTagClick = (tag: string | null) => {
    if (tag === activeTag) return;
    setActiveTag(tag);
    pushWithParams({ tag: tag ?? null }, 1);
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pt-20 sm:pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3"
        >
          <div className="flex items-center gap-4 mb-3">
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
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-tight">
            Blog
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Insights on cloud architecture, distributed systems, AI, and modern software engineering practices.
          </p>
        </motion.div>

        {/* Search */}
        <div className="mb-5">
          <BlogSearch onSearch={handleSearch} defaultValue={initialSearchQuery} />
        </div>

        {/* Tags */}
        <div className="mb-6">
          <BlogTags tags={allTags} activeTag={activeTag} onTagClick={handleTagClick} />
        </div>

        {/* Results count */}
        {(searchQuery || activeTag) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-zinc-600 dark:text-zinc-400 mb-5"
          >
            {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"} found
          </motion.p>
        )}

        {/* Blog Grid */}
        {visiblePosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {visiblePosts.map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={clampedPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                pushWithParams({}, page);
              }}
            />
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
