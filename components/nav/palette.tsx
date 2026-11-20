"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startLenis, stopLenis } from "../smooth-scroll";
import { setPref, type Pref } from "../theme-toggle";

export type PaletteItem = {
  label: string;
  kind: "Page" | "Post" | "Project";
  href: string;
  external?: boolean;
  tags?: readonly string[];
  excerpt?: string;
};

type Entry = { id: string; label: string; kind: string; run: () => void; tags: string; excerpt: string };

const GROUPS = ["Page", "Post", "Project", "Action"] as const;
const GROUP_LABEL: Record<string, string> = { Page: "Pages", Post: "Posts", Project: "Projects", Action: "Actions" };

/** Lower is better; null means no match. Every token must hit somewhere. Title prefix, title contains, tags, excerpt. */
function score(e: Entry, tokens: string[]): number | null {
  if (!tokens.length) return 0;
  const title = e.label.toLowerCase();
  const tags = e.tags.toLowerCase();
  const ex = e.excerpt.toLowerCase();
  let total = 0;
  for (const t of tokens) {
    const wordStart = new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title);
    if (title.startsWith(t)) total += 0;
    else if (wordStart) total += 1;
    else if (title.includes(t)) total += 2;
    else if (tags.includes(t)) total += 3;
    else if (ex.includes(t)) total += 4;
    else return null;
  }
  return total;
}

const ACTIONS: { label: string; run: () => void }[] = [
  ...(["light", "dark"] as Pref[]).map((p) => ({
    label: `Theme: ${p[0].toUpperCase()}${p.slice(1)}`,
    run: () => setPref(p),
  })),
  { label: "Open RSS feed", run: () => window.open("/feed.xml", "_blank", "noopener") },
];

export default function Palette({
  items,
  onClose,
}: {
  items: PaletteItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const entries: Entry[] = useMemo(() => {
    const all: Entry[] = [
      ...items.map((it, i) => ({
        id: `pal-${i}`,
        label: it.label,
        kind: it.kind,
        tags: (it.tags ?? []).join(" "),
        excerpt: it.excerpt ?? "",
        run: () =>
          it.external
            ? window.open(it.href, "_blank", "noopener,noreferrer")
            : router.push(it.href),
      })),
      ...ACTIONS.map((a, i) => ({ id: `pal-a${i}`, label: a.label, kind: "Action", tags: "", excerpt: "", run: a.run })),
    ];
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored: { e: Entry; s: number; g: number; i: number }[] = [];
    all.forEach((e, i) => {
      const s = score(e, tokens);
      if (s !== null) scored.push({ e, s, g: GROUPS.indexOf(e.kind as (typeof GROUPS)[number]), i });
    });
    // Grouped Pages / Posts / Projects / Actions; inside a group, best match first, then original order (newest post first).
    scored.sort((a, b) => a.g - b.g || a.s - b.s || a.i - b.i);
    return scored.slice(0, 40).map((x) => x.e);
  }, [items, query, router]);

  const current = Math.min(active, Math.max(entries.length - 1, 0));

  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stopLenis();
    return () => {
      document.body.style.overflow = prev;
      startLenis();
    };
  }, []);

  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [current, entries]);

  const choose = (e: Entry | undefined) => {
    if (!e) return;
    onClose();
    e.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(entries.length ? (current + 1) % entries.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(entries.length ? (current - 1 + entries.length) % entries.length : 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(entries[current]);
    } else if (e.key === "Tab") {
      // Focus trap: the input is the only tab stop.
      e.preventDefault();
    }
  };

  return (
    <div
      data-scroll-lock
      className="pointer-events-auto fixed inset-0 z-[var(--z-palette)] grid place-items-start justify-items-center bg-black/55 px-4 pb-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-2xl"
      >
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-controls="pal-list"
          aria-autocomplete="list"
          aria-activedescendant={entries[current]?.id}
          aria-label="Search pages, posts, projects and actions"
          placeholder="Search pages, posts, projects, actions"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          className="w-full border-0 border-b border-line bg-transparent px-5 py-4 text-base outline-none placeholder:text-mute"
        />
        <ul
          ref={list}
          id="pal-list"
          role="listbox"
          data-lenis-prevent
          aria-label="Results"
          className="max-h-[46vh] overflow-auto p-2"
        >
          {entries.map((e, i) => (
            <React.Fragment key={e.id}>
              {(i === 0 || entries[i - 1].kind !== e.kind) && (
                <li role="presentation" className="micro px-3 pb-1 pt-2 !text-[0.65rem]">
                  {GROUP_LABEL[e.kind] ?? e.kind}
                </li>
              )}
              <li
                id={e.id}
                role="option"
                aria-selected={i === current}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(e)}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-fg aria-selected:text-bg"
              >
                <span className="truncate">{e.label}</span>
                <span className="micro shrink-0 !text-[0.65rem] !text-current opacity-60">{e.kind}</span>
              </li>
            </React.Fragment>
          ))}
          {entries.length === 0 && (
            <li role="presentation" className="px-3 py-6 text-center text-sm text-mute">
              No results
            </li>
          )}
        </ul>
        <div className="micro border-t border-line px-4 py-2.5 !text-[0.65rem]">
          <span aria-live="polite" className="sr-only">
            {entries.length === 0 ? "No results" : `${entries.length} ${entries.length === 1 ? "result" : "results"}`}
          </span>
          <span aria-hidden="true">Up/Down to move, Enter to open, Esc to close</span>
        </div>
      </div>
    </div>
  );
}
