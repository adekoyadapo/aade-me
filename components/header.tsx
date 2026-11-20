import Bell from "./nav/bell";
import Logo from "./nav/logo";
import MobileMenu from "./nav/mobile-menu";
import NavLinks from "./nav/nav-links";
import PaletteHost from "./nav/palette-host";
import PaletteTrigger from "./nav/palette-trigger";
import type { PaletteItem } from "./nav/palette";
import ThemeToggle from "./theme-toggle";
import { getAllPosts } from "@/lib/blog-repo";
import { navLinks } from "@/lib/links";
import { projectsData } from "@/lib/data";

/** Server shell: reads post titles once and hands small JSON to the client islands. */
export default async function Header() {
  const posts = (await getAllPosts()).map(({ slug, title, date, tags, excerpt }) => ({ slug, title, date, tags, excerpt }));

  const items: PaletteItem[] = [
    { label: "Home", kind: "Page" as const, href: "/" },
    ...navLinks.map((l) => ({ label: l.name, kind: "Page" as const, href: l.href })),
    ...posts.map((p) => ({ label: p.title, kind: "Post" as const, href: `/blog/${p.slug}`, tags: p.tags, excerpt: p.excerpt.slice(0, 220) })),
    ...projectsData.map((p) => ({
      label: p.title,
      kind: "Project" as const,
      tags: p.tags,
      excerpt: "",
      href: p.projecUrl,
      external: true,
    })),
  ];

  return (
    <header style={{ viewTransitionName: "site-header" }} className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-header)] flex h-[var(--header-h)] items-center px-[var(--gutter)]">
      <div className="relative mx-auto flex w-full max-w-[var(--wide,1600px)] items-center justify-between">
        {/* Logo: two outlined boxes, outside the pill, like the reference */}
        <div className="pointer-events-auto">
          <Logo />
        </div>
        {/* Centred pill: links and the palette trigger only */}
        <div className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
          <nav aria-label="Primary" className="hdr-panel h-10 p-1">
            <NavLinks
              className="flex h-full items-center gap-0.5"
              linkClassName="flex h-8 items-center rounded-md px-3.5 text-base font-normal"
            />
          </nav>
          <PaletteTrigger bare className="hdr-panel flex h-10 items-center justify-center px-3 text-mute transition-colors hover:text-fg" />
        </div>
        <div className="pointer-events-auto flex items-center gap-1">
          <Bell latest={posts.slice(0, 3)} />
          <ThemeToggle className="hidden md:flex" />
          <MobileMenu />
        </div>
        <PaletteHost items={items} />
      </div>
    </header>
  );
}
