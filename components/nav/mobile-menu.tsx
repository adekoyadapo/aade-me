"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { Close, Menu } from "../icons";
import { startLenis, stopLenis } from "../smooth-scroll";
import NavLinks from "./nav-links";
import PaletteTrigger from "./palette-trigger";
import ThemeToggle from "../theme-toggle";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const pathname = usePathname();

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    stopLenis();
    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []
      );
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        btn.current?.focus();
      } else if (e.key === "Tab") {
        const f = [btn.current!, ...focusables()];
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      startLenis();
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
        className="relative z-[var(--z-header-raised)] flex h-9 w-9 items-center justify-center rounded-lg text-fg md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        className={clsx(
          "fixed inset-0 z-[var(--z-menu-backdrop)] bg-black/50 transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <nav
        ref={panel}
        id="mobile-nav"
        aria-label="Primary"
        inert={!isOpen}
        data-lenis-prevent
        data-scroll-lock={isOpen ? "" : undefined}
        className={clsx(
          "fixed right-0 top-0 z-[var(--z-header)] h-full w-[280px] border-l border-line bg-surface transition-transform duration-300 md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <NavLinks
          className="space-y-1 overflow-y-auto px-4 pt-20"
          linkClassName="block rounded-xl px-4 py-3.5 text-base font-medium transition-colors"
          onNavigate={() => setIsOpen(false)}
        />
        <div className="mt-6 flex flex-col items-start gap-4 px-4">
          <PaletteTrigger
            className="flex w-full items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-mute"
            showLabel
          />
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
