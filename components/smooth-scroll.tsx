"use client";

import { useEffect } from "react";

type LenisInstance = import("lenis").default;
let instance: LenisInstance | undefined;

/** Module singleton so overlays can pause page scrolling. No-ops until Lenis has loaded. */
export const getLenis = () => instance;
export const stopLenis = () => instance?.stop();
export const startLenis = () => instance?.start();

/** Lenis smooth scroll, loaded after idle. Off for reduced motion; touch stays native. */
export default function SmoothScroll() {
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    // Touch devices scroll natively (syncTouch is off anyway): skip the chunk and its permanent rAF loop.
    if (mq.matches || matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    let cancelled = false;
    // Lenis intercepts #anchor clicks, which skips native focus; restore it for the skip link.
    const onSkip = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.<HTMLAnchorElement>("a.skip-link");
      if (a) document.querySelector<HTMLElement>(a.hash)?.focus({ preventScroll: true });
    };
    const start = async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled || mq.matches) return;
      instance = new Lenis({ anchors: true, syncTouch: false });
      // An overlay may already be open when Lenis finishes loading.
      if (document.querySelector("[data-scroll-lock]")) instance.stop();
      document.addEventListener("click", onSkip);
      const tick = (t: number) => {
        instance?.raf(t);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1500);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onSkip);
      instance?.destroy();
      instance = undefined;
    };
  }, []);
  return null;
}
