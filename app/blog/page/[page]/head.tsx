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

  return (
    <>
      {prevHref ? <link rel="prev" href={prevHref} /> : null}
      {nextHref ? <link rel="next" href={nextHref} /> : null}
    </>
  );
}

