"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "./icons";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-24 right-5 z-[var(--z-grain)] flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-fg transition-all duration-200 hover:scale-110 active:scale-95 ${
        visible ? "opacity-100" : "pointer-events-none scale-50 opacity-0"
      }`}
      aria-label="Scroll to top"
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
