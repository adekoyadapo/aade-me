"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Props = { tags: [string, number][]; total: number };

const subscribe = (cb: () => void) => {
  addEventListener("popstate", cb);
  addEventListener("idx-tag", cb);
  return () => {
    removeEventListener("popstate", cb);
    removeEventListener("idx-tag", cb);
  };
};
const readTag = () => new URLSearchParams(location.search).get("tag");

/** Tag chips (?tag= shared in the URL) filter the server-rendered rows through the DOM; also drives the hover preview. */
export default function IndexIsland({ tags, total }: Props) {
  const raw = useSyncExternalStore(subscribe, readTag, () => null);
  const tag = raw && tags.some(([n]) => n === raw) ? raw : null;
  const [q, setQ] = useState("");
  const peek = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
  const excerpt = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let shown = 0;
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    document.querySelectorAll<HTMLElement>("#writing-index .idx-row").forEach((row) => {
      const tagOk = !tag || (row.dataset.tags ?? "").split("|").includes(tag);
      const hay = `${row.querySelector("[data-title]")?.textContent ?? ""} ${row.querySelector("[data-excerpt]")?.textContent ?? ""} ${(row.dataset.tags ?? "").replaceAll("|", " ")}`.toLowerCase();
      const ok = tagOk && tokens.every((t) => hay.includes(t));
      row.parentElement!.hidden = !ok;
      if (ok) shown++;
    });
    document.querySelectorAll<HTMLElement>("#writing-index [data-year]").forEach((y) => {
      y.hidden = !y.querySelector("li:not([hidden])");
    });
    const status = document.getElementById("idx-status");
    const msg = shown === 0 ? "No posts match" : `${shown} ${shown === 1 ? "post" : "posts"}`;
    if (status) status.textContent = `${msg}${tag ? ` tagged ${tag}` : ""}${q.trim() ? ` for "${q.trim()}"` : ""}`;
    const none = document.getElementById("idx-none");
    if (none) none.hidden = shown > 0;
  }, [tag, q]);

  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = peek.current!;
    const rowOf = (e: Event) => (e.target as Element).closest?.<HTMLElement>("#writing-index .idx-row");
    const move = (e: PointerEvent) => {
      const w = box.offsetWidth, h = box.offsetHeight;
      const x = Math.min(e.clientX + 24, innerWidth - w - 12);
      const y = Math.min(e.clientY + 18, innerHeight - h - 12);
      box.style.transform = `translate(${Math.max(12, x)}px, ${Math.max(12, y)}px)`;
    };
    const over = (e: PointerEvent) => {
      const row = rowOf(e);
      if (!row) return;
      img.current!.src = row.dataset.img ?? "";
      title.current!.textContent = row.querySelector("[data-title]")?.textContent ?? "";
      excerpt.current!.textContent = row.querySelector("[data-excerpt]")?.textContent ?? "";
      box.dataset.on = "true";
      move(e);
    };
    const out = (e: PointerEvent) => {
      const row = rowOf(e);
      if (row && !row.contains(e.relatedTarget as Node)) box.dataset.on = "false";
    };
    const moveAll = (e: PointerEvent) => {
      if (box.dataset.on === "true") move(e);
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("pointermove", moveAll, { passive: true });
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("pointermove", moveAll);
    };
  }, []);

  const pick = (t: string | null) => {
    const u = new URL(location.href);
    if (t) u.searchParams.set("tag", t);
    else u.searchParams.delete("tag");
    history.replaceState(history.state, "", u);
    dispatchEvent(new Event("idx-tag"));
  };

  return (
    <>
      <div className="idx-topic">
        <label htmlFor="idx-topic" className="micro">Topic</label>
        <select
          id="idx-topic"
          value={tag ?? ""}
          onChange={(e) => pick(e.target.value || null)}
          className="h-8 max-w-full rounded-md border border-line bg-transparent px-2 font-mono text-xs text-fg"
        >
          <option value="">All topics ({total})</option>
          {tags.map(([n, c]) => (
            <option key={n} value={n}>
              {n} ({c})
            </option>
          ))}
        </select>
      </div>
      <div className="idx-search">
        <label htmlFor="idx-q" className="micro">Search</label>
        <input
          id="idx-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && q && (e.preventDefault(), setQ(""))}
          placeholder="Title, topic or keyword"
          autoComplete="off"
          spellCheck={false}
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-transparent px-2 font-mono text-xs text-fg placeholder:text-mute"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); document.getElementById("idx-q")?.focus(); }} className="h-8 rounded-md border border-line px-2 font-mono text-xs text-mute hover:text-fg">
            Clear
          </button>
        )}
      </div>
      <p id="idx-status" role="status" aria-live="polite" className="sr-only" />
      <p id="idx-none" hidden className="mt-6 text-sm text-mute">No posts match. Clear the search or pick another topic.</p>
      <div ref={peek} aria-hidden="true" className="idx-peek" data-on="false">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} alt="" width={384} height={200} className="h-40 w-full object-cover" />
        <div className="p-4">
          <p ref={title} className="font-medium leading-snug" />
          <p ref={excerpt} className="mt-1 line-clamp-3 text-sm text-mute" />
        </div>
      </div>
    </>
  );
}
