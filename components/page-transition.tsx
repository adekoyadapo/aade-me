import { ViewTransition } from "react";

/**
 * Page tear between routes (CSS in app/globals.css, "Page tear"). The page itself is not named: it is part of the root snapshot,
 * which the CSS clips along a jagged torn-paper edge travelling left to right, revealing the new page underneath.
 * Two empty, fixed, named layers (vt-rim, vt-shade) give the edge its paper-fibre rim and its shadow; they paint nothing outside a
 * view transition. A 1px invisible sentinel makes React start a native view transition on every navigation; its group is hidden in CSS.
 * Pure CSS, no client JS. Browsers without view transitions, and reduced motion, navigate instantly.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ViewTransition name="vt-tick" share="vt-tick" enter="vt-tick" exit="vt-tick" default="none">
        <div className="vt-tick" aria-hidden="true" />
      </ViewTransition>
      <div className="vt-shade" aria-hidden="true" />
      <div className="vt-rim" aria-hidden="true" />
      {children}
    </>
  );
}
