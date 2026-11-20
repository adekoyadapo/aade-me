"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CabinetDrawer, CabinetPost } from "@/lib/taxonomy";
import { bindPop, prefersReducedMotion, readCtx, writeCtx, type CabCtx } from "@/lib/cabinet-ctx";
import { heroThumb } from "@/lib/cabinet-preview";

type Fx = typeof import("@/lib/cabinet-fx");

const TILT = [3, 37, 70]; // tab left offsets (% of the folder width): left, centre, right, cycled so the tabs stagger like real hanging files
/** Short names for the label holder on the drawer photo (a 16 % wide window); the full name stays in the aria text. */
const LABEL: Record<string, string> = { elasticsearch: "Elasticsearch", ai: "AI + Search", observability: "Observability", platform: "Platform", architecture: "Architecture" };
const heroSeen = new Set<string>();
/** Fetch the sheet's hero thumbnail before the folder opens, so the sheet never paints an empty picture frame. */
function preloadHero(url: string) {
  if (heroSeen.has(url)) return;
  heroSeen.add(url);
  const img = new Image();
  img.decoding = "async";
  img.src = heroThumb(url);
}

/** Distance the pulled drawer travels down so its tray (which opens upward) always fits inside the cabinet. */
function placeDrawer(scene: HTMLElement, i: number) {
  const drawer = scene.querySelector<HTMLElement>(`[data-drawer="${i}"]`);
  const tray = drawer?.querySelector<HTMLElement>(".cab-tray");
  const slot = drawer?.parentElement;
  if (!drawer || !tray || !slot) return;
  drawer.style.setProperty("--dy", `${Math.max(0, tray.offsetHeight + 16 - slot.offsetTop)}px`);
}

/**
 * The filing cabinet. Server-rendered: five closed drawers (buttons) whose trays hold every post as a real link, so the HTML is complete
 * without JS. Hover and open poses are CSS (also the reduced-motion end state); GSAP, loaded lazily on first idle, only tweens between
 * them and plays the folder-opening sequence. Keyboard: arrows move between drawers and folders, Enter opens, Escape shuts.
 */
