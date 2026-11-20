"use client";

import { useEffect } from "react";

/**
 * The one page-ground system (replaces the old pointer-fx). A fixed full-viewport canvas under all content draws a visible
 * 45 degree halftone lattice that the pointer lights up with a decaying wake, sparkles and a soft sheen (lib/gl/field.ts, a
 * separate chunk loaded after first paint, raw WebGL, no library).
 *
 *  - Off with NEXT_PUBLIC_FX_BG=0 at build time. On by default.
 *  - Reduced motion, Save-Data and coarse pointers: the static pattern is drawn once, no loop, no listeners.
 *  - No WebGL (or context lost): a CSS dot lattice at the same cell size plus a pointer glow that follows the eased pointer.
 *  - aria-hidden, pointer-events none, z-index below content, never affects layout.
 */
const ON = process.env.NEXT_PUBLIC_FX_BG !== "0";
const HALF = 260; // half of the fallback glow's size in CSS (.fx-spot)
const QUIET = ".paper,.cab,.cv-root,[data-no-fx]";

type Nav = Navigator & { connection?: { saveData?: boolean } };

/** CSS fallback: static lattice class on <html> plus a transform-only glow that follows the eased pointer. */
function cssFallback(): () => void {
  document.documentElement.classList.add("bg-css");
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || !matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    return () => document.documentElement.classList.remove("bg-css");
  }
  const el = document.createElement("div");
  el.className = "fx-spot";
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  let raf = 0;
  let tx = 0, ty = 0, cx = 0, cy = 0, prev = 0, lastMove = 0;
  let seen = false;
  let quiet = false;
  const loop = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - (prev || now)) / 1000);
    prev = now;
    const k = 1 - Math.exp(-dt * 9);
    cx += (tx - cx) * k;
    cy += (ty - cy) * k;
    el.style.transform = `translate3d(${(cx - HALF).toFixed(1)}px,${(cy - HALF).toFixed(1)}px,0)`;
    const live = !quiet && now - lastMove < 1200;
    el.classList.toggle("is-on", live);
    if (live || Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) raf = requestAnimationFrame(loop);
    else prev = 0;
  };
  const kick = () => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    tx = e.clientX;
    ty = e.clientY;
    if (!seen) {
      seen = true;
      cx = tx;
      cy = ty;
    }
    quiet = !!(e.target as Element | null)?.closest?.(QUIET);
    lastMove = performance.now();
    kick();
  };
  const onLeave = () => {
    lastMove = 0;
    kick();
  };
  addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    el.remove();
    document.documentElement.classList.remove("bg-css");
  };
}

export default function BgField() {
  useEffect(() => {
    if (!ON) return;
    const conn = (navigator as Nav).connection;
    const motionMq = matchMedia("(prefers-reduced-motion: no-preference)");
    const allowed = () => motionMq.matches && !conn?.saveData && !matchMedia("(update: slow)").matches;

    let canvas: HTMLCanvasElement | null = null;
    let field: import("@/lib/gl/field").Field | null = null;
    let undoCss: (() => void) | null = null;
    let cancelled = false;

    const fail = () => {
      canvas?.remove();
      canvas = null;
      field = null;
      if (!cancelled && !undoCss) undoCss = cssFallback();
    };

    const start = () => {
      if (cancelled) return;
      import("@/lib/gl/field")
        .then(({ startField }) => {
          if (cancelled) return;
          canvas = document.createElement("canvas");
          canvas.className = "bg-field";
          canvas.setAttribute("aria-hidden", "true");
          document.body.appendChild(canvas);
          field = startField(canvas, {
            animated: allowed(),
            onLive: () => canvas?.setAttribute("data-live", ""),
            onFail: fail,
          });
          if (!field) fail();
        })
        .catch(fail);
    };

    const onMotion = () => field?.setAnimated(allowed());
    motionMq.addEventListener("change", onMotion);

    const ric = "requestIdleCallback" in window;
    const id = ric ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 400);
    return () => {
      cancelled = true;
      if (ric) window.cancelIdleCallback(id);
      else clearTimeout(id);
      motionMq.removeEventListener("change", onMotion);
      field?.dispose();
      canvas?.remove();
      undoCss?.();
    };
  }, []);
  return null;
}
