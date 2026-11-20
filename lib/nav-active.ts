import { navLinks } from "./links";

type NavLink = (typeof navLinks)[number];

/** Active state by pathname. */
export function isNavActive(link: NavLink, pathname: string) {
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function pageLabel(pathname: string) {
  if (pathname.startsWith("/blog")) return "Writing";
  if (pathname.startsWith("/about")) return "About";
  if (pathname.startsWith("/contact")) return "Contact";
  if (pathname.startsWith("/cv")) return "CV";
  return "Ade";
}
