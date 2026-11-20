import { preload } from "react-dom";
import { ldJson } from "@/lib/jsonld";
import PageTransition from "@/components/page-transition";
import WritingIndex from "@/components/blog/writing-index";
import { getAllPosts } from "@/lib/blog-repo";

export async function generateMetadata() {
  const title = "Blog: Elasticsearch, Cloud and AI Engineering Notes | Ade A.";
  const description = "Practical notes on Elasticsearch, observability, vector search, Kubernetes and cloud architecture, written by Ade A. from real platform and customer work.";
  const base = "https://aade.me";
  const canonical = `${base}/blog`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ade A., Lead Architect, Enterprise Solutions Architecture" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: { index: true, follow: true },
  } as const;
}

export default async function BlogPage() {
  preload("/cabinet/drawer-face.webp", { as: "image" }); // the drawer photo is the first thing the cabinet paints
  const posts = await getAllPosts();
  const ldJsonData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog",
    hasPart: posts.map((p, i) => ({
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: p.date,
      url: `https://aade.me/blog/${p.slug}`,
      position: i + 1,
    })),
  };

  return (
    <PageTransition>
      <main className="min-h-svh page-top">
        <div className="gutter">
          <div className="writing-col">
          <WritingIndex posts={posts} />
          </div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ldJsonData) }} />
      </main>
    </PageTransition>
  );
}
