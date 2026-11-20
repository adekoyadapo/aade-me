"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/cabinet-ctx";

type Fx = typeof import("@/lib/cabinet-fx");

/**
 * Post page side of the filing cabinet (lib/cabinet-fx.ts). Renders nothing.
 * - Mount: if a folder is flying in, tells it where the paper is. A direct visit has no flight and just gets the CSS entrance.
 * - Close: the X and Back links (a[data-cab-close], real links to /blog) and the Escape key play the reverse sequence, then route back.
 *   Without JS, with reduced motion, or with a modifier key they are ordinary links.
 */
export default function PostFx() {
  const router = useRouter();

  useEffect(() => {
    const paper = document.querySelector<HTMLElement>(".post-paper");
    let mod: Promise<Fx> | null = null;
    const load = () => (mod ??= import("@/lib/cabinet-fx"));
    let dead = false;

    if (paper) {
      if (document.documentElement.getAttribute("data-cab") === "in") load().then((m) => !dead && m.arrive(paper));
      else if (!prefersReducedMotion()) {
        // Warm the chunk so the first close has no wait.
        const id = window.requestIdleCallback ? window.requestIdleCallback(() => void load(), { timeout: 2000 }) : window.setTimeout(() => void load(), 800);
        void id;
      }
    }

    const close = () => {
      if (prefersReducedMotion()) return router.push("/blog");
      load()
        .then((m) => m.closePost((h) => router.push(h)))
        .catch(() => router.push("/blog"));
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target as Element | null)?.closest?.("a[data-cab-close]")) return;
      e.preventDefault();
      e.stopPropagation();
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector('[data-scroll-lock], header [aria-expanded="true"]')) return;
      close();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      dead = true;
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
      mod?.then((m) => m.leave());
    };
  }, [router]);

  return null;
}
