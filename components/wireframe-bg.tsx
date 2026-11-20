"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { LANDSCAPE, PORTRAIT, svgPath, type Scene } from "@/lib/wireframe";

/**
 * Home hero backdrop: monochrome wireframe grid panels. OFF by default since Stage 10 (the template home is flat graphite with grain
 * only; see plans/revamp/NOTES-stage7.md). Nothing renders, not even the static SVG, unless opted in:
 *  - On with ?bg=1 (remembered in localStorage; ?bg=0 clears it) or NEXT_PUBLIC_WIREFRAME_BG=1 at build time.
 *  - An inline SVG of the same composition is the first paint and the final state for reduced motion, Save-Data, no canvas.
 *  - The canvas renderer (components/wireframe-canvas.ts) is a separate chunk, imported after first paint, and crossfades in.
 * Only this small loader is in the home bundle. Never import it from app/layout.tsx.
 */

const ENV_ON = process.env.NEXT_PUBLIC_WIREFRAME_BG === "1";
const KEY = "wfbg";

function queryFlag(): string | null {
  const q = new URLSearchParams(location.search).get("bg");
  return q === "1" || q === "0" ? q : null;
}
function readFlag(): boolean {
  try {
    const v = queryFlag() ?? localStorage.getItem(KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {}
  return ENV_ON;
}
const noopSubscribe = () => () => {};

const MOTION = "(prefers-reduced-motion: no-preference)";
function subscribeMotion(cb: () => void) {
  const mq = matchMedia(MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function motionAllowed(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return matchMedia(MOTION).matches && !c?.saveData;
}

function Grid({ scene, className }: { scene: Scene; className: string }) {
  const paths = useMemo(() => scene.panels.map((p) => [svgPath(scene, p, false), svgPath(scene, p, true)] as const), [scene]);
  return (
    <svg className={className} viewBox={`0 0 ${scene.W} ${scene.H}`} preserveAspectRatio="xMidYMid slice" focusable="false">
      <path className="wf-grid" d={paths.map((p) => p[0]).join("")} />
      <path className="wf-frame" d={paths.map((p) => p[1]).join("")} />
    </svg>
  );
}

export default function WireframeBg() {
  const on = useSyncExternalStore(noopSubscribe, readFlag, () => ENV_ON);
  const motion = useSyncExternalStore(subscribeMotion, motionAllowed, () => false);
  const [live, setLive] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // Remember an explicit ?bg= choice.
  useEffect(() => {
    try {
      const q = queryFlag();
      if (q) localStorage.setItem(KEY, q);
    } catch {}
  }, []);

  // Load the canvas renderer after first paint, when idle.
  useEffect(() => {
    if (!on || !motion) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    const load = () =>
      import("./wireframe-canvas")
        .then((m) => {
          if (cancelled || !canvas.current || !host.current) return;
          dispose = m.start(canvas.current, host.current, () => setLive(true));
        })
        .catch(() => {});
    const ric = "requestIdleCallback" in window;
    const id = ric ? window.requestIdleCallback(load, { timeout: 2500 }) : window.setTimeout(load, 400);
    return () => {
      cancelled = true;
      if (ric) window.cancelIdleCallback(id);
      else clearTimeout(id);
      dispose?.();
      setLive(false);
    };
  }, [on, motion]);

  if (!on) return null;
  return (
    <div ref={host} className="wf-bg" aria-hidden="true" data-live={live && motion ? "" : undefined}>
      <Grid scene={LANDSCAPE} className="wf-svg wf-land" />
      <Grid scene={PORTRAIT} className="wf-svg wf-port" />
      {motion && <canvas ref={canvas} className="wf-canvas" />}
    </div>
  );
}
