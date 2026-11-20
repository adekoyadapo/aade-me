import React from "react";

type SectionHeadingProps = {
  children: React.ReactNode;
};

/** Section title with the trailing " ::" motif. */
export default function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2 className="mb-8 text-[length:var(--fs-h4)] font-medium">
      {children}{" "}
      <span aria-hidden="true" className="font-mono text-mute">
        ::
      </span>
    </h2>
  );
}
