"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CvEngine } from "@/lib/cv-decode";
import { CV_SEEN_KEY as KEY } from "@/lib/cv-seal-script";

/**
 * CV reveal (Stage 10). The real CV is always in the server HTML. Whether the sealed screen shows is decided before paint by
 * cvSealScript (lib/cv-seal-script.ts, inline, first child of #cv-root: JS on, motion allowed, not seen this session) and repeated here for client-side
 * navigation, where inline scripts do not run. States live on #cv-root as data-cv: sealed | measure | decoding | done | (none).
 * No JS, reduced motion and print never see the sealed screen. The engine (canvas, GSAP) loads after first paint.
 */
const rootEl = () => document.getElementById("cv-root");
const seen = () => {
  try {
    return !!sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
};
const mark = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
};

export function CvPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition hover:scale-105"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M10 13.5 5.5 9l1.1-1.1 2.6 2.6V3h1.6v7.5l2.6-2.6L14.5 9 10 13.5ZM4 15.5h12V17H4v-1.5Z" />
      </svg>
      Save as PDF
    </button>
  );
}

export function CvReplayButton() {
  return (
    <button type="button" className="cv-replay" onClick={() => window.dispatchEvent(new Event("cv-replay"))}>
      Replay
    </button>
  );
}

export default function CvReveal({ file }: { file: string }) {
  const [status, setStatus] = useState("");
  const sealRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Promise<CvEngine> | null>(null);
  const busy = useRef(false);

  const getEngine = () => {
    if (!engine.current) {
      engine.current = import("@/lib/cv-decode").then(({ createCvEngine }) => {
        const root = rootEl()!;
        return createCvEngine({
          root,
          container: root.querySelector<HTMLElement>(".cv-container")!,
          seal: sealRef.current!,
          page: pageRef.current!,
          canvas: canvasRef.current!,
        });
      });
    }
    return engine.current;
  };

  // Decide the state before paint (covers client navigation; on a fresh load the inline script already did the same).
  useLayoutEffect(() => {
    const root = rootEl();
    if (!root) return;
    const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!motion) root.removeAttribute("data-cv");
    else root.setAttribute("data-cv", seen() ? "done" : "sealed");
    return () => {
      root.removeAttribute("data-cv");
    };
  }, []);

  useEffect(() => {
    const root = rootEl();
    if (!root) return;
    let cancelled = false;
    let idleId = 0;
    if (root.getAttribute("data-cv") === "sealed") {
      const start = () => {
        if (!cancelled && root.getAttribute("data-cv") === "sealed") getEngine().then((e) => !cancelled && root.getAttribute("data-cv") === "sealed" && e.startIdle());
      };
      idleId = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 600 }) : window.setTimeout(start, 120);
    }
    // Replay: warm the engine (and GSAP) only when the control is approached.
    const warm = (e: Event) => {
      if ((e.target as Element).closest?.(".cv-replay")) getEngine().then((en) => en.preload());
    };
    root.addEventListener("pointerover", warm);
    root.addEventListener("focusin", warm);
    const onReplay = () => void play("scatter");
    window.addEventListener("cv-replay", onReplay);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      else clearTimeout(idleId);
      root.removeEventListener("pointerover", warm);
      root.removeEventListener("focusin", warm);
      window.removeEventListener("cv-replay", onReplay);
      engine.current?.then((e) => e.destroy());
      engine.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toTitle = () => document.getElementById("cv-title")?.focus({ preventScroll: true });

  const finishInstant = () => {
    const root = rootEl();
    engine.current?.then((e) => e.stopIdle());
    root?.setAttribute("data-cv", "done");
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setStatus("CV ready");
    toTitle();
  };

  const skip = () => {
    mark();
    finishInstant();
  };

  async function play(from: "seal" | "scatter") {
    if (busy.current) return;
    busy.current = true;
    mark();
    if (sealRef.current) sealRef.current.inert = true;
    setStatus("CV decoding");
    try {
      const e = await getEngine();
      await e.decode(from);
      setStatus("CV ready");
      toTitle();
    } catch {
      finishInstant();
    }
    if (sealRef.current) sealRef.current.inert = false;
    busy.current = false;
  }

  return (
    <>
      <section ref={sealRef} className="cv-seal" aria-label="Sealed CV file">
        <div ref={pageRef} className="cv-seal-page" aria-hidden="true" />
        <div className="cv-seal-ui">
          <p className="cv-seal-cap">{file} :: click to decode</p>
          <div className="cv-seal-actions">
            <button type="button" className="cv-decode" onClick={() => void play("seal")}>
              Decode
            </button>
            <button type="button" className="cv-skip" onClick={skip}>
              Skip, show CV
            </button>
          </div>
        </div>
      </section>
      <canvas ref={canvasRef} className="cv-fx" aria-hidden="true" />
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </>
  );
}
