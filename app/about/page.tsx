import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { ldJson } from "@/lib/jsonld";
import PageTransition from "@/components/page-transition";
import Reveal from "@/components/reveal";
import LocalTime from "@/components/local-time";
import { badgesData, experiencesData, skillsData } from "@/lib/data";
import { resume } from "@/lib/resume";
import { socialLinks } from "@/lib/links";
import { getGithubActivity } from "@/lib/github-activity";
import GithubActivity from "@/components/github-activity";

export const revalidate = 21600;

const title = "About Ade A.: Lead Architect, Enterprise Solutions Architecture";
const description =
  "15+ years from data centers in Lagos to enterprise AI. Career route, scope and certifications of Ade A., Lead Architect for agentic AI programs and multi-cloud platforms.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "https://aade.me/about" },
  openGraph: { title, description, url: "https://aade.me/about", type: "profile", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ade A., Lead Architect, Enterprise Solutions Architecture" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
};

/** `**word**` marks bold text. Each word becomes a span that lights up on scroll (CSS only; plain text without it). */
const letter = [
  "I am an enterprise architect with **15+ years** in infrastructure, cloud, security and AI. I started as a network engineer running data centers and cell sites in Lagos, then moved through DevOps, cloud architecture and engineering leadership into **enterprise AI**.",
  "At Elastic I lead **agentic AI and AI search architecture** for more than 5 strategic customers, with results that include SOC triage cut from hours to minutes and a three-week vulnerability assessment turned into a weekly automated run.",
  "Before Elastic I led a 12-person engineering organization at Deloitte through three direct leads, delivering more than 10 applications across seven workstreams on AWS, Google Cloud and Azure. Earlier, I built a 20-person technical organization at Web4Africa, owned a $5M–$10M enterprise portfolio, and supported about $50M in cloud solution opportunities at SADA.",
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
const since = Math.min(...experiencesData.map((e) => parseInt(e.date.match(/\d{4}/)?.[0] ?? "0", 10)).filter((y) => y > 2010));

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
                  {resume.headlineLead} <span aria-hidden="true">::</span> {new Date().getFullYear() - since}+ years
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
                <dd>{resume.headlineLead}</dd>
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
                        <span>{e.title.trim()}</span>
                        {e.bullets.length ? (
                        <details className="mt-1 text-sm text-mute">
                          <summary className="cursor-pointer select-none hover:text-fg">Details</summary>
                          <ul className="mt-2 max-w-[70ch] list-disc space-y-1 pl-4">
                            {e.bullets.map((b) => (
                              <li key={b.slice(0, 32)}>{b}</li>
                            ))}
                          </ul>
                        </details>
                        ) : null}
                      </td>
                      <td className="micro whitespace-nowrap py-4 !text-fg">{e.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scope */}
          <section aria-labelledby="scope" className="mt-16">
            <h2 id="scope" className={label}>Technical and leadership scope</h2>
            <ul data-rv-group className="rv-chips mt-6 flex flex-wrap gap-2">
              {resume.scope.map((name, i) => (
                <li key={name} style={{ "--i": Math.min(i, 30) } as React.CSSProperties} className="rv-item rounded-md border border-line bg-surface px-3 py-2 text-sm">
                  {name}
                </li>
              ))}
            </ul>
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
            <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[12rem_1fr]">
              {resume.certs.map((g) => (
                <React.Fragment key={g.group}>
                  <dt className="font-mono text-xs uppercase text-mute">{g.group}</dt>
                  <dd>{g.items.join(" | ")}</dd>
                </React.Fragment>
              ))}
            </dl>
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
