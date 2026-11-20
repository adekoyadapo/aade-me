"use client";

import { useEffect } from "react";

/**
 * Reveal-once for About. Server HTML is complete and visible. After hydration, groups that sit below the fold are marked
 * data-rv="pending" (CSS hides their items), and an IntersectionObserver flips each to "in" once. Nothing runs under reduced motion.
 */
export default function Reveal() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const groups = document.querySelectorAll<HTMLElement>("[data-rv-group]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.rv = "in";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    groups.forEach((g) => {
      if (g.getBoundingClientRect().top < innerHeight * 0.9) return;
      g.dataset.rv = "pending";
      io.observe(g);
    });
    return () => io.disconnect();
  }, []);
  return null;
}
