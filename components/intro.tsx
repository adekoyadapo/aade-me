import React from "react";
import Link from "next/link";
import Image from "next/image";
import WireframeBg from "@/components/wireframe-bg";
import HeroStageControls from "@/components/hero-stage-controls";
import StageGL from "@/components/stage-gl";
import { projectsData } from "@/lib/data";
import { SIZES_FEATURED, SIZES_TILE } from "@/lib/stage";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Home stage: exactly one viewport, flat graphite with grain (the optional wireframe backdrop is off unless ?bg=1).
 * Server-rendered: the ten artworks as cards, the caption of the featured project, and the identity line. Card i starts in
 * slot i: slot 0 is the wide featured artwork left of centre, slot 1 the next project as a glass tile right of centre, slots 2-5
 * the corner tiles, slots 6-9 parked off screen. HeroStageControls rotates the slots (wheel, swipe, arrows, buttons, dots);
 * CSS does the motion. Without JS project 1 stays featured and the full list sits in "Selected work" below.
 */
export default function Intro() {
  const total = projectsData.length;
  return (
    <section id="home" data-hero className="hero">
      <WireframeBg />
      <h1 className="sr-only">Ade A.</h1>

      <div className="art-field" data-art>
        {projectsData.map((p, i) => (
          <figure
            key={p.slug}
            data-card
            data-idx={i}
            data-slot={i}
            aria-hidden={i === 0 ? undefined : true}
            className="art-card"
            style={{ "--fd": `${-i * 1.1}s` } as React.CSSProperties}
          >
            <div className="art-float">
              <div className="art-face">
                <Image
                  src={p.image}
                  alt={p.alt}
                  width={1400}
                  height={900}
                  sizes={i === 0 ? SIZES_FEATURED : SIZES_TILE}
                  className="art-img"
                  {...(i === 0 ? { preload: true, fetchPriority: "high" as const } : { loading: "lazy" as const, fetchPriority: "low" as const })}
                />
              </div>
            </div>
          </figure>
        ))}
      </div>

      <div data-stage role="region" aria-roledescription="carousel" aria-label="Featured projects" className="stage-wrap">
        <noscript>
          <style>{`.stage-ctrl{display:none!important}`}</style>
        </noscript>
        <div className="art-cap">
          <div className="stage-list">
            {projectsData.map((p, i) => (
              <div
                key={p.slug}
                data-stage-item
                data-active={i === 0 ? "true" : undefined}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${total}: ${p.title}`}
                className="stage-item"
              >
                <p className="stage-count">
                  N&deg;{pad(i + 1)} / {pad(total)}
                </p>
                <p data-title className="stage-title">{p.title}</p>
                <ul className="stage-chips" aria-label="Technologies">
                  {p.tags.slice(0, 2).map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
                <a href={p.links[0].href} target="_blank" rel="noopener noreferrer" className="ghost-btn">
                  View project<span className="sr-only">: {p.title} (opens in a new tab)</span>
                </a>
              </div>
            ))}
          </div>
        </div>
        <HeroStageControls titles={projectsData.map((p) => p.title)} />
      </div>
      <StageGL />

      <div className="hero-id">
        <p className="hero-id-name">Ade A.</p>
        <p className="hero-id-role">Enterprise Solutions Architect<span className="hero-id-more">, Customer Architect at Elastic</span></p>
        <p className="hero-id-links">
          <Link href="/blog">Writing</Link>
          <Link href="/contact">Contact</Link>
        </p>
      </div>
    </section>
  );
}
