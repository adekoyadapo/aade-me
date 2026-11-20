"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SIZES_FEATURED, SIZES_TILE } from "@/lib/stage";

const pad = (n: number) => String(n).padStart(2, "0");

const LOCK = 850; // ms: one step per gesture
const MOVE = 950; // ms: how long card transforms are animating (will-change window)
const SCRAMBLE = 400;
const SETTLE = 300; // ms: the caption fades in and starts decoding once the artwork has moved past it
const MOTION = "(prefers-reduced-motion: no-preference)";
const FORM = "input,textarea,select,[contenteditable],[data-scroll-lock],[data-lenis-prevent]";

/**
 * Home stage island. The artwork cards, captions and the project list are server-rendered; this
 * (1) moves the chosen project's card to the large slot and shows its caption,
 * (2) steps through the projects with wheel, trackpad, swipe, arrow keys, the prev/next buttons and the dots,
 * (3) scrambles the featured title into the next one (static under reduced motion),
 * (4) pointer parallax on fine pointers. CSS does the moving; the only timers are a 40 ms interval while a title scrambles.
 *
 * Scroll compromise: while the page is at the top, a gesture steps projects. At the last project a further down gesture
 * (and at the first one an up gesture) is left alone so normal page scroll takes over. Reduced motion: no wheel, swipe or
 * vertical-arrow capture and no scramble; the buttons and dots swap instantly.
 */
