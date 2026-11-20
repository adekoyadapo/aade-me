import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element } from "hast";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

/** Collects h2/h3 headings (after rehype-slug has assigned ids). */
function collectToc(toc: TocItem[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      toc.push({
        id,
        text: toString(node).trim(),
        depth: node.tagName === "h2" ? 2 : 3,
      });
    });
  };
}

/** The page template owns the only h1. A leading `# Title` in a post body becomes an h2 (SEO: one h1 per page). */
function demoteH1() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "h1") node.tagName = "h2";
    });
  };
}

/** Accessibility fixes the markdown cannot express: heading levels that skip (aria-level) and empty corner header cells. */
function a11yFixes() {
  return (tree: Root) => {
    let last = 1; // the page h1
    visit(tree, "element", (node: Element) => {
      const m = /^h([2-6])$/.exec(node.tagName);
      if (m) {
        const level = Number(m[1]);
        if (level > last + 1) node.properties = { ...node.properties, ariaLevel: last + 1 };
        last = Math.min(level, last + 1);
      }
      if (node.tagName === "th" && node.children.length === 0) {
        node.children = [{ type: "element", tagName: "span", properties: { className: ["sr-only"] }, children: [{ type: "text", value: "Item" }] }];
      }
    });
  };
}

/**
 * Defence in depth for author-written raw HTML: drop executable script/iframe/object/embed, on* handlers and
 * javascript:/data:text/html URLs. Inline SVG, tables and normal attributes are untouched.
 */
function stripDangerous() {
  const BAD_TAGS = new Set(["script", "iframe", "object", "embed", "base", "meta", "link", "form"]);
  const URL_ATTRS = new Set(["href", "src", "xLinkHref", "action", "formAction"]);
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      // Posts embed their own FAQPage JSON-LD; keep data blocks (never executed by browsers), drop executable scripts.
      const isLd = node.tagName === "script" && /^application\/(ld\+)?json$/i.test(String(node.properties?.type ?? ""));
      if (BAD_TAGS.has(node.tagName) && !isLd && parent && typeof index === "number") {
        parent.children.splice(index, 1);
        return ["skip", index];
      }
      const props = node.properties ?? {};
      for (const key of Object.keys(props)) {
        if (/^on/i.test(key)) delete props[key];
        else if (URL_ATTRS.has(key) && /^\s*(javascript|vbscript|data\s*:\s*text\/html)/i.test(String(props[key]).replace(/[\u0000-\u0020]/g, ""))) delete props[key];
      }
    });
  };
}

/** Render post markdown to HTML on the server. Raw HTML and inline SVG are kept. */
export async function renderMarkdown(
  source: string
): Promise<{ html: string; toc: TocItem[] }> {
  const toc: TocItem[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(stripDangerous)
    .use(demoteH1)
    .use(rehypeSlug)
    .use(collectToc(toc))
    .use(a11yFixes)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: ["heading-anchor"], ariaLabel: "Link to this section" },
      content: { type: "text", value: "#" },
    })
    .use(rehypeExternalLinks, { rel: ["noopener", "noreferrer"] })
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      fallbackLanguage: "text",
    })
    .use(rehypeStringify)
    .process(source);
  return { html: String(file), toc };
}
