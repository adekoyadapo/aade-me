import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog-repo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aade.me";
  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
  ];

  const posts = await getAllPosts();
  for (const post of posts) {
    routes.push({ url: `${baseUrl}/blog/${post.slug}`, lastModified: new Date(post.date) });
  }

  const POSTS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  for (let p = 2; p <= totalPages; p++) {
    routes.push({ url: `${baseUrl}/blog/page/${p}`, lastModified: new Date() });
  }

  return routes;
}
