import type { CabinetPost } from "./taxonomy";
import { formatDate } from "./blog-utils";

/**
 * The sheet that leaves a folder carries a miniature of the real article (app/blog/[slug]/page.tsx): the same classes, in the same
 * order, at the article's own width. The sheet is laid out at full size and only scaled down for the flight, so scaling it back up to
 * the article position lands exactly on the real header and first lines, and the cross-fade to the real DOM has nothing to jump.
 * Client-side string building (no React): this runs inside the lazy motion chunk.
 */
export const heroThumb = (url: string, w = 828) => `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const icon = (path: string, cls = "w-4 h-4") =>
  `<svg class="${cls}" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const I = {
  back: icon('<path d="M19 12H5M11 6l-6 6 6 6" />'),
  cal: icon('<rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />'),
  clock: icon('<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />'),
  user: icon('<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />'),
  share: icon('<circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />'),
};
const BTN = "flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-xs font-medium";
const GHOST = ["100%", "97%", "92%", "100%", "88%", "100%", "95%", "64%"];

export function sheetHTML(p: CabinetPost): string {
  const ghosts = (n: number, from = 0) =>
    Array.from({ length: n }, (_, i) => `<i class="pv-g" style="--w:${GHOST[(i + from) % GHOST.length]}"></i>`).join("");
  const toc = ["86%", "70%", "92%", "58%", "78%"].map((w) => `<i class="pv-toc" style="--w:${w}"></i>`).join("");
  return `
<div class="pv-sheet" aria-hidden="true">
  <i class="pv-tex"></i>
  <span class="inline-flex items-center gap-2 text-sm text-mute mb-8">${I.back}Back to Blog</span>
  <div class="post-hero relative w-full overflow-hidden rounded-xl mb-8 bg-bg border border-line">
    <img src="${heroThumb(p.hero)}" alt="" decoding="async" class="absolute inset-0 h-full w-full object-cover">
  </div>
  <header class="mb-10 max-w-[72rem]">
    <h1 class="t-page text-fg mb-6">${esc(p.title)}</h1>
    <div class="flex flex-wrap items-center gap-4 text-sm text-mute mb-5">
      <span class="flex items-center gap-2">${I.cal}${esc(formatDate(p.date))}</span>
      <span class="flex items-center gap-2">${I.clock}${esc(p.readTime)}</span>
      <span class="flex items-center gap-2">${I.user}Ade A.</span>
    </div>
    <div class="flex flex-wrap gap-2 mb-6">${p.tags.map((t) => `<span class="px-2.5 py-1 text-xs font-medium rounded-md border border-line">${esc(t)}</span>`).join("")}</div>
    <div class="flex flex-wrap items-center gap-3">
      <span class="micro flex items-center gap-2">${I.share}Share</span>
      <div class="flex gap-2"><span class="${BTN}">X</span><span class="${BTN}">LinkedIn</span><span class="${BTN}">Copy link</span></div>
    </div>
  </header>
  <div class="grid grid-cols-1 gap-x-10 xl:grid-cols-[15rem_minmax(0,1fr)]">
    <div class="xl:hidden mb-8 rounded-lg border border-line p-4"><div class="text-sm font-semibold text-fg">On this page</div></div>
    <aside class="hidden xl:col-start-1 xl:row-start-1 xl:block"><p class="micro mb-3">On this page</p>${toc}</aside>
    <div class="prose min-w-0 max-w-[70ch] xl:col-start-2 xl:row-start-1 prose-headings:font-bold prose-h2:text-[1.75rem] prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-line prose-p:mb-4">
      ${p.h ? `<h2>${esc(p.h)}</h2>` : ""}
      ${p.lead ? `<p class="pv-lead">${esc(p.lead)}</p>` : ""}
      ${ghosts(3, 1)}<div class="pv-gb"></div>${ghosts(6, 3)}
    </div>
  </div>
  <i class="fxf-curl"></i>
</div>`;
}
