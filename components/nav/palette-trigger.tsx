"use client";

import { useSyncExternalStore } from "react";
import { Search } from "../icons";

const open = () => window.dispatchEvent(new Event("open-palette"));
const preload = () => window.dispatchEvent(new Event("preload-palette"));

export default function PaletteTrigger({
  className,
  showLabel = false,
  bare = false,
}: {
  className?: string;
  showLabel?: boolean;
  bare?: boolean;
}) {
  const mac = useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false
  );

  return (
    <button
      type="button"
      aria-label="Open command palette"
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+K Meta+K"
      onClick={open}
      onPointerEnter={preload}
      onFocus={preload}
      className={className}
    >
      {!bare && <Search className="h-4 w-4" />}
      {showLabel && <span>Search</span>}
      <span className={bare ? "text-base" : "micro min-w-[2.25rem] text-center"}>
        {mac ? "⌘K" : "Ctrl K"}
      </span>
    </button>
  );
}
