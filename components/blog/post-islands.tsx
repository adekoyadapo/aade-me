"use client";

import { useEffect, useRef } from "react";

/** Client island: reading progress bar, TOC active highlight, code copy buttons.
 *  Operates on server-rendered DOM inside #post-content and #post-toc. */
export default function PostIslands() {
  const bar = useRef<HTMLDivElement>(null);

  // Reading progress
  useEffect(() => {
    const content = document.getElementById("post-content");
    const el = bar.current;
    if (!content || !el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = content.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.5;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Active section in the table of contents
  useEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")
    );
    const headings = links
      .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
      .filter((h): h is HTMLElement => !!h);
    if (!headings.length) return;
    const setActive = (id: string) =>
      links.forEach((a) => {
        if (decodeURIComponent(a.hash.slice(1)) === id)
          a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px" }
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, []);

  // Copy buttons on code blocks (lazy: the logic is only needed once the post is on screen)
  useEffect(() => {
    let undo: (() => void) | undefined;
    let off = false;
    import("./code-copy").then((m) => {
      if (off) return;
      undo = m.default();
    });
    return () => {
      off = true;
      undo?.();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[var(--z-header-raised)] h-0.5 pointer-events-none"
    >
      <div
        ref={bar}
        className="h-full origin-left bg-fg"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
