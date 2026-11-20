"use client";

import { useEffect, useRef, useState } from "react";

/**
 * First-visit preloader: graphite cover, the two-box logo bottom left, a large counter bottom right that rolls like an odometer from
 * 0 to 100, then the cover swipes out to the right while the page comes in from the left (the same root view transition as the page
 * swipe in app/globals.css, so the easing and the feel are shared).
 *
 * Whether it plays is decided before paint by the head script (lib/preload-script.ts, sets data-preload on <html>): home route,
 * first load of the session, motion allowed, not a crawler. The markup is part of the server HTML but display:none without that
 * attribute, so no-JS, returning visits and reduced motion never see it. The page stays in the DOM, inert while the cover shows.
 *
 * Progress is real, then smoothed: five readiness signals add up to 100 (hydrated, load event, fonts, first artwork decoded, WebGL
 * stage ready or not needed). The counter shows the highest step of an irregular ladder that both the readiness and a minimum
 * pace allow, so it never reads as a flash (about 1.8 s minimum) and never waits past about 3.3 s. Only transforms are animated.
 */
const STEPS = [0, 5, 9, 17, 27, 52, 78, 100];
const AT_FULL = [0, 100, 300, 520, 740, 960, 1160, 1300]; // earliest ms for each step: the minimum pace
const AT_SHORT = [0, 60, 180, 310, 440, 570, 690, 780]; // phones and Save-Data: about 1.4 s in total
const FORCE = 3300; // ms: whatever is still pending, jump to 100
const FORCE_SHORT = 1800;
const ROLL = 520; // ms per roll (expo out: lands fast, settles gently)
const HOLD = 350; // ms on 100 before the reveal
const WEIGHT = { hydrated: 15, load: 30, fonts: 10, art: 25, stage: 20 };
const EXPO = "cubic-bezier(0.87, 0, 0.13, 1)"; // the page tear easing

