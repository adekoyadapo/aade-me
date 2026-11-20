/** Press feedback: ripple on data-ripple buttons plus a click burst of twelve accent particles and a ring at the pointer. Loaded on first press (see components/ripple.tsx). */
const MAX = 4;
const N = 12;
let live = 0;
let layer: HTMLElement | undefined;

export default function press(e: PointerEvent) {
  const { clientX: x, clientY: y } = e;
  // Ripple on primary buttons (data-ripple).
  const el = (e.target as Element).closest<HTMLElement>("[data-ripple]");
  if (el) {
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const dot = document.createElement("span");
    dot.className = "ripple-dot";
    dot.style.cssText = `width:${size}px;height:${size}px;left:${x - r.left - size / 2}px;top:${y - r.top - size / 2}px`;
    dot.addEventListener("animationend", () => dot.remove());
    el.appendChild(dot);
  }
  if (live >= MAX) return;
  if (!layer?.isConnected) {
    layer = document.createElement("div");
    layer.className = "fx-burst";
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);
  }
  live++;
  const done: Promise<unknown>[] = [];
  const parts: HTMLElement[] = [];
  for (let i = 0; i <= N; i++) {
    const p = document.createElement("i");
    p.style.cssText = `left:${x}px;top:${y}px`;
    const ring = i === N;
    p.className = ring ? "r" : i % 2 ? "d" : "";
    layer.append(p);
    parts.push(p);
    const a = (i / N) * 6.283 + Math.random() * 0.4;
    const d = 36 + Math.random() * 42;
    const t = ring ? 460 : 440 + Math.random() * 200;
    // Movement eases out; opacity holds then fades on its own linear track so particles stay visible.
    const move = ring
      ? [{ transform: "scale(.2)" }, { transform: "scale(1.15)" }]
      : [
          { transform: `rotate(${a}rad) translateX(6px)` },
          { transform: `rotate(${a}rad) translateX(${d}px) scale(.3)` },
        ];
    done.push(
      p.animate(move, { duration: t, easing: "cubic-bezier(.15,.7,.25,1)", fill: "forwards" }).finished,
      p.animate([{ opacity: ring ? 0.8 : 1 }, { opacity: ring ? 0.8 : 1, offset: 0.45 }, { opacity: 0 }], { duration: t, fill: "forwards" }).finished,
    );
  }
  Promise.allSettled(done).then(() => {
    parts.forEach((p) => p.remove());
    // The layer stays in the DOM (empty, contain: strict). It carries a view-transition-name, and removing a named element in the middle
    // of a page tear makes Chrome end the whole transition early (a real click on a link finished the 1500ms tear after ~600ms).
    live--;
  });
}
