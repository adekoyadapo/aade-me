"use client";

import { useEffect } from "react";

/** Development only (rendered from app/layout.tsx behind NODE_ENV): logs every view transition so the page tear can be confirmed in the console. */
export default function VtDebug() {
  useEffect(() => {
    if (typeof document.startViewTransition !== "function") {
      console.debug("[vt] this browser has no document.startViewTransition: routes change without the page tear");
      return;
    }
    const orig = document.startViewTransition;
    let from = location.pathname;
    let hint: string | undefined;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.<HTMLAnchorElement>("a[href]");
      hint = a && a.origin === location.origin ? a.pathname : undefined;
    };
    document.addEventListener("click", onClick, true);
    document.startViewTransition = function (this: Document, ...args: Parameters<typeof orig>) {
      const to = hint ?? location.pathname;
      hint = undefined;
      const t0 = performance.now();
      const vt = orig.apply(this, args);
      console.debug(`[vt] start ${from} -> ${to}`);
      vt.updateCallbackDone.then(() => {
        from = location.pathname;
        console.debug(`[vt] committed ${from}`);
      }, () => {});
      vt.finished.then(
        () => {
          const ms = Math.round(performance.now() - t0);
          console.debug(`[vt] finished after ${ms}ms`);
          if (ms < 1000 && !matchMedia("(prefers-reduced-motion: reduce)").matches && ms > 100) console.warn(`[vt] ended early (${ms}ms): something removed a view-transition-name element or skipped it`);
        },
        (e) => console.debug("[vt] skipped", e?.name),
      );
      return vt;
    } as typeof orig;
    return () => {
      document.startViewTransition = orig;
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return null;
}
