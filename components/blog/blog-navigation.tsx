import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { BlogPost } from "@/lib/blog-types";

type BlogNavigationProps = {
  previous: BlogPost | null;
  next: BlogPost | null;
};

const card =
  "group flex min-w-0 max-w-full items-center gap-3 sm:flex-1 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-fg";

export default function BlogNavigation({ previous, next }: BlogNavigationProps) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="More posts"
      className="mt-12 flex min-w-0 max-w-full flex-col gap-3 border-t sm:flex-row sm:items-stretch sm:gap-4 border-line pt-8"
    >
      {previous ? (
        <Link href={`/blog/${previous.slug}`} className={card}>
          <ArrowLeft className="h-5 w-5 text-mute transition-transform group-hover:-translate-x-1" />
          <div className="min-w-0 flex-1">
            <p className="micro mb-1">Previous</p>
            <p className="truncate text-sm font-medium">{previous.title}</p>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block sm:flex-1" />
      )}

      {next ? (
        <Link href={`/blog/${next.slug}`} className={card}>
          <div className="min-w-0 flex-1 text-right">
            <p className="micro mb-1">Next</p>
            <p className="truncate text-sm font-medium">{next.title}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-mute transition-transform group-hover:translate-x-1" />
        </Link>
      ) : (
        <div className="hidden sm:block sm:flex-1" />
      )}
    </nav>
  );
}
