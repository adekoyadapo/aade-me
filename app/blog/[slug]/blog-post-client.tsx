"use client";

import React from "react";
import { motion } from "framer-motion";
import { BlogPost } from "@/lib/blog-data";
import { formatDate } from "@/lib/blog-utils";
import BlogNavigation from "@/components/blog/blog-navigation";
import ShareButtons from "@/components/blog/share-buttons";
import Link from "next/link";
import { HiArrowLeft, HiClock, HiCalendar, HiUser } from "react-icons/hi";

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
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pt-28 sm:pt-36 pb-20">
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

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
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
          transition={{ duration: 0.5, delay: 0.2 }}
          className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-700"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(post.content) }}
        />

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
              author: {
                "@type": "Person",
                name: post.author,
              },
              datePublished: post.date,
              keywords: post.tags.join(", "),
            }),
          }}
        />
      </article>
    </main>
  );
}

// Simple markdown-to-HTML converter (for basic formatting)
function formatMarkdown(content: string): string {
  let html = content;

  // Headers
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || "plaintext"}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, "<ul>$1</ul>");

  // Paragraphs
  html = html.replace(/^(?!<[hul]|```)(.*$)/gim, "<p>$1</p>");

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}
