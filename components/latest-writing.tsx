import Link from "next/link";
import { getAllPosts } from "@/lib/blog-repo";
import { formatDate } from "@/lib/blog-utils";
import SectionHeading from "./section-heading";

/** Three most recent posts as rows, newest first. */
export default async function LatestWriting() {
  const posts = (await getAllPosts()).slice(0, 3);
  return (
    <section id="writing" className="band">
      <div className="wide">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading>Latest writing</SectionHeading>
          <Link href="/blog" className="micro mb-8 underline underline-offset-4 hover:text-fg">
            All posts
          </Link>
        </div>
        <ul className="border-t border-line">
          {posts.map((post) => (
            <li key={post.slug} className="border-b border-line">
              <Link
                href={`/blog/${post.slug}`}
                className="group grid gap-2 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem] lg:items-baseline lg:gap-10"
              >
                <h3 className="text-[length:var(--fs-body)] font-medium leading-snug sm:text-xl underline-offset-4 group-hover:underline">
                  {post.title}
                </h3>
                <p className="line-clamp-2 text-mute">{post.excerpt}</p>
                <time dateTime={post.date} className="micro lg:text-right">
                  {formatDate(post.date)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
