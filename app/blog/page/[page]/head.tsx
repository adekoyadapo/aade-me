import React from "react";
import { getAllPosts } from "@/lib/blog-repo";

const POSTS_PER_PAGE = 6;

export default async function Head({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const currentPage = Math.max(1, Number(page) || 1);
  const posts = await getAllPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));

  const prevHref = currentPage > 2 ? `/blog/page/${currentPage - 1}` : currentPage === 2 ? `/blog` : null;
  const nextHref = currentPage < totalPages ? `/blog/page/${currentPage + 1}` : null;

  const canonical = `https://aade.me/blog/page/${currentPage}`;

  return (
    <>
      <link rel="canonical" href={canonical} />
      {prevHref ? <link rel="prev" href={`https://aade.me${prevHref}`} /> : null}
      {nextHref ? <link rel="next" href={`https://aade.me${nextHref}`} /> : null}
    </>
  );
}

