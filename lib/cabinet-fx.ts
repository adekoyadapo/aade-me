import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { armReturn, writeCtx } from "./cabinet-ctx";
import { sheetHTML } from "./cabinet-preview";
import type { CabinetPost } from "./taxonomy";

/**
 * Filing cabinet motion (lazy chunk: GSAP core + Flip, loaded on idle on /blog and on a post page, never in the first paint).
 * All timelines are created on interaction, only animate transform and opacity (plus one clip-path on a childless strip while the
 * folder leaves its drawer), set will-change only while they run, and share GSAP's single rAF ticker. The CSS in app/globals.css holds
 * the same end poses, so reduced motion, a missing chunk or a killed tween all land on a correct static state.
 *
 * Sequence, click on a folder (t in seconds):
 *   0.00  the folder row becomes a lifted folder (rig) over the drawer, the page behind starts to dim
 *   0.05  rig lifts to the middle of the screen and the clip releases (0.6 power3.out)
 *   0.45  the cabinet is cloned into a back layer (so it can stay dimmed behind the article) and the route changes
 *   0.50  cover swings open on its spine in 3D (0.45); the sheet, a miniature of the real article (lib/cabinet-preview.ts), shows
 *         as the cover passes 90 degrees, then slides up and tilts out with a halftone burst (0.4)
 *   ~1.1  Flip.fit flies the sheet to the article paper (0.85 expo.out) with a settling tilt, a growing shadow and a paper curl.
 *         The preview is the article's own markup at the article's own width, so it lands on the real header pixel for pixel.
 *         Once the article is mounted and its hero has decoded, the real paper appears under the sheet and the sheet fades out
 *         over 0.25 s; the chrome (0.55 expo.out, stagger 0.08) and the blocks the preview did not show (0.7 expo.out) rise in.
 * All open-sequence times above are scaled by OPEN_SPEED (about 1.7x slower, ~2.2 s click to settled).
 * Close (X link or Escape): chrome fades (0.2), paper drops (0.55 power2.in), route back, folder returns (0.62 expo.out), drawer shuts.
 */
gsap.registerPlugin(Flip);

