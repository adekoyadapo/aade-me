"use client";

import { useSyncExternalStore } from "react";

export type Pref = "light" | "dark";

const OPTIONS: { value: Pref; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  },
];

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  // The head script re-applies the system scheme on change (registered first, so it runs before this) while no choice is stored.
  const m = matchMedia("(prefers-color-scheme: dark)");
  m.addEventListener("change", cb);
  return () => {
    listeners.delete(cb);
    m.removeEventListener("change", cb);
  };
}

/** The effective theme currently painted. */
function getTheme(): Pref {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getStored(): Pref | null {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function apply(stored: Pref | null) {
  const d = document.documentElement;
  d.dataset.pref = stored ?? "system";
  d.dataset.theme = stored ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  listeners.forEach((l) => l());
}

/** Store an explicit choice. */
export function setPref(pref: Pref) {
  try {
    localStorage.setItem("theme", pref);
  } catch {}
  apply(pref);
}

/** Forget the explicit choice and follow the system scheme again. */
export function clearPref() {
  try {
    localStorage.removeItem("theme");
  } catch {}
  apply(null);
}

/** Clicking the other button stores it. Clicking the active one clears a stored choice (back to following the system). */
export function pickPref(pref: Pref) {
  if (getStored() === pref) clearPref();
  else setPref(pref);
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Pref);

  return (
    <div
      role="group"
      aria-label="Theme"
      className={`hdr-panel flex h-10 gap-0.5 p-1 ${className}`}
    >
      {OPTIONS.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          aria-label={label}
          title={`${label} (click the active one again to follow your system)`}
          onClick={() => pickPref(value)}
          className="pill-btn flex h-8 w-8 items-center justify-center rounded-md"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {icon}
          </svg>
        </button>
      ))}
      <span className="sr-only">Pressing the active theme button again follows your system setting.</span>
    </div>
  );
}
