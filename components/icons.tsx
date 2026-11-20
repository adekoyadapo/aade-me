import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: P) => (<Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>);
export const ArrowLeft = (p: P) => (<Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>);
export const ArrowUp = (p: P) => (<Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>);
export const ChevronLeft = (p: P) => (<Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>);
export const ChevronRight = (p: P) => (<Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>);
export const Calendar = (p: P) => (<Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>);
export const Clock = (p: P) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>);
export const User = (p: P) => (<Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>);
export const Pencil = (p: P) => (<Svg {...p}><path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z" /></Svg>);
export const Search = (p: P) => (<Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>);
export const Close = (p: P) => (<Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>);
export const Menu = (p: P) => (<Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>);
export const Home = (p: P) => (<Svg {...p}><path d="M4 11l8-7 8 7v9H4z" /></Svg>);
export const Share = (p: P) => (<Svg {...p}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" /></Svg>);
export const Link = (p: P) => (<Svg {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Svg>);
export const Send = (p: P) => (<Svg {...p}><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" /></Svg>);
export const Download = (p: P) => (<Svg {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></Svg>);
export const Doc = (p: P) => (<Svg {...p}><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" /></Svg>);
export const Mail = (p: P) => (<Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>);
export const Globe = (p: P) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></Svg>);
