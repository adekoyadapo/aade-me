"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import type { CabinetDrawer } from "@/lib/taxonomy";
import { pickView, VIEW_KEY, type WritingView } from "@/lib/cabinet-ctx";
import Cabinet from "./cabinet";

const subscribe = (cb: () => void) => {
  addEventListener("wv-change", cb);
  return () => removeEventListener("wv-change", cb);
};
const snapshot = (): WritingView => (document.documentElement.getAttribute("data-wv") === "cabinet" ? "cabinet" : "list");

/**
 * Cabinet | List switch. The choice lives on <html data-wv> (set before first paint by the inline script in app/blog/page.tsx, or here
 * on client navigations) so both panes can be shown or hidden by CSS alone. Without JS the attribute never exists: the list shows.
 * Both panes stay in the DOM, so every post is a link in either view.
 */
export default function WritingViewShell({ drawers, list }: { drawers: CabinetDrawer[]; list: React.ReactNode }) {
  const view = useSyncExternalStore(subscribe, snapshot, () => "list" as WritingView);

  useLayoutEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute("data-wv", pickView());
      dispatchEvent(new Event("wv-change"));
    };
    if (!document.documentElement.hasAttribute("data-wv")) apply();
    // Follow the OS motion and width settings until the reader makes an explicit choice.
    const mqs = [matchMedia("(prefers-reduced-motion: reduce)"), matchMedia("(min-width: 640px)")];
    const onMq = () => {
      try {
        if (localStorage.getItem(VIEW_KEY)) return;
      } catch {
        /* ignore */
      }
      apply();
    };
    mqs.forEach((m) => m.addEventListener("change", onMq));
    return () => mqs.forEach((m) => m.removeEventListener("change", onMq));
  }, []);

  const set = (v: WritingView) => {
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode: the choice just lasts for this page */
    }
    document.documentElement.setAttribute("data-wv", v);
    dispatchEvent(new Event("wv-change"));
  };

  return (
    <>
      <div className="cab-bar">
        <span className="micro" id="wv-label">
          View
        </span>
        <div role="group" aria-labelledby="wv-label" className="cab-seg">
          <button type="button" aria-pressed={view === "cabinet"} onClick={() => set("cabinet")}>
            Cabinet
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => set("list")}>
            List
          </button>
        </div>
      </div>
      <div data-pane="cabinet">
        <Cabinet drawers={drawers} active={view === "cabinet"} />
      </div>
      <div data-pane="list">{list}</div>
    </>
  );
}
