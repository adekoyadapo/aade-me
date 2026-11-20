"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { PaletteItem } from "./palette";

// Loaded on first open (or on trigger hover/focus), never part of first-load JS.
const loadPalette = () => import("./palette");
const Palette = lazy(loadPalette);

export const OPEN_PALETTE = "open-palette";

export default function PaletteHost({ items }: { items: PaletteItem[] }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  const openIt = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);

  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    const el = opener.current;
    // Restore focus after the dialog unmounts.
    setTimeout(() => el?.isConnected && el.focus(), 0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) close();
        else openIt();
      }
    };
    const onPreload = () => void loadPalette();
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE, openIt);
    window.addEventListener("preload-palette", onPreload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE, openIt);
      window.removeEventListener("preload-palette", onPreload);
    };
  }, [openIt, close]);

  return open ? (
    <Suspense fallback={null}>
      <Palette items={items} onClose={close} />
    </Suspense>
  ) : null;
}
