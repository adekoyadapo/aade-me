import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getAllSlugs, getPostBySlug, getAdjacentPosts } from "@/lib/blog-repo";
import BlogPostClient from "./blog-post-client";

// Generate static params for all blog posts
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const postUrl = `https://aade.me/blog/${post.slug}`;
  const imageUrl = post.imageUrl.startsWith("http") ? post.imageUrl : `https://aade.me${post.imageUrl}`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: postUrl,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [post.author],
      tags: post.tags as string[],
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [imageUrl],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { previous, next } = await getAdjacentPosts(slug);
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