export default function Preloader() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const col = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    const column = col.current;
    if (!html.hasAttribute("data-preload") || !el || !column) return;

    // Phones (coarse pointer, narrow) and Save-Data get the short cover; every visitor can skip it with a tap, click or Escape.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const short = matchMedia("(pointer: coarse) and (max-width: 767px)").matches || !!conn?.saveData;
    const AT = short ? AT_SHORT : AT_FULL;
    const force = short ? FORCE_SHORT : FORCE;
    const roll = short ? 380 : ROLL;
    const hold = short ? 160 : HOLD;
    column.replaceChildren(Object.assign(document.createElement("div"), { textContent: "0" }));
    const t0 = performance.now();
    const ready = { hydrated: true, load: false, fonts: false, art: false, stage: false };
    const check = (k: keyof typeof ready) => () => {
      ready[k] = true;
    };

    // Real signals.
    if (document.readyState === "complete") ready.load = true;
    else window.addEventListener("load", check("load"), { once: true });
    if (document.fonts?.ready) document.fonts.ready.then(check("fonts"), check("fonts"));
    else ready.fonts = true;
    const img = document.querySelector<HTMLImageElement>("[data-hero] .art-img");
    if (img) {
      const decoded = () => (img.decode ? img.decode().then(check("art"), check("art")) : check("art")());
      if (img.complete) decoded();
      else {
        img.addEventListener("load", decoded, { once: true });
        img.addEventListener("error", check("art"), { once: true });
      }
    } else ready.art = true;
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const stageOk = check("stage");
    let mo: MutationObserver | undefined;
    if (hero?.hasAttribute("data-gl") || !hero) ready.stage = true;
    else if (hero) {
      mo = new MutationObserver(() => hero.hasAttribute("data-gl") && stageOk());
      mo.observe(hero, { attributes: true, attributeFilter: ["data-gl"] });
      window.addEventListener("stage:skip", stageOk, { once: true });
    }

    // Odometer: one column of stacked lines. A new value is appended below and the column rolls up to it with a Web Animation
    // (transform only, so it keeps running on the compositor even if the main thread is busy compiling the stage). A value arriving
    // mid-roll extends the same roll from where it is, so nothing ever jumps.
    let shown = 0; // index into STEPS currently on its way or landed
    let anim: Animation | null = null;
    let reached = 0; // time the final value landed
    const lineH = () => parseFloat(getComputedStyle(column).fontSize) || 100;
    const current = () => -new DOMMatrix(getComputedStyle(column).transform).m42 / lineH();
    const append = (v: number) => {
      const here = anim ? current() : 0;
      anim?.cancel();
      const line = document.createElement("div");
      line.textContent = String(v);
      column.appendChild(line);
      const to = column.children.length - 1;
      const a = column.animate(
        [{ transform: `translate3d(0,${-here}em,0)` }, { transform: `translate3d(0,${-to}em,0)` }],
        { duration: roll, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }, // expo out
      );
      anim = a;
      a.finished.then(
        () => {
          if (anim !== a) return;
          // Landed: drop the lines that rolled out of sight.
          while (column.children.length > 1) column.removeChild(column.firstChild as Node);
          a.cancel();
          anim = null;
          if (shown === STEPS.length - 1) reached = performance.now();
        },
        () => {},
      );
    };

    let raf = 0;
    let finished = false;
    const tick = (now: number) => {
      if (finished) return;
      const dt = now - t0;
      // Highest step that readiness and pace both allow.
      let score = 0;
      for (const k of Object.keys(WEIGHT) as (keyof typeof WEIGHT)[]) if (ready[k]) score += WEIGHT[k];
      let idx = 0;
      for (let i = 1; i < STEPS.length; i++) if (dt >= AT[i] && score >= STEPS[i]) idx = i;
      if (dt >= force) idx = STEPS.length - 1;
      if (idx > shown) {
        shown = idx;
        append(STEPS[idx]);
      }
      if (reached && now - reached >= hold) return finish();
      raf = requestAnimationFrame(tick);
    };

    const skipNow = () => {
      if (!finished) finish();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skipNow();
    el.addEventListener("pointerdown", skipNow, { passive: true });
    document.addEventListener("keydown", onKey);
    const cleanup = () => {
      mo?.disconnect();
      window.removeEventListener("stage:skip", stageOk);
      el.removeEventListener("pointerdown", skipNow);
      document.removeEventListener("keydown", onKey);
    };

    // The reveal: the same left-to-right page tear as a route change. The cover is part of the root snapshot, so the root keyframes
    // tear it away along a jagged edge while the page waits underneath. The stage waits for the tear to end, then settles.
    function finish() {
      finished = true;
      cancelAnimationFrame(raf);
      cleanup();
      const shell = document.getElementById("shell");
      const reveal = () => {
        html.setAttribute("data-pl-exit", "");
        html.removeAttribute("data-preload");
        shell?.removeAttribute("inert");
      };
      const settle = () => {
        html.setAttribute("data-pl-enter", "");
        window.setTimeout(() => {
          html.removeAttribute("data-pl-exit");
          html.removeAttribute("data-pl-enter");
        }, 1100);
        setDone(true);
      };
      if (typeof document.startViewTransition === "function") {
        const vt = document.startViewTransition(reveal);
        vt.finished.then(settle, settle);
      } else {
        // No view transitions: slide the cover out with the same curve; the page is simply there.
        shell?.removeAttribute("inert");
        el!
          .animate(
            [
              { transform: "none", filter: "brightness(1)" },
              { transform: "translateX(100%) scale(0.96)", filter: "brightness(0.7)" },
            ],
            { duration: 650, easing: EXPO, fill: "forwards" },
          )
          .finished.then(() => {
            reveal();
            settle();
          }, () => {
            reveal();
            settle();
          });
      }
    }

    raf = requestAnimationFrame(tick);
    return () => {
      finished = true;
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  if (done) return null;
  return (
    <>
      <div ref={root} className="pl" aria-hidden="true">
        <div className="pl-logo">
          <span className="logo-box logo-circle">A</span>
          <span className="logo-box logo-square">A</span>
        </div>
        <div className="pl-count">
          <div className="pl-win">
            <div ref={col} className="pl-col">
              <div>0</div>
            </div>
          </div>
        </div>
      </div>
      <span className="pl-status sr-only" role="status">
        Loading
      </span>
    </>
  );
}
