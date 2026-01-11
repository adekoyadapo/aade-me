import React, { Suspense } from "react";
import BlogListClient from "./blog-list-client";
import { getAllPosts } from "@/lib/blog-repo";

export async function generateMetadata() {
  const title = "Blog";
  const description = "Insights on cloud architecture, distributed systems, AI, and modern software engineering practices.";
  const base = "https://aade.me";
  const canonical = `${base}/blog`;

  return {
    title: `${title} | Ade A.`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  } as const;
}

export default async function BlogPage({ searchParams }: { searchParams: { page?: string; q?: string; tag?: string } }) {
  const initialSearchQuery = searchParams?.q ?? "";
  const initialTag = (searchParams?.tag as string | undefined) ?? null;
  const currentPage = 1;

  const POSTS_PER_PAGE = 6;
  const posts = await getAllPosts();
  const sorted = posts;
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const slice = sorted.slice(startIndex, startIndex + POSTS_PER_PAGE);
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog",
    hasPart: slice.map((p, i) => ({
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: p.date,
      url: `https://aade.me/blog/${p.slug}`,
      position: startIndex + i + 1,
    })),
  };

  return (
    <>
      <Suspense fallback={<main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pt-20 sm:pt-24 pb-16" />}> 
        <BlogListClient initialSearchQuery={initialSearchQuery} initialTag={initialTag} posts={posts} currentPage={currentPage} />
      </Suspense>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />
    </>
  );
}
