import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { motion } from "framer-motion";
import { blogPosts } from "@/lib/blog-data";
import { getPostBySlug, formatDate, getAdjacentPosts } from "@/lib/blog-utils";
import BlogNavigation from "@/components/blog/blog-navigation";
import ShareButtons from "@/components/blog/share-buttons";
import Link from "next/link";
import { HiArrowLeft, HiClock, HiCalendar, HiUser } from "react-icons/hi";
import BlogPostClient from "./blog-post-client";

// Generate static params for all blog posts
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | Ade A. Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags as string[],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { previous, next } = getAdjacentPosts(slug);
  const postUrl = `https://aade.me/blog/${post.slug}`;

  return (
    <BlogPostClient
      post={post}
      previous={previous}
      next={next}
      postUrl={postUrl}
    />
  );
}
