import type { BlogPost } from "./blog-types";
import { previewOf } from "./post-preview";

/**
 * Filing cabinet taxonomy. Five fixed drawers; every post lives in exactly ONE of them, so the counts add up to the total.
 *
 * Rule: walk MATCH_ORDER top to bottom and take the first drawer whose tag list intersects the post's tags (case-insensitive).
 * A post whose tags match nothing goes to the last drawer, "Architecture", which is the catch-all. The priority order is
 * deliberately not the display order: the specific, high-volume subject (Elasticsearch) claims a post before the broader themes do,
 * and Observability claims before AI so "AI observability" files under what it is about rather than the buzzword.
 */
export type DrawerId = "elasticsearch" | "ai" | "observability" | "platform" | "architecture";

export type DrawerDef = { id: DrawerId; name: string; blurb: string; tags: readonly string[] };

/** Display order, top drawer first. */
export const DRAWERS: readonly DrawerDef[] = [
  { id: "elasticsearch", name: "Elasticsearch", blurb: "Search, vectors, storage, stack operations", tags: ["Elasticsearch"] },
  { id: "ai", name: "AI and Search", blurb: "Agents, RAG, retrieval", tags: ["AI/ML", "Search", "RAG", "Vector Search", "Vector Databases", "Semantic Search"] },
  { id: "observability", name: "Observability", blurb: "Telemetry, monitoring, SLOs", tags: ["Observability"] },
  { id: "platform", name: "Platform and Cloud", blurb: "Kubernetes, cloud, platform engineering", tags: ["Cloud", "Kubernetes", "Platform Engineering"] },
  { id: "architecture", name: "Architecture", blurb: "Systems design and everything else", tags: ["Architecture", "Distributed Systems"] },
];

/** Priority order used to assign a post to one drawer (first match wins). */
export const MATCH_ORDER: readonly DrawerId[] = ["elasticsearch", "observability", "ai", "platform", "architecture"];

const byId = new Map(DRAWERS.map((d) => [d.id, d]));
const norm = (s: string) => s.trim().toLowerCase();

export function drawerFor(post: Pick<BlogPost, "tags">): DrawerId {
  const tags = new Set(post.tags.map(norm));
  for (const id of MATCH_ORDER) {
    if (byId.get(id)!.tags.some((t) => tags.has(norm(t)))) return id;
  }
  return "architecture";
}

/** One folder. `lead`, `h`, `hero`, `tags` and `readTime` feed the live preview on the sheet that leaves the folder (about 0.6 KB per post). */
export type CabinetPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readTime: string;
  hero: string;
  tags: string[];
  lead: string;
  h?: string;
};
export type CabinetDrawer = { id: DrawerId; name: string; blurb: string; posts: CabinetPost[] };

/** Group posts into drawers (display order), newest first inside each drawer. The post count across drawers equals posts.length. */
export function groupIntoDrawers(posts: readonly BlogPost[]): CabinetDrawer[] {
  const groups = new Map<DrawerId, CabinetPost[]>(DRAWERS.map((d) => [d.id, []]));
  for (const p of posts) {
    const pv = previewOf(p.content);
    groups.get(drawerFor(p))!.push({
      slug: p.slug,
      title: p.title,
      date: p.date,
      excerpt: p.excerpt,
      readTime: p.readTime,
      hero: p.imageUrl,
      tags: [...p.tags],
      lead: pv.lead,
      ...(pv.h ? { h: pv.h } : {}),
    });
  }
  return DRAWERS.map((d) => ({
    id: d.id,
    name: d.name,
    blurb: d.blurb,
    posts: groups.get(d.id)!.sort((a, b) => b.date.localeCompare(a.date)),
  }));
}
