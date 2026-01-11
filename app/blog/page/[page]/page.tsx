import React, { Suspense } from "react";
import BlogListClient from "../../blog-list-client";
import { getAllPosts } from "@/lib/blog-repo";
import type { Metadata } from "next";

const POSTS_PER_PAGE = 6;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const params = [] as { page: string }[];
  for (let p = 2; p <= totalPages; p++) params.push({ page: String(p) });
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const currentPage = Number(page) || 1;
  const base = "https://aade.me";
  const title = currentPage > 1 ? `Blog — Page ${currentPage}` : "Blog";
  const canonical = currentPage > 1 ? `${base}/blog/page/${currentPage}` : `${base}/blog`;

  return {
    title: `${title} | Ade A.`,
    description: "Insights on cloud architecture, distributed systems, AI, and modern software engineering practices.",
    alternates: { canonical },
    openGraph: { title, description: "Insights on cloud architecture, distributed systems, AI, and modern software engineering practices.", type: "website", url: canonical },
    twitter: { card: "summary_large_image", title, description: "Insights on cloud architecture, distributed systems, AI, and modern software engineering practices." },
    robots: { index: true, follow: true },
  } as const;
}

export default async function BlogPageNumber({ params, searchParams }: { params: Promise<{ page: string }>, searchParams: { q?: string; tag?: string } }) {
  const { page } = await params;
  const currentPage = Math.max(1, Number(page) || 1);
  const posts = await getAllPosts();

  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pt-20 sm:pt-24 pb-16" />}> 
      <BlogListClient initialSearchQuery={searchParams?.q ?? ""} initialTag={(searchParams?.tag as string | undefined) ?? null} posts={posts} currentPage={currentPage} />
    </Suspense>
  );
}

