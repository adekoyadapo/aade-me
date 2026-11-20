"use client";

import { useEffect } from "react";

/**
 * Loads the WebGL home stage (three.js + gsap, one lazy chunk) after first paint and idle, only on the home route, only when motion is
 * allowed and a WebGL context can be created. Anything else keeps the DOM/CSS stage, which is also the accessible and SEO layer.
 */
function canWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

type Conn = { saveData?: boolean; effectiveType?: string };

/**
 * Capability gate. The DOM/CSS stage is the same composition (slots, float, stepping, caption) minus the glass rim lighting and
 * pointer tilt, so low-power and small touch devices keep it and never download three.js or gsap (about 190 KB gzip).
 * Skipped on: Save-Data, 2g/3g, 4 GB or less memory, 4 cores or fewer, and phones (coarse pointer under 768 px).
 * Add ?gl=1 to the URL to force the WebGL stage for testing.
 */
function lowPower() {
  if (/[?&]gl=1\b/.test(location.search)) return false;
  const n = navigator as Navigator & { connection?: Conn; deviceMemory?: number };
  const c = n.connection;
  if (c?.saveData || /(^|-)(2g|3g)$/.test(c?.effectiveType ?? "")) return true;
  if (n.deviceMemory !== undefined && n.deviceMemory <= 4) return true;
  if (n.hardwareConcurrency !== undefined && n.hardwareConcurrency <= 4) return true;
  return matchMedia("(pointer: coarse) and (max-width: 767px)").matches;
}

export default function StageGL() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (!hero) return;
    const mq = matchMedia("(prefers-reduced-motion: no-preference)");
    let stop: (() => void) | undefined;
    let dead = false;
    let started = false;
    // The preloader (components/preloader.tsx) waits for the stage: tell it when there will be none.
    const skip = () => window.dispatchEvent(new Event("stage:skip"));
    const boot = async () => {
      if (dead || started) return;
      if (!mq.matches || lowPower() || !canWebGL()) return skip();
      started = true;
      const m = await import("@/lib/gl/stage");
      if (dead) return;
      stop = m.mountStage(hero) ?? undefined;
      if (!stop) skip();
    };
    const idle = () => {
      // The preloader covers the page, so there is nothing to protect from main-thread work: load the stage straight away.
      if (document.documentElement.hasAttribute("data-preload")) boot();
      else if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(boot, { timeout: 2500 });
      else setTimeout(boot, 800);
    };
    const onMotion = () => {
      if (!mq.matches) {
        stop?.();
        stop = undefined;
      }
    };
    mq.addEventListener("change", onMotion);
    // Under the preloader the stage is part of what we wait for, so start loading it at once instead of after the load event.
    if (document.documentElement.hasAttribute("data-preload") || document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
    return () => {
      dead = true;
      window.removeEventListener("load", idle);
      mq.removeEventListener("change", onMotion);
      stop?.();
    };
  }, []);
  return null;
}
