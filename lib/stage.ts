/** Image `sizes` for the home stage: the featured card is wide, every other card is a small tile. Shared by the server markup and the stepper. */
export const SIZES_FEATURED = "(min-width: 1024px) 36vw, 86vw";
export const SIZES_TILE = "(min-width: 1024px) 13vw, 28vw";

/**
 * Slot layout for the WebGL stage. Mirrors the CSS slots in app/globals.css ("Slots" and the 1024px media query) so the DOM cards
 * and the canvas always agree: slot 0 featured wide artwork, slot 1 next-project tile, 2-5 corner tiles clockwise from top right,
 * 6-9 parked off screen. Centre positions are in px from the stage's top-left; rotations in CSS degrees (clockwise positive).
 */
export type Slot = { x: number; y: number; w: number; h: number; r: number; ry: number; feat: boolean; z: number; k: number; a: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function slotLayout(W: number, H: number): Slot[] {
  const wide = W >= 1024;
  const fw = wide ? Math.min(W * 0.35, H <= 700 ? Math.min(W * 0.35, H * 0.8) : 736) : W * 0.66;
  const far = wide ? 1.72 : 1.62;
  const tile1 = wide ? clamp(W * 0.125, 120, 230) : W * 0.27;
  const tile = wide ? clamp(W * 0.118, 110, 215) : W * 0.22;
  // [x%, y%, r, ry]
  const t = wide
    ? [[66.5, 54, 1], [91.5, 17, 33], [94, 89, -33], [3.5, 83, 25], [3.5, 44, -30], [-8, -10, -40], [-12, 40, -10], [-12, 70, 20]]
    : [[76, 72, 1], [96, 17, 30], [98, 88, -32], [2, 80, 26], [3, 18, -28], [-14, 4, -40], [-22, 40, -10], [-24, 62, 20]];
  const ry = wide ? 10 : 7;
  const out: Slot[] = [{ x: (wide ? 22.6 : 50) * W / 100, y: (wide ? 53.5 : 38) * H / 100, w: fw, h: fw / far, r: 0, ry, feat: true, z: 6, k: 8, a: 1 }];
  t.forEach(([x, y, r], i) => {
    const w = i === 0 ? tile1 : tile;
    out.push({ x: x * W / 100, y: y * H / 100, w, h: w, r, ry: 0, feat: false, z: i === 0 ? 5 : 3, k: i === 0 ? 16 : 12, a: i < 4 ? 1 : 0 });
  });
  out.push({ x: (wide ? -16 : -30) * W / 100, y: (wide ? 53.5 : 38) * H / 100, w: fw, h: fw / far, r: wide ? -3 : -4, ry, feat: true, z: 3, k: 8, a: 0 });
  return out;
}

/** cubic-bezier(.87, 0, .13, 1) as a plain easing function (used by the stage tweens). */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const x = ((ax * s + bx) * s + cx) * s - t;
      const d = (3 * ax * s + 2 * bx) * s + cx;
      if (Math.abs(x) < 1e-5 || Math.abs(d) < 1e-6) break;
      s -= x / d;
    }
    s = Math.min(1, Math.max(0, s));
    return ((ay * s + by) * s + cy) * s;
  };
}
export const expoInOut = bezier(0.87, 0, 0.13, 1);
