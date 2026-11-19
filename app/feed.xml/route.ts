import { getAllPosts } from "@/lib/blog-repo";

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const base = "https://aade.me";
  const posts = await getAllPosts();
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/blog/${p.slug}</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");
  const lastBuild = posts.length ? new Date(posts[0].date).toUTCString() : new Date(0).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ade A. Blog</title>
    <link>${base}/blog</link>
    <description>Notes on Elasticsearch, cloud architecture, distributed systems and AI.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
