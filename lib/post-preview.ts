/**
 * Compact plain-text preview of a post, for the filing cabinet's sheet (see lib/cabinet-preview.ts). Runs on the server only.
 * Rule: walk the markdown blocks from the top; the first real prose paragraph is the lead. A heading that comes before it is kept (a post
 * body that opens with "# Title" renders as an h2 on the page, so the sheet shows it too). Code, tables, lists, quotes, images, html and
 * comments are skipped. Inline markup is flattened to its text. The lead is cut at a word boundary after `max` characters.
 */
export type PostPreview = { h?: string; lead: string };

const flat = (s: string) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

export function previewOf(markdown: string, max = 420): PostPreview {
  const body = markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/^(`{3}|~{3})[\s\S]*?^\1/gm, "");
  let h: string | undefined;
  for (const block of body.split(/\n\s*\n/)) {
    const b = block.trim();
    if (!b || /^(---|\*\*\*|___)$/.test(b)) continue;
    const head = /^#{1,3}\s+(.*)$/.exec(b);
    if (head) {
      if (h === undefined) h = flat(head[1]).slice(0, 120);
      continue;
    }
    if (/^([>|*+\-<!]|\d+[.)]\s|`{3}|~{3}|\s{4})/.test(b)) continue; // quote, table, list, html, image, code
    const text = flat(b);
    if (text.length < 40) continue;
    let lead = text;
    if (lead.length > max) lead = lead.slice(0, max).replace(/\s+\S*$/, "");
    return { h, lead };
  }
  return { h, lead: "" };
}
