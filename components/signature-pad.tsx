"use client";

import { useEffect, useRef } from "react";

/** Optional drawn signature. Reports the stroke count; typing a name in the form is the accessible alternative. */
export default function SignaturePad({
  onStrokes,
  resetKey,
  describedBy,
}: {
  onStrokes: (count: number) => void;
  resetKey: number;
  describedBy?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);
  const cb = useRef(onStrokes);
  useEffect(() => {
    cb.current = onStrokes;
  });

  const clear = () => {
    const c = ref.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    strokes.current = 0;
    last.current = null;
    cb.current(0);
  };

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
  }, []);

  useEffect(() => {
    if (resetKey) clear();
  }, [resetKey]);

  const pt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  };
  const line = (e: React.PointerEvent<HTMLCanvasElement>, from: { x: number; y: number }, to: { x: number; y: number }) => {
    const c = e.currentTarget;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = getComputedStyle(c).color;
    ctx.lineWidth = 2.4 * (c.width / c.getBoundingClientRect().width);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  return (
    <div className="relative">
      <canvas
        ref={ref}
        role="img"
        aria-label="Signature pad. Optional: draw here, or type your name in the field below instead."
        aria-describedby={describedBy}
        className="block h-28 w-full cursor-crosshair touch-none border-0 border-b border-[var(--line)] bg-transparent text-fg"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = pt(e);
          last.current = p;
          line(e, p, { x: p.x + 0.1, y: p.y });
        }}
        onPointerMove={(e) => {
          if (!last.current) return;
          const p = pt(e);
          line(e, last.current, p);
          last.current = p;
        }}
        onPointerUp={() => {
          if (!last.current) return;
          last.current = null;
          strokes.current += 1;
          cb.current(strokes.current);
        }}
        onPointerCancel={() => {
          last.current = null;
        }}
      />
      <span aria-hidden="true" className="paper-label pointer-events-none absolute bottom-2 left-0">
        Sign here with finger, mouse or pen
      </span>
      <button
        type="button"
        onClick={clear}
        className="paper-label absolute right-0 top-1 rounded px-1 underline underline-offset-4 hover:text-fg"
      >
        Clear signature
      </button>
    </div>
  );
}
