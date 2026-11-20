import { projectsData } from "@/lib/data";
import SectionHeading from "./section-heading";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Selected work": a plain server-rendered list of every project. The hero shows them as artwork one at a time;
 * this list is the no-JS version and the quick scan. Text only, so no second set of images.
 */
export default function ProjectStage() {
  const total = projectsData.length;
  return (
    <section id="projects" className="band">
      <div className="wide">
        <SectionHeading>Selected work</SectionHeading>
        <ol className="divide-y divide-line border-y border-line">
          {projectsData.map((p, i) => (
            <li key={p.slug} className="grid gap-x-8 gap-y-3 py-5 lg:grid-cols-[8rem_minmax(0,5fr)_minmax(0,6fr)_auto] lg:items-start">
              <p className="micro-accent">
                N&deg;{pad(i + 1)} / {pad(total)}
              </p>
              <h3 className="text-xl font-medium">{p.title}</h3>
              <div className="flex min-w-0 flex-col gap-3">
                <p className="max-w-[60ch] leading-relaxed text-mute">{p.description}</p>
                <ul className="flex flex-wrap gap-2" aria-label="Technologies">
                  {p.tags.map((t) => (
                    <li key={t} className="micro rounded-md border border-line px-2.5 py-1 transition-colors hover:border-fg hover:!text-fg">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank" rel="noopener noreferrer"
                    className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-fg"
                  >
                    {l.label}
                    <span className="sr-only"> for {p.title} (opens in a new tab)</span>
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
