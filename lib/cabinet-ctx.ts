/**
 * Small, dependency-free state shared by the filing cabinet (/blog), the post page and the lazy animation module (lib/cabinet-fx.ts).
 * Kept apart from GSAP so reading it costs nothing. Everything is wrapped in try/catch: storage can be blocked.
 *
 * ctx   = which drawer and folder the reader opened, so closing the post can put the folder back where it came from.
 * armed = set when the reader is on the way back to /blog (X link, Escape or browser Back); the cabinet restores the open drawer
 *         once and clears it, so a fresh visit to /blog later starts with every drawer shut.
 */
export type CabCtx = { slug: string; drawer: number; scrollY: number; armed?: boolean };

const KEY = "cab:ctx";

export function readCtx(): CabCtx | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CabCtx) : null;
  } catch {
    return null;
  }
}

export function writeCtx(c: CabCtx | null) {
  try {
    if (c) sessionStorage.setItem(KEY, JSON.stringify(c));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the cabinet simply starts shut */
  }
}

/** Mark the stored context as "returning to /blog". */
export function armReturn() {
  const c = readCtx();
  if (c) writeCtx({ ...c, armed: true });
}

/** Browser Back from a post to /blog counts as a return too (no animation, the drawer is just restored open). */
let popBound = false;
export function bindPop() {
  if (popBound || typeof window === "undefined") return;
  popBound = true;
  addEventListener("popstate", () => {
    if (location.pathname === "/blog") armReturn();
  });
}

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isBlogPair = (a: string, b: string) => {
  const one = (p: string) => p.replace(/\/$/, "");
  const [x, y] = [one(a), one(b)];
  return (x === "/blog" && y.startsWith("/blog/")) || (y === "/blog" && x.startsWith("/blog/"));
};

/** Which view the writing page shows. ?tag= forces the list; otherwise a stored choice wins; otherwise the list for phones and reduced motion, the cabinet elsewhere. */
export type WritingView = "cabinet" | "list";
export const VIEW_KEY = "wv";
export function pickView(): WritingView {
  if (/[?&]tag=/.test(location.search)) return "list"; // a shared ?tag= link is a list filter
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(VIEW_KEY);
  } catch {
    /* ignore */
  }
  if (stored === "cabinet" || stored === "list") return stored;
  return prefersReducedMotion() || !matchMedia("(min-width: 640px)").matches ? "list" : "cabinet";
}

/** Same rule as pickView, as a string for the inline script that runs before first paint. */
export const viewInitScript = `(function(){try{if(/[?&]tag=/.test(location.search)){document.documentElement.setAttribute("data-wv","list");return}var s=null;try{s=localStorage.getItem("wv")}catch(e){}var v=(s==="cabinet"||s==="list")?s:((matchMedia("(prefers-reduced-motion: reduce)").matches||!matchMedia("(min-width: 640px)").matches)?"list":"cabinet");document.documentElement.setAttribute("data-wv",v)}catch(e){}})()`;
