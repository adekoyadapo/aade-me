import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { ldJson } from "@/lib/jsonld";
import PageTransition from "@/components/page-transition";
import Reveal from "@/components/reveal";
import LocalTime from "@/components/local-time";
import { badgesData, experiencesData, skillsData } from "@/lib/data";
import { socialLinks } from "@/lib/links";
import { getGithubActivity } from "@/lib/github-activity";
import GithubActivity from "@/components/github-activity";

export const revalidate = 21600;

const title = "About Ade A.: Customer Architect at Elastic, 15 Years";
const description =
  "Fifteen years from data centres in Lagos to Enterprise Solutions Architecture. Career route, skills and certifications of Ade A., Customer Architect.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "https://aade.me/about" },
  openGraph: { title, description, url: "https://aade.me/about", type: "profile", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ade A., Enterprise Solutions Architect" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
};

/** `**word**` marks bold text. Each word becomes a span that lights up on scroll (CSS only; plain text without it). */
const letter = [
  "I have spent 15+ years at the intersection of infrastructure, cloud, and software, starting with physical data centres and routing tables in Lagos, and working my way through DevOps, SRE, platform engineering, and now **Enterprise Solutions Architecture**. Each role taught me that the best technical decisions are the ones grounded in real-world constraints, not just what looks clean on a whiteboard.",
  "Today I work as a **Customer Architect at Elastic**, helping enterprise teams unlock the full potential of the Elastic Stack across **Search, Observability, and Security**. That means designing AI-powered search pipelines with vector embeddings and ELSER, building petabyte-scale log analytics platforms with OpenTelemetry and LogsDB, and architecting SIEM and threat-detection solutions for Fortune 500 environments.",
  "The thread running through all of it is the same: I like hard problems. Whether it is cutting Elasticsearch storage costs, wiring up an **AI/ML inference pipeline** in the cloud, or helping a platform team get their first real SLO in place, I get satisfaction from making complex systems simpler and more reliable for the people who depend on them.",
];

function Lit({ text, offset }: { text: string; offset: number }) {
  let n = offset;
  return text.split("**").map((chunk, i) => {
    // Boundary spaces belong to the plain text around a bold run, so they are kept on both sides of it.
    const list = chunk.split(/\s+/).filter(Boolean);
    const lead = i % 2 === 0 && /^\s/.test(chunk) ? " " : "";
    const trail = i % 2 === 0 && /\s$/.test(chunk) ? " " : "";
    const words = list.map((w, j) => (
      <React.Fragment key={n++}>
        <span className="lit-word">{w}</span>
        {j < list.length - 1 ? " " : ""}
      </React.Fragment>
    ));
    return i % 2 ? (
      <strong key={i} className="font-semibold">{words}</strong>
    ) : (
      <React.Fragment key={i}>{lead}{words}{trail}</React.Fragment>
    );
  });
}

const company = (loc: string) => loc.split(",")[0].trim();
const roles = experiencesData.filter((e) => !/^B\.Eng/.test(e.title));
const since = Math.min(...experiencesData.map((e) => parseInt(e.date.slice(0, 4), 10)).filter((y) => y > 2010));
const current = experiencesData[0];

const label = "micro";

