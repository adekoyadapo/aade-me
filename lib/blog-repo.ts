import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { BlogPost } from "./blog-types";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function computeReadTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function computeExcerpt(text: string, max = 180): string {
  const clean = text
    .replace(/`{3}[\s\S]*?`{3}/g, " ") // strip code blocks
    .replace(/`[^`]+`/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // links -> text
    .replace(/[#>*_~`\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(CONTENT_DIR);
  } catch {
    entries = [];
  }

  const posts: BlogPost[] = [];
  for (const file of entries) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
    const lower = file.toLowerCase();
    // Ignore non-article files like README or files prefixed with underscore
    if (lower === "readme.md" || lower === "readme.mdx" || lower.startsWith("_")) continue;
    const full = path.join(CONTENT_DIR, file);
    const raw = await fs.readFile(full, "utf8");
    const { data, content } = matter(raw);

    const slug = (data.slug as string) || file.replace(/\.(md|mdx)$/i, "");
    const title = (data.title as string) || slug;
    const date = (data.date as string) || new Date().toISOString().slice(0, 10);
    const tags = (data.tags as string[]) || [];
    const author = (data.author as string) || "Ade A.";
    const imageUrl = (data.imageUrl as string) || "/blog/placeholder.jpg";
    const imageAlt = (data.imageAlt as string) || title;
    const excerpt = (data.excerpt as string) || computeExcerpt(content);
    const readTime = (data.readTime as string) || computeReadTime(content);

    posts.push({
      slug,
      title,
      excerpt,
      date,
      readTime,
      tags,
      content,
      author,
      imageUrl,
      imageAlt,
    });
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((p) => p.slug);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function getAdjacentPosts(slug: string): Promise<{ previous: BlogPost | null; next: BlogPost | null }>
{
  const posts = await getAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  return {
    previous: idx > 0 ? posts[idx - 1] : null,
    next: idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null,
  };
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const set = new Set<string>();
  for (const p of posts) for (const t of p.tags) set.add(t);
  return Array.from(set).sort();
}
