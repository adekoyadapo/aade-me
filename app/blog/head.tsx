import React from "react";
import { getAllPosts } from "@/lib/blog-repo";

const POSTS_PER_PAGE = 6;

export default async function Head() {
  const posts = await getAllPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const hasNext = totalPages > 1;

  return (
    <>
      {hasNext ? <link rel="next" href={`/blog/page/2`} /> : null}
    </>
  );
}