/** Open sequence runs at 1/1.7 speed (same easings and stagger proportions). The close sequence is untouched. */
const OPEN_SPEED = 1 / 1.7;
const de = () => document.documentElement;
const HEADER = () => (innerWidth >= 768 ? 96 : 72);
const mk = (cls: string, html = "") => {
  const d = document.createElement("div");
  d.className = cls;
  if (html) d.innerHTML = html;
  return d;
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/* ------------------------------------------------------------------ drawers */

type Pose = { y: number; z: number; rotateX: number; opacity: number };
const OPEN_Z = 150;
const OPEN_RX = 3;
const DIM_Z = -60;
const DIM_OPACITY = 0.5;
const state = (i: number, sel: number | null) => (sel === null ? "rest" : sel === i ? "open" : "dim");
const pose = (s: string, dy: number): Pose =>
  s === "open" ? { y: dy, z: OPEN_Z, rotateX: OPEN_RX, opacity: 1 } : s === "dim" ? { y: 0, z: DIM_Z, rotateX: 0, opacity: DIM_OPACITY } : { y: 0, z: 0, rotateX: 0, opacity: 1 };

/** Tween every drawer from its pose in the previous state to the pose of the new state (CSS already holds the new one). */
export function animateDrawers(o: { root: HTMLElement; from: number | null; to: number | null; count: number; onClosed: (i: number) => void }) {
  const drawers = [...o.root.querySelectorAll<HTMLElement>(".cab-drawer")];
  drawers.forEach((el, i) => {
    const a = state(i, o.from);
    const b = state(i, o.to);
    const dy = parseFloat(el.style.getPropertyValue("--dy")) || 0;
    const live = gsap.isTweening(el);
    const start: Pose = live
      ? {
          y: +gsap.getProperty(el, "y"),
          z: +gsap.getProperty(el, "z"),
          rotateX: +gsap.getProperty(el, "rotateX"),
          opacity: +gsap.getProperty(el, "opacity"),
        }
      : pose(a, dy);
    if (a === b && !live) return;
    // The cast shadow under the drawer grows as it comes out and fades as it goes back.
    const cast = el.querySelector<HTMLElement>(".cab-cast");
    if (cast) {
      const from = live ? +gsap.getProperty(cast, "opacity") : a === "open" ? 1 : 0;
      const to = b === "open" ? 1 : 0;
      if (from !== to)
        gsap.fromTo(cast, { opacity: from }, { opacity: to, duration: b === "open" ? 0.9 : 0.5, ease: "power2.out", overwrite: true, clearProps: "opacity" });
    }
    gsap.fromTo(el, start, {
      ...pose(b, dy),
      duration: b === "open" ? 0.7 : a === "open" ? 0.55 : 0.45,
      ease: b === "open" ? "expo.out" : "power3.inOut",
      overwrite: true,
      onStart: () => {
        el.style.willChange = "transform, opacity";
      },
      onComplete: () => {
        gsap.set(el, { clearProps: "transform,opacity" });
        el.style.willChange = "";
        if (a === "open" && b !== "open") o.onClosed(i);
      },
    });
  });

  if (o.to !== null) {
    const tray = drawers[o.to]?.querySelector<HTMLElement>(".cab-tray");
    if (tray) {
      tray.scrollTop = 0;
      gsap.fromTo(tray, { opacity: 0 }, { opacity: 1, duration: 0.35, delay: 0.08, ease: "power1.out", overwrite: true, clearProps: "opacity" });
      const files = tray.querySelectorAll<HTMLElement>(".cab-tilt");
      gsap.fromTo(
        files,
        { y: 22, opacity: 0, rotateX: -30, transformPerspective: 700, transformOrigin: "50% 100%", transition: "none" },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.55, ease: "expo.out", delay: 0.14, stagger: { amount: 0.3 }, overwrite: true, clearProps: "transform,opacity,transformOrigin,transition" },
      );
    }
  }
  if (o.from !== null && o.from !== o.to) {
    const tray = drawers[o.from]?.querySelector<HTMLElement>(".cab-tray");
    if (tray) gsap.to(tray, { opacity: 0, duration: 0.25, ease: "power1.in", overwrite: true });
  }
}

/* ------------------------------------------------------------------- folder rig */

type Rig = {
  layer: HTMLElement;
  rig: HTMLElement;
  clip: HTMLElement;
  backLab: HTMLElement[];
  cover: HTMLElement;
  sheet: HTMLElement;
  pv: HTMLElement;
  W: number;
  H: number;
  Ws: number; // folder width on the stage
  Hd: number; // sheet design height (the preview laid out at the article width)
  ss0: number; // sheet scale while it sits in the folder
  sx0: number;
  sy0: number;
  lip: number;
};

/** Width of the article paper at the current viewport, measured with the same classes the page uses. */
function paperWidth() {
  const g = mk("gutter");
  g.style.cssText = "position:fixed;left:0;right:0;top:0;visibility:hidden;pointer-events:none";
  g.innerHTML = '<div class="pv-sheet"></div>';
  document.body.appendChild(g);
  const w = g.firstElementChild!.getBoundingClientRect().width;
  g.remove();
  return w;
}

/** Box of the folder as drawn (the tilt wrapper, so the hover lift and the tilt count), in viewport px. */
const foldRect = (link: HTMLElement) => (link.querySelector<HTMLElement>(".cab-tilt") ?? link).getBoundingClientRect();

