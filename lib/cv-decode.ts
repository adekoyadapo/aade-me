/**
 * CV decode engine (Stage 10). One fixed canvas on top of the page, three jobs:
 *  1. Sealed: an A4 block of slowly drifting hex bytes and bits, a few twinkling brighter (idle loop).
 *  2. Converge: the bytes streak out of the block onto the real layout of the CV, measured per character from the live DOM.
 *  3. Decode: each measured character shows as flickering hex, then resolves into its real glyph, headings first, then rows
 *     top to bottom. After about 2.5 s the canvas is cleared in the same frame the real text is shown (so the final state is the
 *     real, selectable, printable DOM).
 * The real DOM is never altered: while decoding its text is made transparent by CSS (data-cv="decoding", screen only).
 * GSAP is imported on demand when the first decode starts; this module itself is loaded after first paint.
 */

type Rgb = string;
type Gsap = typeof import("gsap").gsap;

interface Tok {
  s: string;
  p: number; // position on the row tape, px
  w: number; // width, px
  a: number; // base alpha
  tw: number; // twinkle rate, 0 = none
  seed: number;
}
interface Row {
  y: number;
  len: number;
  speed: number;
  toks: Tok[];
}
interface Glyph {
  ch: string;
  x: number;
  y: number; // baseline, viewport px at decode start
  w: number;
  hexAt: number; // s: hex placeholder starts
  doneAt: number; // s: real glyph appears
  g: number; // style group index
}
interface Group {
  font: string;
  hexFont: string;
  color: Rgb;
  glyphs: Glyph[];
}
interface Particle {
  s: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  dur: number;
  a: number;
  keep: boolean; // false: fades with the block, never travels
}

const HEX = "0123456789ABCDEF";
const DECODE_END = 2.55; // s, click to final swap
const mulberry = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const inOutQuart = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

export interface CvEngine {
  startIdle(): void;
  stopIdle(): void;
  preload(): Promise<unknown>;
  decode(from: "seal" | "scatter"): Promise<void>;
  destroy(): void;
}

export interface CvEngineOpts {
  root: HTMLElement; // .cv-root (carries data-cv)
  container: HTMLElement; // .cv-container: the real CV
  seal: HTMLElement; // .cv-seal section
  page: HTMLElement; // .cv-seal-page: the A4 block
  canvas: HTMLCanvasElement;
}

