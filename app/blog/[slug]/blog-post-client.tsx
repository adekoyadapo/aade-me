"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BlogPost } from "@/lib/blog-types";
import { formatDate } from "@/lib/blog-utils";
import BlogNavigation from "@/components/blog/blog-navigation";
import ShareButtons from "@/components/blog/share-buttons";
import Link from "next/link";
import { HiArrowLeft, HiClock, HiCalendar, HiUser } from "react-icons/hi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

type BlogPostClientProps = {
  post: BlogPost;
  previous: BlogPost | null;
  next: BlogPost | null;
  postUrl: string;
};

export default function BlogPostClient({
  post,
  previous,
  next,
  postUrl,
}: BlogPostClientProps) {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pt-24 sm:pt-28 pb-16">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative w-full aspect-video rounded-xl overflow-hidden mb-8 bg-zinc-100 dark:bg-zinc-800"
        >
          <Image
            src={post.imageUrl}
            alt={post.imageAlt}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            <span className="flex items-center gap-2">
              <HiCalendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-2">
              <HiClock className="w-4 h-4" />
              {post.readTime}
            </span>
            <span className="flex items-center gap-2">
              <HiUser className="w-4 h-4" />
              {post.author}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Share Buttons */}
          <ShareButtons title={post.title} url={postUrl} />
        </motion.header>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="prose prose-zinc dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100
            prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
            prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-zinc-200 dark:prose-h2:border-zinc-800
            prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
            prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-semibold
            prose-code:text-pink-600 dark:prose-code:text-pink-400
            prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800
            prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-zinc-900 dark:prose-pre:bg-zinc-950
            prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800
            prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
            prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-li:my-2
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500
            prose-blockquote:pl-4 prose-blockquote:italic
            prose-blockquote:text-zinc-600 dark:prose-blockquote:text-zinc-400
            prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800 prose-hr:my-8
            [&_svg]:block [&_svg]:max-w-full [&_svg]:my-6
            prose-table:w-full prose-table:border-collapse prose-table:my-6
            prose-th:border prose-th:border-zinc-300 dark:prose-th:border-zinc-700 prose-th:px-3 prose-th:py-2 prose-th:bg-zinc-100 dark:prose-th:bg-zinc-800 prose-th:text-left prose-th:font-semibold prose-th:text-sm
            prose-td:border prose-td:border-zinc-200 dark:prose-td:border-zinc-700 prose-td:px-3 prose-td:py-2 prose-td:text-sm
            prose-tr:even:bg-zinc-50 dark:prose-tr:even:bg-zinc-800/40"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {post.content}
          </ReactMarkdown>
        </motion.div>

        {/* Navigation */}
        <BlogNavigation previous={previous} next={next} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: post.excerpt,
              url: postUrl,
              image: post.imageUrl,
              author: {
                "@type": "Person",
                name: post.author,
                url: "https://aade.me",
              },
              publisher: {
                "@type": "Person",
                name: "Ade A.",
                url: "https://aade.me",
              },
              datePublished: post.date,
              dateModified: post.date,
              mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
              keywords: post.tags.join(", "),
            }),
          }}
        />
      </article>
    </main>
  );
}