/** The lifted folder: the same markup and cqw sizes as a folder in the tray (.fold), so the swap from the row is invisible. */
function buildRig(link: HTMLElement, post: CabinetPost | undefined, title: string, date: string): Rig {
  const W = Math.round(link.offsetWidth || foldRect(link).width);
  const H = Math.round((W * 790) / 1180);
  const tx = link.style.getPropertyValue("--tx") || "70%";
  const left = link.classList.contains("fold-l") ? " fold-l" : "";
  const fp = link.parentElement?.offsetHeight ?? 56;
  const lip = fp + W * 0.038 + 1;
  const Ws = Math.round(Math.min(W, Math.max(260, Math.min(innerWidth * 0.8, 560))));
  const layer = mk("fx-front");
  layer.setAttribute("aria-hidden", "true");
  const lab = `<span class="fold-lab"><span class="cab-tab">${esc(title)}</span></span><time class="fold-date">${esc(date)}</time>`;
  layer.innerHTML = `
    <div class="fxf-rig" style="width:${W}px;height:${H}px;--tx:${tx}">
      <div class="fxf-clip" style="clip-path:inset(-80px -3px ${H - lip}px -3px)">
        <div class="fxf-back fold${left}"><i class="fold-tab"></i><i class="fold-body"></i>${lab}</div>
      </div>
      <div class="fxf-sheet"><i class="fxf-sh"></i>${sheetHTML(post ?? { slug: "", title, date, excerpt: "", readTime: "", hero: "", tags: [], lead: "" })}</div>
      <div class="fxf-cover">
        <div class="fxf-face fold${left}"><i class="fold-body"></i>${lab}</div>
        <div class="fxf-inner fold"><i class="fold-body"></i></div>
      </div>
    </div>`;
  document.body.appendChild(layer);
  const q = <T extends HTMLElement>(sel: string) => layer.querySelector<T>(sel)!;
  const sheet = q(".fxf-sheet");
  const Wd = paperWidth();
  sheet.style.width = `${Wd}px`;
  const Hd = sheet.offsetHeight;
  // The sheet sits inside the folder, bottom aligned, as large as the folder allows.
  const ss0 = Math.min((H * 0.88) / Hd, (W * 0.9) / Wd);
  const sx0 = (W - Wd * ss0) / 2;
  const sy0 = Math.max(H * 0.06, H * 0.95 - Hd * ss0);
  return {
    layer,
    rig: q(".fxf-rig"),
    clip: q(".fxf-clip"),
    backLab: [...layer.querySelectorAll<HTMLElement>(".fxf-back .fold-lab, .fxf-back .fold-date")],
    cover: q(".fxf-cover"),
    sheet,
    pv: q(".pv-sheet"),
    W,
    H,
    Ws,
    Hd,
    ss0,
    sx0,
    sy0,
    lip,
  };
}

/** Where the folder stands on the stage (top left corner, in px) and its scale. */
function stagePos(rig: Rig) {
  const top = HEADER();
  const sc = rig.Ws / rig.W;
  const Hs = rig.H * sc;
  return { x: innerWidth / 2 - rig.Ws / 2, y: top + (innerHeight - top) / 2 - Hs / 2 + 8, sc };
}

/* ----------------------------------------------------------------- flight state */

type Flight = {
  id: number;
  rig: Rig | null;
  back: HTMLElement | null;
  arrive: ((paper: HTMLElement) => void) | null;
  paper: HTMLElement | null;
  tl: gsap.core.Timeline | null;
  closing: boolean;
  watchdog: number;
};
let flight: Flight | null = null;
let seq = 0;

function cleanup(f: Flight) {
  clearTimeout(f.watchdog);
  f.tl?.kill();
  if (f.rig) {
    gsap.killTweensOf(f.rig.layer.querySelectorAll("*"));
    f.rig.layer.remove();
  }
  f.back?.remove();
  if (flight === f) flight = null;
}

/** Last resort: never leave the reader stuck behind an overlay. */
function bail(f: Flight, href: string | null) {
  cleanup(f);
  de().setAttribute("data-cab", "done");
  gsap.set(document.querySelectorAll(".post-paper, .post-paper [data-rise], #post-content > *"), { clearProps: "all" });
  if (href && location.pathname !== href) window.location.replace(href);
}

/* ------------------------------------------------------------------ open a folder */

