/** Primary navigation. Active state follows the pathname. */
export const navLinks = [
  { name: "About", href: "/about" },
  { name: "Writing", href: "/blog" },
  { name: "Contact", href: "/contact" },
  { name: "CV", href: "/cv" },
] as const;

/** Public profiles shown on the About postcard. Only links that exist in the repo's own data. */
export const socialLinks = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/adekoya-adedapomola/" },
  { name: "GitHub", href: "https://github.com/adekoyadapo" },
  { name: "X", href: "https://twitter.com/Dapo_Ace" },
  { name: "Blog", href: "https://blog.360ace.net" },
  { name: "Feed", href: "/feed.xml" },
] as const;
