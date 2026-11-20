"use client";

import { useEffect } from "react";

const INTERACTIVE = "a[href],button:not(:disabled),[role=button],[role=tab],[role=option],summary,label";

/** Delegated press listener. Ripple and burst logic lives in lib/click-burst, loaded on first hover or press. */
export default function Ripple() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const load = () => import("@/lib/click-burst");
    const onDown = (e: PointerEvent) => {
      if (e.button === 0 && (e.target as Element).closest?.(INTERACTIVE)) load().then((m) => m.default(e));
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerover", load, { once: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerover", load);
    };
  }, []);
  return null;
}