export async function openFolder(o: {
  root: HTMLElement;
  link: HTMLAnchorElement;
  drawer: number;
  href: string;
  slug: string;
  post?: CabinetPost;
  push: (href: string) => void;
}) {
  if (flight) return;
  const f: Flight = { id: ++seq, rig: null, back: null, arrive: null, paper: null, tl: null, closing: false, watchdog: 0 };
  flight = f;
  const alive = () => flight === f;

  const idx = o.root.closest<HTMLElement>("#writing-index")!;
  o.link.scrollIntoView({ block: "nearest" });
  const title = o.link.querySelector(".cab-tab")?.textContent ?? "";
  const date = o.link.querySelector("time")?.textContent ?? "";
  const rig = buildRig(o.link, o.post, title, date);
  f.rig = rig;
  const r = foldRect(o.link);

  de().setAttribute("data-cab", "in");
  writeCtx({ slug: o.slug, drawer: o.drawer, scrollY });
  o.root.inert = true;
  o.link.style.visibility = "hidden";
  f.watchdog = window.setTimeout(() => bail(f, o.href), 10000);

  const st = stagePos(rig);
  const shift = rig.Ws * 0.46;
  gsap.set(rig.rig, { x: r.left, y: r.top, scale: 1, transformOrigin: "0 0", willChange: "transform" });
  gsap.set(rig.sheet, { x: rig.sx0, y: rig.sy0, scale: rig.ss0, z: 1, opacity: 0, transformOrigin: "0 0", willChange: "transform" });
  gsap.set(rig.cover, { opacity: 0, z: 3 });

  const navigate = () => {
    if (!alive()) return;
    const clone = idx.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    clone.inert = true;
    const b = idx.getBoundingClientRect();
    clone.style.cssText += `;position:absolute;margin:0;left:${b.left}px;top:${b.top}px;width:${b.width}px;opacity:${gsap.getProperty(idx, "opacity")}`;
    const layer = mk("fx-back");
    layer.setAttribute("aria-hidden", "true");
    layer.appendChild(clone);
    document.body.appendChild(layer);
    const t0 = idx.querySelector<HTMLElement>(".cab-tray:not([hidden])");
    const t1 = clone.querySelector<HTMLElement>(".cab-tray:not([hidden])");
    if (t0 && t1) t1.scrollTop = t0.scrollTop;
    f.back = layer;
    gsap.to(clone, { opacity: 0.35, duration: 0.3, ease: "power2.out", overwrite: true });
    o.push(o.href);
  };

  const arrival = new Promise<HTMLElement | null>((res) => {
    f.arrive = (p) => res(p);
    setTimeout(() => res(null), 4200);
  });

  // Halftone burst behind the sheet as it tilts out.
  const halo = mk("fxf-halo");
  rig.layer.insertBefore(halo, rig.rig);
  gsap.set(halo, { x: st.x + shift + rig.Ws * 0.1, y: st.y + (rig.H * st.sc) / 2, opacity: 0, scale: 0.5 });

  const tl = gsap.timeline();
  f.tl = tl;
  tl.timeScale(OPEN_SPEED);
  tl.to(rig.rig, { x: st.x, y: st.y, scale: st.sc, duration: 0.6, ease: "power3.out" }, 0.05)
    .to(rig.clip, { clipPath: "inset(-80px -3px -6px -3px)", duration: 0.45, ease: "power2.out" }, 0.05)
    .to(rig.backLab, { opacity: 0, duration: 0.25, ease: "power1.out" }, 0.1)
    .to(rig.cover, { opacity: 1, duration: 0.1 }, 0.2)
    .to(idx, { opacity: 0.35, duration: 0.5, ease: "power2.out" }, 0.1)
    .call(navigate, undefined, 0.45)
    .to(rig.rig, { x: `+=${shift}`, duration: 0.5, ease: "power2.inOut" }, 0.5)
    .to(rig.cover, { rotateY: -158, duration: 0.45, ease: "power2.inOut" }, 0.5)
    .to(rig.sheet, { opacity: 1, duration: 0.1, ease: "none" }, 0.66)
    .fromTo(rig.sheet, { y: rig.sy0, rotateX: 12 }, { y: rig.sy0 - rig.H * 0.15, rotateX: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, 0.72)
    .fromTo(halo, { opacity: 0.55, scale: 0.5 }, { opacity: 0, scale: 1.3, duration: 0.6, ease: "power2.out", immediateRender: false }, 0.74);

  await tl;
  if (!alive()) return;
  const paper = await arrival;
  if (!alive()) return;
  if (!paper) return bail(f, o.href);

  // The real article has mounted. Wait (briefly) for its hero picture so the hand-over shows no empty frame.
  const hero = paper.querySelector<HTMLImageElement>(".post-hero img");
  if (hero && !(hero.complete && hero.naturalWidth)) {
    await Promise.race([hero.decode().catch(() => undefined), new Promise((res) => setTimeout(res, 1400))]);
    if (!alive()) return;
  }

  // Flight: the sheet flies to the article paper. Its layout is the article's, so at scale 1 it covers the real header exactly.
  const pr = paper.getBoundingClientRect();
  const probe = mk("fx-probe");
  probe.style.cssText = `left:${pr.left}px;top:${pr.top}px;width:${pr.width}px;height:${rig.Hd * (pr.width / (parseFloat(rig.sheet.style.width) || pr.width))}px`;
  rig.layer.appendChild(probe);
  const chrome = [...paper.querySelectorAll<HTMLElement>("[data-rise]:not([data-pv])")];
  const blocks = [...paper.querySelectorAll<HTMLElement>("#post-content > :not(:first-child)")].slice(0, 14);
  const FIT = 0.85;
  const out = gsap.timeline();
  f.tl = out;
  out.timeScale(OPEN_SPEED);
  out
    .to([rig.clip, rig.cover], { opacity: 0, duration: 0.4, ease: "power2.out" }, 0)
    .add(Flip.fit(rig.sheet, probe, { scale: true, duration: FIT, ease: "expo.out" }) as gsap.core.Tween, 0)
    // Settle: a slight tilt flattens, the shadow grows, the paper grain drops out (the real paper has none), the lower edge curls flat.
    .fromTo(rig.sheet, { rotateZ: -2.4, skewX: 1.6 }, { rotateZ: 0, skewX: 0, duration: FIT, ease: "expo.out" }, 0)
    .to(rig.sheet, { z: 0, duration: FIT, ease: "none" }, 0)
    .fromTo(rig.layer.querySelector(".fxf-sh"), { opacity: 0.3 }, { opacity: 1, duration: FIT * 0.7, ease: "power2.out" }, 0)
    .to(rig.pv.querySelector(".pv-tex"), { opacity: 0, duration: FIT, ease: "power1.inOut" }, 0)
    .fromTo(rig.pv.querySelector(".fxf-curl"), { transformPerspective: 500, rotateX: 40, opacity: 1 }, { rotateX: 0, opacity: 0, duration: FIT * 0.8, ease: "power2.out" }, 0)
    // Hand over: the real paper appears under the sheet, which fades out over 250 ms.
    .set(paper, { opacity: 1 }, FIT)
    .to(rig.sheet, { opacity: 0, duration: 0.25, ease: "none" }, FIT)
    .fromTo(chrome, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "expo.out", stagger: 0.08 }, FIT + 0.06)
    .fromTo(blocks, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.06 }, FIT + 0.14);
  await out;
  if (!alive()) return;
  // Everything is in place: lift the CSS hold (paper, chrome and the blocks below the fold appear) and drop the inline end states.
  de().setAttribute("data-cab", "done");
  gsap.set([paper, ...chrome, ...blocks], { clearProps: "transform,opacity" });
  clearTimeout(f.watchdog);
  f.rig = null;
  rig.layer.remove();
  flight = { ...f, rig: null, tl: null, arrive: null, paper };
}