export default async function AboutPage() {
  const activity = await getGithubActivity();
  const offsets = letter.map((_, i) => letter.slice(0, i).reduce((n, t) => n + t.split(/\s+/).length, 0));

  return (
    <PageTransition>
      <Reveal />
      <main className="gutter page-top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson({ "@context": "https://schema.org", "@type": "AboutPage", url: "https://aade.me/about", name: "About Ade A.", mainEntity: { "@id": "https://aade.me/#person" } }) }} />
        <div className="wide">
          {/* Desk scene: tilted postcard with a monogram stamp, and a telemetry card. Static; no photo. */}
          <section aria-labelledby="who" className="desk">
            <div className="postcard">
              <div className="stamp-perf" aria-hidden="true">
                <div className="stamp-face">
                  <span className="stamp-mono">AA</span>
                  <span className="stamp-cap">Ade A.</span>
                </div>
              </div>
              <div className="postcard-body">
                <span aria-hidden="true" className="postmark postmark-a" />
                <span aria-hidden="true" className="postmark postmark-b" />
                <h1 id="who" className="text-[length:var(--fs-h4)] font-medium leading-tight">Ade A.</h1>
                <p className="mt-1 font-mono text-xs uppercase text-mute">
                  {current.title} at Elastic <span aria-hidden="true">::</span> {new Date().getFullYear() - since}+ years
                </p>
                <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-6 font-mono text-xs uppercase">
                  {socialLinks.map((l) => (
                    <li key={l.name}>
                      <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline-offset-4 hover:underline">{l.name}</a>
                    </li>
                  ))}
                  <li><Link href="/contact" className="underline-offset-4 hover:underline">Contact</Link></li>
                  <li><Link href="/cv" className="underline-offset-4 hover:underline">CV</Link></li>
                </ul>
                <div className="postcard-foot">
                  <a href="#bio" className="ghost-btn">About me</a>
                </div>
              </div>
            </div>

            <section aria-labelledby="telemetry" className="telemetry">
              <h2 id="telemetry" className={label}>Telemetry <span aria-hidden="true">::</span> live</h2>
              <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-y-1.5 font-mono text-xs">
                <dt className="uppercase text-mute">Local::</dt>
                <dd><LocalTime /></dd>
                <dt className="uppercase text-mute">Role::</dt>
                <dd>{current.title}, {company(current.location)}</dd>
                <dt className="uppercase text-mute">Years::</dt>
                <dd>{new Date().getFullYear() - since}+</dd>
                <dt className="uppercase text-mute">Roles::</dt>
                <dd>{roles.length}</dd>
                <dt className="uppercase text-mute">Certs::</dt>
                <dd>{badgesData.length}</dd>
              </dl>
              {activity ? <GithubActivity data={activity} /> : null}
            </section>
          </section>

          {/* Scroll-lit letter */}
          <section id="bio" aria-labelledby="letter" className="mt-20 scroll-mt-28">
            <h2 id="letter" className={label}>About me <span aria-hidden="true">::</span></h2>
            <div className="mt-6 max-w-[62ch] space-y-5 text-[length:var(--fs-body)] leading-[1.6]">
              {letter.map((p, i) => (
                <p key={i}><Lit text={p} offset={offsets[i]} /></p>
              ))}
            </div>
          </section>

          {/* Record table */}
          <section aria-labelledby="record" className="mt-16">
            <p className={label}>The record</p>
            <h2 id="record" className="mt-2 text-base font-medium">
              Where I have worked <span aria-hidden="true" className="font-mono text-mute">::</span>
            </h2>
            <div className="mt-8 overflow-x-auto">
              <table className="rv-table w-full min-w-[34rem] border-collapse text-left">
                <caption className="sr-only">Employment history, newest first</caption>
                <thead>
                  <tr className="micro border-b border-line">
                    <th scope="col" className="py-3 pr-4 font-normal">Company</th>
                    <th scope="col" className="py-3 pr-4 font-normal">Role</th>
                    <th scope="col" className="py-3 font-normal">Years</th>
                  </tr>
                </thead>
                <tbody data-rv-group>
                  {experiencesData.map((e, i) => (
                    <tr key={e.title + e.date} style={{ "--i": Math.min(i, 10) } as React.CSSProperties} className="rv-item border-b border-line align-top">
                      <th scope="row" className="py-4 pr-4 font-medium">{company(e.location)}<span className="block text-sm font-normal text-mute">{e.location.split(",").slice(1).join(",").trim()}</span></th>
                      <td className="py-4 pr-4">
                        <span className="capitalize">{e.title.trim()}</span>
                        <details className="mt-1 text-sm text-mute">
                          <summary className="cursor-pointer select-none hover:text-fg">Details</summary>
                          <p className="mt-2 max-w-[70ch]">{e.description.replace(/\s+/g, " ")}</p>
                        </details>
                      </td>
                      <td className="micro whitespace-nowrap py-4 !text-fg">{e.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Skills */}
          <section aria-labelledby="skills" className="mt-16">
            <h2 id="skills" className={label}>Skills on file</h2>
            <ul data-rv-group className="rv-chips mt-6 flex flex-wrap gap-2">
              {skillsData.map(({ name, icon }, i) => (
                <li key={name} style={{ "--i": Math.min(i, 30) } as React.CSSProperties} className="rv-item flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm">
                  <span aria-hidden="true" className="text-mute">{icon}</span>
                  {name}
                </li>
              ))}
            </ul>
          </section>

          {/* Certifications */}
          <section aria-labelledby="certs" className="mt-16">
            <h2 id="certs" className={label}>Certifications on file</h2>
            <ul data-rv-group className="rv-badges mt-6 flex flex-wrap gap-2">
              {badgesData.map(({ name, link, imageUrl }, i) => (
                <li key={i} style={{ "--i": Math.min(i, 20) } as React.CSSProperties} className="rv-item rounded-lg border border-line bg-surface p-2">
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    <Image src={imageUrl} alt={`${name} certification badge`} width={72} height={72} sizes="72px" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </PageTransition>
  );
}
