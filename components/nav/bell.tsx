"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type LatestPost = { slug: string; title: string; date: string };
const KEY = "whatsnew-seen";
let memSeen = "";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
function readSeen() {
  try {
    return localStorage.getItem(KEY) ?? memSeen;
  } catch {
    return memSeen;
  }
}
function writeSeen(v: string) {
  memSeen = v;
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  listeners.forEach((l) => l());
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function Bell({ latest }: { latest: LatestPost[] }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const newest = latest[0]?.slug ?? "";
  // Server and hydration render "seen" so there is no dot flash.
  const seen = useSyncExternalStore(subscribe, readSeen, () => newest);
  const unread = !!newest && seen !== newest;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && newest) writeSeen(newest);
  };

  if (!latest.length) return null;

  return (
    <div ref={wrap} className="relative">
      <button
        ref={btn}
        type="button"
        aria-label={unread ? "What's new, unread" : "What's new"}
        aria-expanded={open}
        aria-controls="whatsnew-panel"
        onClick={toggle}
        className="relative -m-1 flex h-11 w-11 items-center justify-center rounded-lg text-mute transition-colors hover:text-fg"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread && <span aria-hidden="true" className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-fg ring-2 ring-surface" />}
      </button>
      {open && (
        <div
          id="whatsnew-panel"
          role="region"
          aria-label="What's new"
          className="absolute right-0 top-12 z-[var(--z-popover)] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-2 shadow-2xl"
        >
          <p className="micro px-3 py-2">What&apos;s new</p>
          <ul>
            {latest.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 hover:bg-bg"
                >
                  <span className="micro block !text-[0.65rem]">{formatDate(p.date)}</span>
                  <span className="text-sm text-fg">{p.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
