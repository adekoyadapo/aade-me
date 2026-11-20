import type { CSSProperties } from "react";
import type { Activity } from "@/lib/github-activity";

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

/** Server component. 7 rows, one column per week, oldest left. Native title tooltips; the grid is hidden from assistive tech and summarised in text. */
export default function GithubActivity({ data }: { data: Activity }) {
  const lead = new Date(data.days[0].date + "T00:00:00Z").getUTCDay(); // pad so rows are Sun..Sat
  const weeks = Math.ceil((lead + data.days.length) / 7);
  const total = data.total.toLocaleString("en-GB");
  return (
    <div className="gh">
      <dl className="grid grid-cols-[8.5rem_1fr] gap-y-1.5 font-mono text-xs">
        <dt className="uppercase text-mute">Contributions::</dt>
        <dd className="tabular-nums">{total}/YR</dd>
      </dl>
      <p className="sr-only">
        {total} contributions in the last year{data.busiestMonth ? `, busiest month ${data.busiestMonth}` : ""}.
      </p>
      <div className="gh-scroll" aria-hidden="true">
        <div className="gh-grid" style={{ "--w": weeks } as CSSProperties}>
          {Array.from({ length: lead }, (_, i) => <span key={`p${i}`} className="gh-c gh-pad" />)}
          {data.days.map((d, i) => (
            <span
              key={d.date}
              className="gh-c"
              data-l={d.level}
              style={{ "--c": Math.floor((i + lead) / 7) } as CSSProperties}
              title={`${d.count} contribution${d.count === 1 ? "" : "s"} on ${fmtDate(d.date)}`}
            />
          ))}
        </div>
      </div>
      <div className="gh-foot font-mono">
        <a data-hit href="https://github.com/adekoyadapo" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">github.com/adekoyadapo</a>
        <span aria-hidden="true" className="gh-legend">
          Less <i className="gh-c" data-l="0" /><i className="gh-c" data-l="1" /><i className="gh-c" data-l="2" /><i className="gh-c" data-l="3" /><i className="gh-c" data-l="4" /> More
        </span>
      </div>
      <p className="gh-cap">Public GitHub contributions, updated every few hours</p>
    </div>
  );
}
