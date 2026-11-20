"use client";

import { useEffect, useState } from "react";

/** Visitor's own local time. Intl only, no network. Renders a placeholder on the server. */
export default function LocalTime() {
  const [now, setNow] = useState<{ time: string; zone: string } | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tick = () => setNow({ time: fmt.format(new Date()), zone });
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums">
      <span className="block">{now?.time ?? "--:--:--"}</span>
      <span className="block min-h-[1.25em] text-mute">{now?.zone ?? "\u00a0"}</span>
    </span>
  );
}
