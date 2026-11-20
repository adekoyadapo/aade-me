import { sceneFor, trace, type Pose, type Scene } from "@/lib/wireframe";

/**
 * Lazy canvas renderer for the home wireframe panels. Canvas 2D, manual perspective, one rAF loop.
 * Loaded by components/wireframe-bg.tsx after first paint. Returns a dispose function.
 */
export function start(canvas: HTMLCanvasElement, host: HTMLElement, onFrame?: () => void): (() => void) | null {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return null;

  let scene: Scene = sceneFor(1, 1);
  let w = 1, h = 1, scale = 1, dpr = 1;
  let line = "#3d3d3d", mute = "#8a8a8a";
  let raf = 0, last = 0, t = 0, visible = true, tabVisible = !document.hidden, first = true;
  let tx = 0, ty = 0; // pointer target, -1..1
  const pose: Pose = { t: 0, px: 0, py: 0 };

  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    line = cs.getPropertyValue("--line").trim() || line;
    mute = cs.getPropertyValue("--mute").trim() || mute;
  };

  const resize = () => {
    const r = host.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scene = sceneFor(w, h);
    scale = Math.max(w / scene.W, h / scene.H); // cover, same as the SVG's xMidYMid slice
    draw();
  };

  const draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const k = dpr * scale;
    ctx.setTransform(k, 0, 0, k, ((w - scene.W * scale) / 2) * dpr, ((h - scene.H * scale) / 2) * dpr);
    ctx.lineWidth = 1 / scale; // 1 CSS px
    ctx.lineJoin = "round";
    for (const frame of [false, true]) {
      ctx.strokeStyle = frame ? mute : line;
      ctx.globalAlpha = frame ? 0.55 : 1;
      ctx.beginPath();
      for (const p of scene.panels) {
        trace(scene, p, pose, (x, y) => ctx.moveTo(x, y), (x, y) => ctx.lineTo(x, y), frame);
      }
      ctx.stroke();
    }
  };

  const tick = (now: number) => {
    raf = 0;
    if (!visible || !tabVisible) return;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
    last = now;
    t += dt;
    const e = 1 - Math.exp(-dt * 3.5); // eased, frame-rate independent
    pose.px += (tx - pose.px) * e;
    pose.py += (ty - pose.py) * e;
    pose.t = t;
    draw();
    if (first) {
      first = false;
      onFrame?.();
    }
    raf = requestAnimationFrame(tick);
  };
  const run = () => {
    if (!raf && visible && tabVisible) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const onVisibility = () => {
    tabVisible = !document.hidden;
    tabVisible ? run() : stop();
  };

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? run() : stop();
  });
  // Theme changes (toggle or system) set data-theme on <html>; re-read the tokens and repaint.
  const mo = new MutationObserver(() => {
    readColors();
    if (!raf) draw();
  });

  readColors();
  resize();
  ro.observe(host);
  io.observe(host);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  run();

  return () => {
    stop();
    clearTimeout(resizeTimer);
    ro.disconnect();
    io.disconnect();
    mo.disconnect();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
