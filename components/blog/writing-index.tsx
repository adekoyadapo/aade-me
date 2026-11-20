import Link from "next/link";
import type { BlogPost } from "@/lib/blog-types";
import IndexIsland from "./writing-index-island";
import WritingViewShell from "./writing-view";
import { groupIntoDrawers } from "@/lib/taxonomy";

const thumb = (url: string) => `/_next/image?url=${encodeURIComponent(url)}&w=384&q=75`;

/**
 * Writing index. Two views over the same posts: the filing cabinet (drawers by topic, one drawer per post, see lib/taxonomy.ts) and the
 * dense list grouped by year (the island adds tag filtering and the hover preview). Both are server-rendered; the shell picks which shows.
 */
export default function WritingIndex({ posts }: { posts: BlogPost[] }) {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of new Set(p.tags)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const years = new Map<string, BlogPost[]>();
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    years.set(y, [...(years.get(y) ?? []), p]);
  }

  const short = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });

  const list = (
    <>
      <IndexIsland tags={tags} total={posts.length} />
      <div className="idx-list">
        {[...years.entries()].map(([year, list]) => (
          <section key={year} className="idx-year" data-year>
            <h2 className="idx-year-title">
              {year} <span aria-hidden="true">::</span>
            </h2>
            <ul className="idx-card">
              {list.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="idx-row"
                    data-tags={post.tags.join("|")}
                    data-img={thumb(post.imageUrl)}
                  >
                    <span role="heading" aria-level={3} className="idx-title" data-title>
                      {post.title}
                    </span>
                    <span hidden data-excerpt>
                      {post.excerpt}
                    </span>
                    <span aria-hidden="true" className="idx-leader" />
                    <span className="idx-meta">
                      <time dateTime={post.date}>{short(post.date)}</time>
                      {post.tags[0] && <span className="idx-tag">{post.tags[0]}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );

  return (
    <div id="writing-index">
      <h1 className="idx-h1 rise">
        Writing <span aria-hidden="true">::</span>
      </h1>
      <p className="idx-intro rise">
        Notes on cloud architecture, Elasticsearch, distributed systems and AI, as I publish them. Follow along in your reader via{" "}
        <a href="/feed.xml">the feed</a>.
      </p>
      <WritingViewShell drawers={groupIntoDrawers(posts)} list={list} />
    </div>
  );
}