export default function Cabinet({ drawers, active }: { drawers: CabinetDrawer[]; active: boolean }) {
  const router = useRouter();
  const scene = useRef<HTMLDivElement>(null);
  const fx = useRef<Fx | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [shown, setShown] = useState<number[]>([]);
  const [live, setLive] = useState("");
  const prev = useRef<number | null>(null);
  const back = useRef<CabCtx | null>(null);

  /** Open drawer `next` (or shut everything). Trays stay rendered while a drawer slides shut; without motion they go at once. */
  const go = useCallback(
    (next: number | null) => {
      const was = open;
      setOpen(next);
      setShown((s) => {
        let out = next !== null && !s.includes(next) ? [...s, next] : s;
        if (was !== null && was !== next && (!fx.current || prefersReducedMotion())) out = out.filter((x) => x !== was);
        return out;
      });
    },
    [open],
  );

  // Lazy animation module: after first paint, on idle, and only while the cabinet is the visible view.
  useEffect(() => {
    if (!active) return;
    let dead = false;
    const boot = () => {
      import("@/lib/cabinet-fx").then((m) => {
        if (!dead) fx.current = m;
      });
    };
    const id = window.requestIdleCallback ? window.requestIdleCallback(boot, { timeout: 1500 }) : window.setTimeout(boot, 600);
    return () => {
      dead = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(id as number);
      else clearTimeout(id);
    };
  }, [active]);

  // Coming back from a post: restore the drawer the folder came out of, before first paint.
  useLayoutEffect(() => {
    bindPop();
    const c = readCtx();
    if (!c?.armed) return;
    writeCtx(null);
    if (document.documentElement.getAttribute("data-wv") !== "cabinet" || !drawers[c.drawer]) {
      document.documentElement.removeAttribute("data-cab");
      return;
    }
    back.current = c;
    prev.current = c.drawer;
    // The stored return context only exists on the client, so it cannot seed the initial state without a hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    setOpen(c.drawer);
    setShown([c.drawer]);
    /* eslint-enable react-hooks/set-state-in-effect */
    scrollTo(0, c.scrollY);
  }, [drawers]);

  useEffect(() => {
    const c = back.current;
    if (!c || !scene.current) return;
    back.current = null;
    const root = scene.current;
    placeDrawer(root, c.drawer);
    const link = root.querySelector<HTMLAnchorElement>(`[data-slug="${c.slug}"]`);
    link?.scrollIntoView({ block: "nearest" });
    const finish = () => {
      document.documentElement.removeAttribute("data-cab");
      // The folder is home: slide the drawer shut and hand focus to its handle.
      go(null);
      setLive(`${drawers[c.drawer].name} drawer closed`);
      root.querySelector<HTMLElement>(`[data-drawer="${c.drawer}"] .cab-front`)?.focus({ preventScroll: true });
    };
    if (document.documentElement.getAttribute("data-cab") === "out" && link) {
      import("@/lib/cabinet-fx").then((m) => {
        fx.current = m;
        const post = drawers[c.drawer].posts.find((x) => x.slug === c.slug);
        m.returnFolder({ root, link, post, onDone: finish });
      });
    } else {
      link?.focus({ preventScroll: true });
    }
  }, [drawers, go]);

  // Drawer poses. The CSS for the new state is already applied; the tween runs from the old pose to it.
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = open;
    if (!scene.current) return;
    const root = scene.current;
    if (open !== null) placeDrawer(root, open);
    if (was === open) return;
    const m = fx.current;
    if (!m || prefersReducedMotion()) return;
    m.animateDrawers({ root, from: was, to: open, count: drawers.length, onClosed: (i) => setShown((s) => s.filter((x) => x !== i)) });
  }, [open, drawers.length]);

  // Escape shuts the open drawer from anywhere on the page.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const root = scene.current;
      if (!root || root.inert) return;
      const i = open;
      go(null);
      setLive(`${drawers[i].name} drawer closed`);
      root.querySelector<HTMLElement>(`[data-drawer="${i}"] .cab-front`)?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, drawers, go]);

  const toggle = (i: number) => {
    const next = open === i ? null : i;
    go(next);
    const d = drawers[i];
    setLive(next === null ? `${d.name} drawer closed` : `${d.name} drawer open, ${d.posts.length} ${d.posts.length === 1 ? "post" : "posts"}`);
    if (next !== null) {
      requestAnimationFrame(() =>
        scene.current?.querySelector<HTMLElement>(`[data-drawer="${i}"] .cab-file`)?.focus({ preventScroll: true }),
      );
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    const root = scene.current;
    if (!root || e.altKey || e.ctrlKey || e.metaKey) return;
    const fronts = [...root.querySelectorAll<HTMLElement>(".cab-front")];
    if (t.classList.contains("cab-front")) {
      const at = fronts.indexOf(t);
      const to = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? fronts.length - 1 : -1;
      if (to >= 0 && to < fronts.length) {
        e.preventDefault();
        fronts[to].focus();
      }
    } else if (t.classList.contains("cab-file")) {
      const files = [...(t.closest(".cab-tray")?.querySelectorAll<HTMLElement>(".cab-file") ?? [])];
      const at = files.indexOf(t);
      const to = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? files.length - 1 : -1;
      if (to >= 0 && to < files.length) {
        e.preventDefault();
        files[to].focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        t.closest("[data-drawer]")?.querySelector<HTMLElement>(".cab-front")?.focus();
      }
    }
  };

  const onFolder = (e: React.MouseEvent<HTMLAnchorElement>, drawer: number, post: CabinetPost) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const m = fx.current;
    const root = scene.current;
    if (!m || !root || prefersReducedMotion()) return; // plain navigation
    e.preventDefault();
    const link = e.currentTarget;
    m.openFolder({
      root,
      link,
      drawer,
      href: link.getAttribute("href")!,
      slug: link.dataset.slug!,
      post,
      push: (h) => router.push(h),
    });
  };

  const warm = (p: CabinetPost) => {
    router.prefetch(`/blog/${p.slug}`);
    preloadHero(p.hero);
  };

  // Pointer light: a highlight on the steel follows the pointer and the whole cabinet leans a few degrees. One write per frame, mouse only.
  const aim = useRef<{ raf: number; x: number; y: number }>({ raf: 0, x: 0, y: 0 });
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const a = aim.current;
    a.x = e.clientX;
    a.y = e.clientY;
    if (a.raf) return;
    a.raf = requestAnimationFrame(() => {
      a.raf = 0;
      const root = scene.current;
      const frame = root?.querySelector<HTMLElement>(".cab-case");
      if (!root || !frame) return;
      const r = frame.getBoundingClientRect();
      root.style.setProperty("--mx", `${(a.x - r.left).toFixed(0)}px`);
      root.style.setProperty("--my", `${(a.y - r.top).toFixed(0)}px`);
      root.style.setProperty("--px", String(Math.max(-1, Math.min(1, ((a.x - r.left) / r.width - 0.5) * 2)).toFixed(2)));
      root.style.setProperty("--py", String(Math.max(-1, Math.min(1, ((a.y - r.top) / r.height - 0.5) * 2)).toFixed(2)));
    });
  };
  const onLeave = () => {
    const a = aim.current;
    cancelAnimationFrame(a.raf);
    a.raf = 0;
    const root = scene.current;
    ["--mx", "--my", "--px", "--py"].forEach((k) => root?.style.removeProperty(k));
  };
  useEffect(() => () => cancelAnimationFrame(aim.current.raf), []);

  return (
    <div className="cab" ref={scene} onKeyDown={onKeyDown} data-open={open ?? undefined}>
      <p role="status" className="sr-only">
        {live}
      </p>
      <div className="cab-room" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="cab-floor" aria-hidden="true" />
        <div className="cab-body">
          <div className="cab-case">
            <div className="cab-top" aria-hidden="true" />
            <div className="cab-sl" aria-hidden="true" />
            <div className="cab-sr" aria-hidden="true" />
            <div className="cab-frame" aria-hidden="true" />
            {drawers.map((d, i) => {
              const state = open === null ? "rest" : open === i ? "open" : "dim";
              const id = `cab-tray-${d.id}`;
              const n = d.posts.length;
              return (
                <div className="cab-slot" key={d.id} style={{ "--i": i } as React.CSSProperties}>
                  <div className="cab-bay" aria-hidden="true" />
                  <div className="cab-drawer" data-drawer={i} data-s={state}>
                    <button
                      type="button"
                      className="cab-front"
                      aria-expanded={open === i}
                      aria-controls={id}
                      onClick={() => toggle(i)}
                    >
                      <span className="cab-label">
                        <span className="cab-name">{LABEL[d.id] ?? d.name}</span>
                        <span>
                          <span aria-hidden="true">:: </span>
                          <span className="cab-count">{n}</span>
                        </span>
                        <span className="sr-only">
                          {" "}
                          {d.name}, {n === 1 ? "post" : "posts"}
                        </span>
                      </span>
                    </button>
                    <span className="cab-cast" aria-hidden="true" />
                    <div id={id} className="cab-tray" role="group" aria-label={`${d.name}: ${d.blurb}`} hidden={!shown.includes(i)} data-lenis-prevent>
                      <ul className="cab-files">
                        {d.posts.map((p, k) => {
                          const r = (((k * 7 + 3) % 13) - 6) / 5; // tilt, -1.2 to 1.2 degrees
                          const ox = (((k * 5 + 1) % 7) - 3) * 0.35; // sideways drift, in cqw
                          return (
                            <li key={p.slug} style={{ "--r": `${r}deg`, "--ox": `${ox}cqw` } as React.CSSProperties}>
                              <Link
                                href={`/blog/${p.slug}`}
                                prefetch={false}
                                className={`cab-file fold${k % 3 === 0 ? " fold-l" : ""}`}
                                style={{ "--tx": `${TILT[k % 3]}%` } as React.CSSProperties}
                                data-slug={p.slug}
                                title={p.title}
                                onClick={(e) => onFolder(e, i, p)}
                                onPointerEnter={() => warm(p)}
                                onFocus={() => warm(p)}
                              >
                                <span className="cab-hit" aria-hidden="true" />
                                <span className="cab-tilt">
                                  <i className="fold-tab" aria-hidden="true" />
                                  <i className="fold-body" aria-hidden="true" />
                                  <span className="fold-lab">
                                    <span className="cab-tab">{p.title}</span>
                                  </span>
                                  <time className="cab-date fold-date" dateTime={p.date}>
                                    {p.date}
                                  </time>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cab-plinth" aria-hidden="true" />
        </div>
        <div className="cab-refl" aria-hidden="true" />
      </div>
    </div>
  );
}