export function createCvEngine(o: CvEngineOpts): CvEngine {
  const { root, container, seal, page, canvas } = o;
  const ctx = canvas.getContext("2d");
  const small = matchMedia("(max-width: 640px)").matches;
  let dpr = 1;
  let vw = 0;
  let vh = 0;
  let fg: Rgb = "#fff";
  let monoFamily = "monospace";
  let monoPx = small ? 9 : 10;
  let cw = 6;
  let rows: Row[] = [];
  let rowsW = 0;
  let rowsH = 0;
  let raf = 0;
  let idle = false;
  let busy = false;
  let destroyed = false;
  let gsapP: Promise<Gsap> | undefined;
  let finishNow: (() => void) | undefined;
  const t0 = performance.now();

  const size = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const readTheme = () => {
    const cs = getComputedStyle(document.documentElement);
    fg = cs.getPropertyValue("--fg").trim() || "#fff";
    const mono = getComputedStyle(seal.querySelector(".cv-seal-cap") ?? seal).fontFamily;
    if (mono) monoFamily = mono;
  };

  /* ---------- sealed field ---------- */
  const buildRows = () => {
    if (!ctx) return;
    const r = page.getBoundingClientRect();
    rowsW = r.width;
    rowsH = r.height;
    monoPx = small ? 9 : 10;
    ctx.font = `${monoPx}px ${monoFamily}`;
    cw = ctx.measureText("0").width || 6;
    const rnd = mulberry(20260);
    const pitch = small ? 19 : 15;
    const pad = small ? 14 : 18;
    const n = Math.max(6, Math.floor((rowsH - pad * 2) / pitch));
    rows = [];
    for (let i = 0; i < n; i++) {
      const toks: Tok[] = [];
      let p = 0;
      while (p < rowsW + 60) {
        const k = rnd();
        let s: string;
        if (k < 0.42) s = HEX[(rnd() * 16) | 0] + HEX[(rnd() * 16) | 0];
        else if (k < 0.58) s = "0x" + HEX[(rnd() * 16) | 0] + HEX[(rnd() * 16) | 0];
        else if (k < 0.9) {
          s = "";
          const bits = rnd() < 0.7 ? 4 : 8;
          for (let b = 0; b < bits; b++) s += rnd() < 0.5 ? "0" : "1";
        } else s = HEX[(rnd() * 16) | 0] + (rnd() * 10 | 0);
        const w = s.length * cw;
        toks.push({ s, p, w, a: 0.14 + rnd() * 0.2, tw: rnd() < 0.035 ? 0.35 + rnd() * 0.5 : 0, seed: rnd() * 6.283 });
        p += w + cw * (1 + (rnd() < 0.3 ? 1 : 0));
      }
      rows.push({ y: pad + i * pitch + monoPx, len: p, speed: (6 + rnd() * 12) * (i % 2 ? -1 : 1), toks });
    }
  };

  /** Viewport position of a token at time t (s), or null when it is outside the block. */
  const tokenAt = (row: Row, tok: Tok, t: number, bx: number, by: number, pad: number) => {
    const off = (((tok.p + row.speed * t) % row.len) + row.len) % row.len;
    const x = bx + pad + off;
    if (x + tok.w > bx + rowsW - pad || x < bx + pad) return null;
    return { x, y: by + row.y };
  };

  const edge = (x: number, y: number, bx: number, by: number) => {
    const m = 30;
    return smooth(0, m, Math.min(x - bx, bx + rowsW - x, y - by, by + rowsH - y));
  };

  const drawSeal = () => {
    if (!ctx) return;
    const r = page.getBoundingClientRect();
    ctx.clearRect(0, 0, vw, vh);
    if (r.bottom < 0 || r.top > vh || r.width < 8) return;
    if (Math.abs(r.width - rowsW) > 1 || Math.abs(r.height - rowsH) > 1) buildRows();
    const t = (performance.now() - t0) / 1000;
    const pad = small ? 14 : 18;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.left, r.top, r.width, r.height);
    ctx.clip();
    ctx.font = `${monoPx}px ${monoFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = fg;
    for (const row of rows) {
      for (const tok of row.toks) {
        const pos = tokenAt(row, tok, t, r.left, r.top, pad);
        if (!pos) continue;
        let a = tok.a;
        if (tok.tw) a += 0.7 * Math.pow(Math.max(0, Math.sin(t * tok.tw * 3 + tok.seed)), 14);
        a *= edge(pos.x, pos.y, r.left, r.top);
        if (a < 0.02) continue;
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillText(tok.s, pos.x, pos.y);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  const loop = () => {
    raf = 0;
    if (!idle || destroyed) return;
    if (!document.hidden) drawSeal();
    raf = requestAnimationFrame(loop);
  };

  const onResize = () => {
    if (destroyed) return;
    size();
    if (busy) finishNow?.();
    else if (idle) buildRows();
  };

  /* ---------- measuring the real layout ---------- */
  const measure = (): Group[] => {
    const groups = new Map<string, Group>();
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const rnd = mulberry(77);
    const cRect = container.getBoundingClientRect();
    const left0 = cRect.left;
    const width0 = Math.max(1, cRect.width);
    let count = 0;
    let n: Node | null;
    while ((n = walker.nextNode()) && count < 2800) {
      const text = n.nodeValue ?? "";
      const el = n.parentElement;
      if (!el || !text.trim() || el.closest("script,style,[aria-hidden='true']")) continue;
      const er = el.getBoundingClientRect();
      if (er.bottom < -60 || er.top > vh + 60 || er.width === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const px = parseFloat(cs.fontSize) || 14;
      const key = font + "|" + cs.color;
      let grp = groups.get(key);
      if (!grp) {
        grp = { font, hexFont: `${cs.fontWeight} ${(px * 0.72).toFixed(1)}px ${monoFamily}`, color: cs.color, glyphs: [] };
        groups.set(key, grp);
      }
      const upper = cs.textTransform === "uppercase";
      const heading = !!el.closest("h1,h2,h3");
      ctx!.font = font;
      const asc = ctx!.measureText("Hg").fontBoundingBoxAscent || px * 0.9;
      for (let i = 0; i < text.length; i++) {
        if (/\s/.test(text[i])) continue;
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        const r = range.getBoundingClientRect();
        if (r.width === 0 || r.bottom < -20 || r.top > vh + 20) continue;
        const yn = clamp01((r.top + r.height / 2) / (vh * 0.96));
        const xn = clamp01((r.left - left0) / width0);
        const jit = rnd();
        // Timeline (s): bytes arrive 0.5 to 1.0, hex placeholder fades in 0.6 to 0.95, headings resolve first, then rows top to bottom.
        const hexAt = 0.6 + 0.3 * rnd();
        const doneAt = heading
          ? 1.05 + 0.22 * yn + 0.16 * xn + 0.06 * jit
          : 1.3 + 0.88 * Math.pow(yn, 0.92) + 0.2 * xn + 0.07 * jit;
        grp.glyphs.push({ ch: upper ? text[i].toUpperCase() : text[i], x: r.left, y: r.top + asc, w: r.width, hexAt, doneAt, g: 0 });
        count++;
      }
    }
    return [...groups.values()];
  };

  const makeParticles = (from: "seal" | "scatter", targets: Glyph[]): Particle[] => {
    const rnd = mulberry(4242);
    const out: Particle[] = [];
    if (!targets.length) return out;
    const pick = () => targets[(rnd() * targets.length) | 0];
    const want = small ? 200 : 440;
    if (from === "seal") {
      const r = page.getBoundingClientRect();
      const pad = small ? 14 : 18;
      const t = (performance.now() - t0) / 1000;
      const all: { s: string; x: number; y: number; a: number }[] = [];
      for (const row of rows)
        for (const tok of row.toks) {
          const pos = tokenAt(row, tok, t, r.left, r.top, pad);
          if (pos) all.push({ s: tok.s, x: pos.x, y: pos.y, a: tok.a * edge(pos.x, pos.y, r.left, r.top) });
        }
      const keepP = Math.min(1, want / Math.max(1, all.length));
      for (const k of all) {
        const keep = rnd() < keepP;
        const tg = pick();
        out.push({ s: k.s, x0: k.x, y0: k.y, x1: tg.x, y1: tg.y, t0: rnd() * 0.24, dur: 0.5 + rnd() * 0.24, a: k.a, keep });
      }
    } else {
      for (let i = 0; i < want; i++) {
        const tg = pick();
        const s = rnd() < 0.55 ? HEX[(rnd() * 16) | 0] + HEX[(rnd() * 16) | 0] : "0" + (rnd() < 0.5 ? "1" : "0") + (rnd() < 0.5 ? "1" : "0") + (rnd() < 0.5 ? "1" : "0");
        out.push({ s, x0: rnd() * vw, y0: rnd() * vh, x1: tg.x, y1: tg.y, t0: rnd() * 0.24, dur: 0.5 + rnd() * 0.24, a: 0.2 + rnd() * 0.2, keep: true });
      }
    }
    return out;
  };

  /* ---------- decode ---------- */
  const decode = async (from: "seal" | "scatter") => {
    if (busy || destroyed || !ctx) return;
    busy = true;
    idle = false;
    cancelAnimationFrame(raf);
    const gsap = await loadGsap();
    if (destroyed) return;

    // Same task: expand the real CV (still normal colours), measure it, then switch to the transparent-text decode state.
    const scroll0 = window.scrollY;
    if (from === "scatter" && scroll0 > 0) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    if (from === "scatter") seal.style.display = "none"; // replay: no sealed sheet
    root.dataset.cv = "measure";
    readTheme();
    size();
    const startScroll = window.scrollY;
    const groups = measure();
    root.dataset.cv = "decoding";
    const targets = groups.flatMap((g) => g.glyphs);
    const parts = makeParticles(from, targets);
    ctx.textBaseline = "alphabetic";

    return new Promise<void>((resolve) => {
      const S = { t: 0 };
      let ended = false;
      const tl = gsap.timeline();
      const sealParts = [page, seal.querySelector<HTMLElement>(".cv-seal-ui")].filter(Boolean) as HTMLElement[];

      const draw = () => {
        const T = S.t;
        const dy = startScroll - window.scrollY;
        ctx.clearRect(0, 0, vw, vh);
        // Streaking bytes
        ctx.font = `${monoPx}px ${monoFamily}`;
        ctx.fillStyle = fg;
        for (const p of parts) {
          const u = clamp01((T - p.t0) / p.dur);
          const e = inOutQuart(u);
          let x: number;
          let y: number;
          let a: number;
          if (!p.keep) {
            x = p.x0;
            y = p.y0;
            a = p.a * (1 - smooth(0, 0.4, T));
          } else {
            x = p.x0 + (p.x1 - p.x0) * e;
            y = p.y0 + (p.y1 - p.y0) * e + (u > 0 ? dy * u : 0);
            const fadeIn = from === "scatter" ? smooth(p.t0, p.t0 + 0.2, T) : 1;
            a = (p.a + 0.45 * Math.sin(Math.PI * Math.min(1, u))) * fadeIn * (1 - smooth(p.t0 + p.dur - 0.05, p.t0 + p.dur + 0.25, T));
            // streak: three fading ghosts along the path while it is moving fast (reads as speed, no crossing lines)
            const v = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
            if (v > 0.2 && a > 0.04) {
              for (let k = 1; k <= 3; k++) {
                const uk = Math.max(0, u - k * 0.04);
                const ek = inOutQuart(uk);
                ctx.globalAlpha = a * v * (0.38 / k);
                ctx.fillText(p.s, p.x0 + (p.x1 - p.x0) * ek, p.y0 + (p.y1 - p.y0) * ek + dy * uk);
              }
            }
          }
          if (a < 0.02) continue;
          ctx.globalAlpha = Math.min(1, a);
          ctx.fillText(p.s, x, y);
        }
        // Characters: hex placeholder, then the real glyph
        const flick = Math.floor(T * 15);
        for (const g of groups) {
          for (let pass = 0; pass < 2; pass++) {
            ctx.font = pass ? g.font : g.hexFont;
            ctx.fillStyle = g.color;
            ctx.textAlign = pass ? "left" : "center";
            for (let i = 0; i < g.glyphs.length; i++) {
              const c = g.glyphs[i];
              if (T < c.hexAt) continue;
              const done = T >= c.doneAt;
              if (pass === (done ? 1 : 0)) {
                const y = c.y + dy;
                if (y < -30 || y > vh + 30) continue;
                if (done) {
                  ctx.globalAlpha = 1;
                  ctx.fillText(c.ch, c.x, y);
                } else {
                  ctx.globalAlpha = 0.55 * smooth(c.hexAt, c.hexAt + 0.2, T) + 0.25 * smooth(c.doneAt - 0.25, c.doneAt, T);
                  ctx.fillText(HEX[(i * 5 + flick * 7 + (i >> 3)) & 15], c.x + c.w / 2, y);
                }
              }
            }
          }
        }
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      };

      const finish = () => {
        if (ended) return;
        ended = true;
        finishNow = undefined;
        window.removeEventListener("keydown", onKey);
        tl.kill();
        // Same frame: real text on, canvas off.
        root.dataset.cv = "done";
        ctx.clearRect(0, 0, vw, vh);
        gsap.set([container, ...sealParts], { clearProps: "opacity" });
        seal.style.removeProperty("display");
        busy = false;
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") finish();
      };
      finishNow = finish;
      window.addEventListener("keydown", onKey);

      // Chrome of the real CV fades in under the bytes while the seal's block and controls fade away.
      tl.fromTo(container, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" }, 0.3);
      if (from === "seal") tl.to(sealParts, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, 0.2);
      tl.to(S, { t: DECODE_END, duration: DECODE_END, ease: "none", onUpdate: draw }, 0);
      tl.call(finish, [], DECODE_END);
      draw();
    });
  };

  const loadGsap = () => (gsapP ??= import("gsap").then((m) => m.gsap));

  size();
  readTheme();
  window.addEventListener("resize", onResize);
  const themeObs = new MutationObserver(readTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  return {
    startIdle() {
      if (destroyed || idle || busy) return;
      buildRows();
      idle = true;
      raf = requestAnimationFrame(loop);
    },
    stopIdle() {
      idle = false;
      cancelAnimationFrame(raf);
      ctx?.clearRect(0, 0, vw, vh);
    },
    preload: loadGsap,
    decode,
    destroy() {
      destroyed = true;
      idle = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      themeObs.disconnect();
      finishNow?.();
    },
  };
}
