"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { pageLabel } from "@/lib/nav-active";

const GLYPHS = "abcdefghijklmnopqrstuvwxyz";

/** Two outlined boxes: a circle with the first initial and a rounded square with the second. On other pages the second box carries the page name, which decodes on every route change. */
export default function Logo() {
  const pathname = usePathname();
  const page = pageLabel(pathname);
  const target = page;
  const [scrambled, setScrambled] = useState<string | null>(null);
  const shown = scrambled ?? target;

  useEffect(() => {
    if (target.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setScrambled(
        target
          .split("")
          .map((ch, i) =>
            i < frame - 2 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join("")
      );
      if (frame - 2 >= target.length) {
        clearInterval(id);
        setScrambled(null);
      }
    }, 45);
    return () => clearInterval(id);
  }, [target]);

  return (
    <Link href="/" aria-label="Ade A., home" className="logo flex items-center rounded-lg">
      <span aria-hidden="true" className="logo-box logo-circle">A</span>
      <span aria-hidden="true" className="logo-box logo-square">{shown}</span>
    </Link>
  );
}
