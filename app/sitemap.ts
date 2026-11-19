import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog-repo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aade.me";
  const posts = await getAllPosts();
  const latest = posts.length ? new Date(posts[0].date) : undefined;
  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: latest, changeFrequency: "monthly", priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/cv`, lastModified: latest, changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const post of posts) {
    routes.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  const POSTS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  for (let p = 2; p <= totalPages; p++) {
    routes.push({
      url: `${baseUrl}/blog/page/${p}`,
      lastModified: latest,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return routes;
}