export default function HeroStageControls({ titles }: { titles: string[] }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const total = titles.length;
  const cur = useRef(0);
  const lockUntil = useRef(0);
  const mounted = useRef(false);
  const scr = useRef<{ timer: number; el: HTMLElement; text: string } | null>(null);

  const jump = useCallback(
    (n: number) => {
      const next = ((n % total) + total) % total;
      if (next === cur.current) return;
      cur.current = next;
      lockUntil.current = performance.now() + LOCK;
      setIndex(next);
    },
    [total],
  );

  // Card i sits in slot (i - index); slot 0 is the featured, large card. Caption follows. Title scrambles on change.
  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>("[data-hero]");
    if (!hero) return;
    hero.querySelectorAll<HTMLElement>("[data-card]").forEach((el, i) => {
      const slot = (i - index + total) % total;
      el.dataset.slot = String(slot);
      if (slot === 0) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
      // Tiles ship small files; the featured card asks for the large one, and so do the two cards that will be featured next.
      const img = el.querySelector("img");
      if (img && mounted.current && !hero.hasAttribute("data-gl")) img.sizes = slot === 0 || slot === 1 || slot === total - 1 ? SIZES_FEATURED : SIZES_TILE;
    });
    const items = hero.querySelectorAll<HTMLElement>("[data-stage-item]");
    items.forEach((el, i) => {
      if (i === index) el.setAttribute("data-active", "true");
      else el.removeAttribute("data-active");
    });
    hero.dataset.lock = matchMedia(MOTION).matches && scrollY <= 1 && index < total - 1 ? "1" : "";
    hero.dataset.index = String(index);

    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!matchMedia(MOTION).matches) return;
    hero.dispatchEvent(new CustomEvent("stage-change", { detail: { index } })); // the optional WebGL layer follows (lib/gl/stage.ts)
    hero.setAttribute("data-moving", "");
    const done = window.setTimeout(() => hero.removeAttribute("data-moving"), MOVE);

    // Title scramble: characters come from the title itself plus a few marks, resolving left to right.
    if (scr.current) {
      clearInterval(scr.current.timer);
      scr.current.el.textContent = scr.current.text;
      scr.current = null;
    }
    const el = items[index]?.querySelector<HTMLElement>("[data-title]");
    const text = titles[index];
    if (el && text) {
      const pool = (text.replace(/\s/g, "") + "/_-+").split("");
      const t0 = performance.now() + SETTLE; // wait for the arriving artwork to clear the caption
      const timer = window.setInterval(() => {
        const p = Math.max(0, Math.min(1, (performance.now() - t0) / SCRAMBLE));
        if (p >= 1) {
          clearInterval(timer);
          el.textContent = text;
          scr.current = null;
          return;
        }
        const keep = Math.floor(p * text.length);
        el.textContent = text
          .split("")
          .map((c, i) => (c === " " || i < keep ? c : pool[(Math.random() * pool.length) | 0]))
          .join("");
      }, 40);
      scr.current = { timer, el, text };
    }
    return () => clearTimeout(done);
  }, [index, total, titles]);

  useEffect(
    () => () => {
      if (scr.current) {
        clearInterval(scr.current.timer);
        scr.current.el.textContent = scr.current.text;
      }
    },
    [],
  );

  // Input: wheel, touch, keys, card click, parallax, visibility. Registered once; all state is in refs.
  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>("[data-hero]");
    if (!hero) return;
    const mq = matchMedia(MOTION);
    const last = total - 1;
    const atTop = () => scrollY <= 1;
    const overlay = () => !!document.querySelector("[data-scroll-lock]") || document.documentElement.hasAttribute("data-preload");

    // Wheel and trackpad. Capture phase, so Lenis never sees a gesture the stage owns.
    let acc = 0;
    let lastT = 0;
    let lastMag = 0;
    let lastDir = 0;
    let armed = true;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || !mq.matches) return;
      const now = performance.now();
      const t = e.target as Element | null;
      if (!atTop()) {
        armed = false; // the tail of a scroll that reached the top must not step
        lastT = now;
        return;
      }
      if (overlay() || t?.closest?.(FORM)) return;
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
      const dx = e.deltaX * k;
      const dy = e.deltaY * k;
      const d = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
      if (!d) return;
      const dir = d > 0 ? 1 : -1;
      const mag = Math.abs(d);
      // A new gesture: a pause, a reversal, or a clear acceleration after inertia decays.
      if (now - lastT > 140 || dir !== lastDir || (mag > lastMag * 1.6 && mag >= 30)) {
        armed = true;
        acc = 0;
      }
      lastT = now;
      lastMag = mag;
      lastDir = dir;
      const next = cur.current + dir;
      if (armed && (next < 0 || next > last)) return; // edge: normal page scroll
      e.preventDefault();
      e.stopPropagation();
      if (!armed || now < lockUntil.current) return;
      acc += d;
      if (Math.abs(acc) < 40) return;
      armed = false;
      acc = 0;
      jump(next);
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });

    // Swipe. touch-action is pan-x while the stage owns vertical swipes (see data-lock), so the first move is cancelable.
    let touch: { x: number; y: number; done: boolean } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touch = mq.matches && atTop() && e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, done: false } : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch || touch.done) return;
      const dx = e.touches[0].clientX - touch.x;
      const dy = e.touches[0].clientY - touch.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
      touch.done = true;
      const dir = Math.abs(dy) >= Math.abs(dx) ? (dy < 0 ? 1 : -1) : dx < 0 ? 1 : -1;
      const next = cur.current + dir;
      if (next < 0 || next > last) return; // edge: normal page scroll
      if (e.cancelable) e.preventDefault();
      if (performance.now() >= lockUntil.current) jump(next);
    };
    const onTouchEnd = () => {
      touch = null;
    };
    hero.addEventListener("touchstart", onTouchStart, { passive: true });
    hero.addEventListener("touchmove", onTouchMove, { passive: false });
    hero.addEventListener("touchend", onTouchEnd, { passive: true });
    hero.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // Keys. Left and right always; up and down only when motion is allowed. At the ends the browser keeps the key.
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || !atTop() || overlay()) return;
      if ((e.target as Element | null)?.closest?.(FORM)) return;
      const k = e.key;
      const dir =
        k === "ArrowRight" || (k === "ArrowDown" && mq.matches) ? 1 : k === "ArrowLeft" || (k === "ArrowUp" && mq.matches) ? -1 : 0;
      if (!dir) return;
      const next = cur.current + dir;
      if (next < 0 || next > last) return;
      e.preventDefault();
      jump(next);
    };
    window.addEventListener("keydown", onKey);

    // data-lock (touch-action) follows scroll position and index.
    const sync = () => {
      hero.dataset.lock = mq.matches && atTop() && cur.current < last ? "1" : "";
    };
    window.addEventListener("scroll", sync, { passive: true });
    mq.addEventListener("change", sync);

    // Click a satellite card to feature it.
    const onClick = (e: MouseEvent) => {
      const card = (e.target as Element).closest<HTMLElement>("[data-card]");
      if (card && card.dataset.slot !== "0") jump(Number(card.dataset.idx));
    };
    hero.addEventListener("click", onClick);

    // Pause the float animation when the stage is off screen.
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) hero.removeAttribute("data-off");
      else hero.setAttribute("data-off", "");
    });
    io.observe(hero);

    // Pointer parallax (fine pointer, motion allowed): rAF only while the pointer moves.
    const fine = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        hero.style.setProperty("--mx", ((e.clientX / innerWidth - 0.5) * 2).toFixed(3));
        hero.style.setProperty("--my", ((e.clientY / innerHeight - 0.5) * 2).toFixed(3));
      });
    };
    if (fine.matches) hero.addEventListener("pointermove", onMove);

    // After load, fetch the other artwork in idle time so a step never waits on the network.
    const warm = () =>
      hero.querySelectorAll<HTMLImageElement>("[data-card] img").forEach((img) => {
        img.loading = "eager";
        const slot = Number(img.closest<HTMLElement>("[data-card]")?.dataset.slot);
        if (slot === 1 || slot === last) img.sizes = SIZES_FEATURED; // the next featured card arrives sharp
      });
    const idle = () => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(warm, { timeout: 4000 });
      else setTimeout(warm, 1500);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      hero.removeEventListener("touchstart", onTouchStart);
      hero.removeEventListener("touchmove", onTouchMove);
      hero.removeEventListener("touchend", onTouchEnd);
      hero.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", sync);
      mq.removeEventListener("change", sync);
      hero.removeEventListener("click", onClick);
      hero.removeEventListener("pointermove", onMove);
      window.removeEventListener("load", idle);
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [total, jump]);

  const arrow = "stage-arrow";

  return (
    <div ref={ref} className="stage-ctrl">
      <button type="button" className={arrow} aria-label="Previous project" onClick={() => jump(index - 1)}>
        <span aria-hidden="true">&larr;</span>
      </button>
      <button type="button" className={arrow} aria-label="Next project" onClick={() => jump(index + 1)}>
        <span aria-hidden="true">&rarr;</span>
      </button>
      <ul className="stage-dots" aria-label="Jump to project">
        {titles.map((t, i) => (
          <li key={t}>
            <button
              type="button"
              aria-label={`${pad(i + 1)} ${t}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => jump(i)}
              className="dot-btn"
            />
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        Project {index + 1} of {total}: {titles[index]}
      </p>
    </div>
  );
}