/** Called by the post page when it mounts. Resolves the pending flight, if any. */
export function arrive(paper: HTMLElement) {
  const f = flight;
  if (f?.arrive) {
    f.arrive(paper);
    f.arrive = null;
    return true;
  }
  if (de().getAttribute("data-cab") === "in") de().setAttribute("data-cab", "done"); // stale flag (reload, aborted flight)
  return false;
}

/** The post page unmounted. Remove what we left behind unless the reader is on the way back to the cabinet. */
export function leave() {
  const f = flight;
  if (f && !f.closing) {
    cleanup(f);
    if (de().getAttribute("data-cab") === "done") de().removeAttribute("data-cab");
  }
}

/* ------------------------------------------------------------------ close the post */

export function closePost(push: (href: string) => void) {
  const paper = document.querySelector<HTMLElement>(".post-paper");
  const href = "/blog";
  if (!paper) return push(href);
  const f = flight ?? { id: ++seq, rig: null, back: null, arrive: null, paper, tl: null, closing: true, watchdog: 0 };
  if (f.tl && f.rig) return; // the opening flight is still running
  f.closing = true;
  flight = f;
  de().setAttribute("data-cab", "out");
  armReturn();

  const chrome = [...paper.querySelectorAll<HTMLElement>("[data-rise]")];
  const pr = paper.getBoundingClientRect();
  const drop = scrollY + innerHeight + 60 - (pr.top + scrollY);
  const tl = gsap.timeline();
  f.tl = tl;
  tl.to(chrome, { opacity: 0, y: 16, duration: 0.2, ease: "expo.out", stagger: 0.03 }, 0)
    .to(paper, { y: drop, duration: 0.55, ease: drop > 2400 ? "power4.in" : "power2.in", willChange: "transform" }, 0.1)
    .add(() => {
      push(href);
      f.watchdog = window.setTimeout(() => window.location.replace(href), 3000);
    });
}

