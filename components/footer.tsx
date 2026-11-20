import Link from "next/link";
import { navLinks } from "@/lib/links";

export default function Footer() {
  return (
    <footer className="gutter border-t border-line py-10 text-mute">
      <div className="wide flex flex-col gap-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <small>
          &copy; {new Date().getFullYear()}{" "}
          <Link href="/">
            <span className="text-sm font-medium">Ade A.</span>
          </Link>{" "}
          All rights reserved.
        </small>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-fg focus-visible:text-fg">
                  {l.name}
                </Link>
              </li>
            ))}
            <li>
              <a href="/feed.xml" className="hover:text-fg focus-visible:text-fg">
                RSS
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
