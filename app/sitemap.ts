import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog-repo";

/** Bump when the page content changes. Dates are hand-kept so a redeploy does not fake freshness. */
const PAGE_UPDATED = { about: "2026-11-19", contact: "2026-11-19", cv: "2026-11-19" };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aade.me";
  const posts = await getAllPosts();
  const latest = posts.length ? new Date(posts[0].date) : undefined;
  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: latest, changeFrequency: "monthly", priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(PAGE_UPDATED.about), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(PAGE_UPDATED.contact), changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/cv`, lastModified: new Date(PAGE_UPDATED.cv), changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const post of posts) {
    routes.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return routes;
}
