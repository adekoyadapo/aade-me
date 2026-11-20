/**
 * Wireframe grid panels: scene description and a tiny perspective projector.
 * Pure maths, no DOM. Used by the static SVG fallback and by the lazy canvas renderer so both draw the same composition.
 * Coordinates: virtual scene W x H, y down, camera looks along +z, panels sit at positive z.
 */

export type Panel = {
  x: number; y: number; z: number; // centre, relative to the scene centre
  w: number; h: number; // size
  cols: number; rows: number; // grid cells
  yaw: number; pitch: number; roll: number; // radians
  bow: number; // how far the panel edges curve away from the viewer
  /** Drift: yaw and pitch sway (radians), vertical float (units), period (s), phase (rad). */
  drift: [ay: number, ap: number, dy: number, period: number, phase: number];
  /** Parallax strength, 1 = nearest. */
  par: number;
};

export type Scene = { W: number; H: number; f: number; panels: Panel[] };
export type Pose = { t: number; px: number; py: number };

const d = Math.PI / 180;

/** Wide viewports: a centred bowed panel, two tilted panels cropped by the top corners. */
export const LANDSCAPE: Scene = {
  W: 1600,
  H: 900,
  f: 1100,
  panels: [
    { x: 0, y: -70, z: 260, w: 820, h: 460, cols: 17, rows: 10, yaw: 0, pitch: -9 * d, roll: 0, bow: 90, drift: [2.2 * d, 1.4 * d, 9, 19, 0], par: 1 },
    { x: -660, y: -280, z: 180, w: 480, h: 340, cols: 11, rows: 8, yaw: 34 * d, pitch: -6 * d, roll: -9 * d, bow: 16, drift: [2.6 * d, 1.6 * d, 10, 23, 1.7], par: 1.5 },
    { x: 660, y: -280, z: 180, w: 480, h: 340, cols: 11, rows: 8, yaw: -34 * d, pitch: -6 * d, roll: 9 * d, bow: 16, drift: [2.6 * d, 1.6 * d, 10, 21, 3.9], par: 1.5 },
  ],
};

/** Tall viewports: same composition, re-framed. */
export const PORTRAIT: Scene = {
  W: 600,
  H: 900,
  f: 900,
  panels: [
    { x: 0, y: -250, z: 280, w: 460, h: 300, cols: 12, rows: 8, yaw: 0, pitch: -8 * d, roll: 0, bow: 60, drift: [2.2 * d, 1.4 * d, 8, 19, 0], par: 1 },
    { x: -270, y: -400, z: 150, w: 300, h: 240, cols: 7, rows: 6, yaw: 32 * d, pitch: -6 * d, roll: -9 * d, bow: 12, drift: [2.6 * d, 1.6 * d, 8, 23, 1.7], par: 1.5 },
    { x: 270, y: -400, z: 150, w: 300, h: 240, cols: 7, rows: 6, yaw: -32 * d, pitch: -6 * d, roll: 9 * d, bow: 12, drift: [2.6 * d, 1.6 * d, 8, 21, 3.9], par: 1.5 },
  ],
};

export const sceneFor = (width: number, height: number): Scene => (width >= height ? LANDSCAPE : PORTRAIT);

type Pen = (x: number, y: number) => void;
const SEG = 14;
const TAU = Math.PI * 2;

/** Trace one panel. `frame` selects the outer border (true) or the inner grid lines (false). */
export function trace(s: Scene, p: Panel, pose: Pose, move: Pen, line: Pen, frame: boolean): void {
  const [ay, ap, dy, T, ph] = p.drift;
  const a = (TAU * pose.t) / T + ph;
  const yaw = p.yaw + ay * Math.sin(a) + pose.px * 0.035 * p.par;
  const pitch = p.pitch + ap * Math.sin(a * 0.8 + 1) - pose.py * 0.025 * p.par;
  const oy = dy * Math.sin(a * 0.6 + 2) + pose.py * 14 * p.par;
  const ox = pose.px * 26 * p.par;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cr = Math.cos(p.roll), sr = Math.sin(p.roll);
  const hw = p.w / 2, hh = p.h / 2;
  const cx = s.W / 2, cyy = s.H / 2;

  const pt = (u: number, v: number, first: boolean) => {
    let X = u * hw, Y = v * hh, Z = p.bow * (0.8 * u * u + 0.3 * v * v);
    // roll (z), pitch (x), yaw (y)
    const X1 = X * cr - Y * sr; Y = X * sr + Y * cr; X = X1;
    const Y2 = Y * cp - Z * sp; Z = Y * sp + Z * cp; Y = Y2;
    const X3 = X * cy + Z * sy; Z = -X * sy + Z * cy; X = X3;
    const k = s.f / (s.f + p.z + Z);
    (first ? move : line)(cx + (p.x + ox + X) * k, cyy + (p.y + oy + Y) * k);
  };
  const run = (fixed: "u" | "v", c: number) => {
    for (let i = 0; i <= SEG; i++) {
      const t = -1 + (2 * i) / SEG;
      if (fixed === "u") pt(c, t, i === 0);
      else pt(t, c, i === 0);
    }
  };
  if (frame) {
    run("u", -1); run("u", 1); run("v", -1); run("v", 1);
  } else {
    for (let i = 1; i < p.cols; i++) run("u", -1 + (2 * i) / p.cols);
    for (let j = 1; j < p.rows; j++) run("v", -1 + (2 * j) / p.rows);
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** SVG path data for one panel at rest (t = 0, no pointer). */
export function svgPath(s: Scene, p: Panel, frame: boolean): string {
  let out = "";
  trace(s, p, { t: 0, px: 0, py: 0 }, (x, y) => (out += `M${r1(x)} ${r1(y)}`), (x, y) => (out += `L${r1(x)} ${r1(y)}`), frame);
  return out;
}