/* ------------------------------------------------------------ folder returns to the drawer */

export function returnFolder(o: { root: HTMLElement; link: HTMLAnchorElement; post?: CabinetPost; onDone: () => void }) {
  const f = flight;
  if (f) {
    clearTimeout(f.watchdog);
    f.back?.remove();
  }
  const idx = o.root.closest<HTMLElement>("#writing-index");
  const finish = () => {
    o.link.style.visibility = "";
    o.root.inert = false;
    const g = flight;
    if (g) cleanup(g);
    flight = null;
    de().removeAttribute("data-cab");
    if (idx) gsap.set(idx, { clearProps: "opacity" });
    o.onDone();
  };
  const title = o.link.querySelector(".cab-tab")?.textContent ?? "";
  const date = o.link.querySelector("time")?.textContent ?? "";
  o.root.inert = true;
  o.link.style.visibility = "hidden";
  const rig = buildRig(o.link, o.post, title, date);
  const nf: Flight = { id: ++seq, rig, back: null, arrive: null, paper: null, tl: null, closing: true, watchdog: 0 };
  flight = nf;
  nf.watchdog = window.setTimeout(finish, 4500);
  const r = foldRect(o.link);
  const st = stagePos(rig);
  const shift = rig.Ws * 0.46;

  // Folder waiting open at the middle of the screen, sheet half out, tab text gone, clip released.
  gsap.set(rig.rig, { x: st.x + shift, y: st.y + innerHeight * 0.28, scale: st.sc, opacity: 0, transformOrigin: "0 0", willChange: "transform" });
  gsap.set(rig.clip, { clipPath: "inset(-80px -3px -6px -3px)" });
  gsap.set(rig.backLab, { opacity: 0 });
  gsap.set(rig.cover, { rotateY: -158, z: 3 });
  gsap.set(rig.sheet, { x: rig.sx0, y: rig.sy0 - rig.H * 0.15, scale: rig.ss0, z: 1, transformOrigin: "0 0" });
  gsap.set(rig.pv.querySelector(".pv-tex"), { opacity: 0.7 });

  const tl = gsap.timeline({ onComplete: finish });
  nf.tl = tl;
  tl.to(rig.rig, { y: st.y, opacity: 1, duration: 0.5, ease: "expo.out" }, 0)
    .to(idx ?? [], { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.5)
    .to(rig.sheet, { y: rig.sy0, duration: 0.35, ease: "power2.inOut" }, 0.25)
    .to(rig.cover, { rotateY: 0, duration: 0.45, ease: "power2.inOut" }, 0.4)
    .to(rig.rig, { x: st.x, duration: 0.45, ease: "power2.inOut" }, 0.4)
    .to(rig.backLab, { opacity: 1, duration: 0.2 }, 0.75)
    .to(rig.rig, { x: r.left, y: r.top, scale: 1, duration: 0.62, ease: "expo.out" }, 0.85)
    .to(rig.clip, { clipPath: `inset(-80px -3px ${rig.H - rig.lip}px -3px)`, duration: 0.5, ease: "power2.inOut" }, 0.85)
    .to([rig.cover, rig.sheet], { opacity: 0, duration: 0.1 }, 1.0);
}
