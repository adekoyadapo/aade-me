import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getAllSlugs, getPostBySlug, getAdjacentPosts } from "@/lib/blog-repo";
import Image from "next/image";
import { ldJson } from "@/lib/jsonld";
import PageTransition from "@/components/page-transition";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, User, Pencil, Close } from "@/components/icons";
import { formatDate } from "@/lib/blog-utils";
import { renderMarkdown } from "@/lib/markdown";
import { extractFAQItems } from "@/lib/faq";
import BlogNavigation from "@/components/blog/blog-navigation";
import ShareButtons from "@/components/blog/share-buttons";
import PostIslands from "@/components/blog/post-islands";
import PostFx from "@/components/blog/post-fx";

// Generate static params for all blog posts
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

/** Meta descriptions are cut at a word boundary to stay within 160 characters. The full excerpt stays in the JSON-LD and the page. */
function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1).replace(/\s+\S*$/, "").replace(/[\s,;:.\-]+$/, "");
  return `${cut}…`;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const postUrl = `https://aade.me/blog/${post.slug}`;
  const metaDescription = clip(post.excerpt, 160);
  const imageUrl = post.imageUrl.startsWith("http") ? post.imageUrl : `https://aade.me${post.imageUrl}`;

  return {
    // Keep the <title> within about 60 characters: drop the site suffix when the post title is already long.
    title: post.title.length + " | Ade A.".length <= 60 ? post.title : { absolute: post.title },
    description: metaDescription,
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description: metaDescription,
      type: "article",
      siteName: "Ade A.",
      locale: "en_US",
      url: postUrl,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      tags: post.tags as string[],
      images: [{ url: imageUrl, alt: post.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: metaDescription,
      images: [imageUrl],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { previous, next } = await getAdjacentPosts(slug);
  const postUrl = `https://aade.me/blog/${post.slug}`;

  const { html, toc } = await renderMarkdown(post.content);

  const faqItems = extractFAQItems(post.content);
  const graph: object[] = [
    {
      "@type": "BlogPosting",
      "@id": `${postUrl}#article`,
      headline: post.title,
      description: post.excerpt,
      url: postUrl,
      image: post.imageUrl.startsWith("http") ? post.imageUrl : `https://aade.me${post.imageUrl}`,
      author: { "@type": "Person", name: post.author, url: "https://aade.me" },
      publisher: { "@type": "Person", name: "Ade A.", url: "https://aade.me" },
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
      keywords: post.tags.join(", "),
    },
  ];
  graph.push({
    "@type": "BreadcrumbList",
    "@id": `${postUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://aade.me/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://aade.me/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  });
  if (faqItems) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${postUrl}#faq`,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  const tocLinks = (
    <ul className="space-y-1.5 text-sm">
      {toc.map((t) => (
        <li key={t.id} className={t.depth === 3 ? "pl-3" : undefined}>
          <a
            data-toc-link
            href={`#${t.id}`}
            className="block text-mute hover:text-fg transition-colors"
          >
            {t.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <PageTransition>
    <main className="min-h-svh page-top">
      <PostIslands />
      <PostFx />
      <article className="gutter">
        <div className="post-paper" data-sheet-claim>
        <Link
          href="/blog"
          data-rise
          data-cab-close
          aria-label="Close and return to the writing index"
          className="post-x"
        >
          <Close className="h-5 w-5" />
        </Link>
        <Link
          href="/blog"
          data-rise
          data-pv
          data-cab-close
          className="inline-flex items-center gap-2 text-sm text-mute hover:text-fg transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <div data-rise data-pv className="post-hero relative w-full overflow-hidden rounded-xl mb-8 bg-bg border border-line">
          <Image
            src={post.imageUrl}
            alt={post.imageAlt}
            fill
            className="object-cover"
            preload
            fetchPriority="high"
            quality={60}
            sizes="(min-width: 1280px) 1200px, calc(100vw - 2.5rem)"
          />
        </div>

        <header data-rise data-pv className="mb-10 max-w-[72rem]">
          <h1 className="t-page text-fg mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-mute mb-5">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            {post.updated && post.updated !== post.date && (
              <span className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
              </span>
            )}
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {post.author}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-line"
              >
                {tag}
              </span>
            ))}
          </div>
          <ShareButtons title={post.title} url={postUrl} />
        </header>

        <div className="grid grid-cols-1 gap-x-10 xl:grid-cols-[15rem_minmax(0,1fr)]">
        {toc.length > 1 && (
          <>
            <details data-rise className="xl:hidden mb-8 rounded-lg border border-line p-4">
              <summary className="cursor-pointer text-sm font-semibold text-fg">
                On this page
              </summary>
              <nav aria-label="Table of contents" className="mt-3">
                {tocLinks}
              </nav>
            </details>
            <aside data-rise className="hidden xl:col-start-1 xl:row-start-1 xl:block">
              <nav
                aria-label="Table of contents"
                className="sticky top-28 max-h-[calc(100svh-8rem)] overflow-y-auto"
              >
                <p className="micro mb-3">
                  On this page
                </p>
                {tocLinks}
              </nav>
            </aside>
          </>
        )}

        <div
          id="post-content"
          className="prose min-w-0 max-w-[70ch] xl:col-start-2 xl:row-start-1
            prose-headings:font-bold
            prose-h2:text-[1.75rem] prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-line
            prose-h3:text-[1.375rem] prose-h3:mb-3 prose-h3:mt-6
            prose-p:mb-4
            prose-strong:font-semibold
            prose-code:text-sm prose-pre:p-4 prose-pre:overflow-x-auto
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
            prose-li:my-2
            prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic
            prose-hr:my-8
            [&_svg]:block [&_svg]:max-w-full [&_svg]:my-6
            prose-table:w-full prose-table:border-collapse prose-table:my-6
            prose-th:border prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-sm
            prose-td:border prose-td:px-3 prose-td:py-2 prose-td:text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        </div>

        <div className="grid grid-cols-1 gap-x-10 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="max-w-[70ch] xl:col-start-2">
            <BlogNavigation previous={previous} next={next} />
          </div>
        </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: ldJson({ "@context": "https://schema.org", "@graph": graph }),
          }}
        />
      </article>
    </main>
    </PageTransition>
  );
}
