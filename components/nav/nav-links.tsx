"use client";

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/links";
import { isNavActive } from "@/lib/nav-active";

export default function NavLinks({
  className,
  linkClassName,
  onNavigate,
}: {
  className?: string;
  linkClassName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className={className}>
      {navLinks.map((link) => {
        const active = isNavActive(link, pathname);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate?.()}
              className={clsx(
                linkClassName,
                active ? "pill-on" : "pill-off"
              )}
            >
              {link.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
