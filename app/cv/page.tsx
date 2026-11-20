import { statSync } from "node:fs";
import { ldJson } from "@/lib/jsonld";
import { join } from "node:path";
import { BsLinkedin } from "react-icons/bs";
import { FaGlobe } from "react-icons/fa";
import Link from "next/link";
import CvReveal, { CvReplayButton } from "@/components/cv-reveal";
import { cvSealScript } from "@/lib/cv-seal-script";
import { resume } from "@/lib/resume";

/** Real file facts for the sealed caption and the download button: the size comes from public/CV.pdf at build time. */
function pdfKb(): string | null {
  try {
    return `${Math.round(statSync(join(process.cwd(), "public", "CV.pdf")).size / 1000)} KB`;
  } catch {
    return null;
  }
}

const h2 = "cv-h2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400";

export default function CVPage() {
  const kb = pdfKb();
  return (
    <main id="cv-root" className="cv-root" suppressHydrationWarning>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson({ "@context": "https://schema.org", "@type": "ProfilePage", url: "https://aade.me/cv", name: `Resume of ${resume.name}`, mainEntity: { "@id": "https://aade.me/#person" } }) }} />
      {/* Decides before paint whether the sealed screen shows (JS on, motion allowed, first visit this session). */}
      <script dangerouslySetInnerHTML={{ __html: cvSealScript }} />
      <style>{`
        @media print {
          @page { margin: 1.1cm; }
          html, body { background: #fff !important; color: #000 !important; }
          body::after { display: none !important; }
          .no-print { display: none !important; }
          .cv-container { max-width: 100% !important; padding: 0 !important; }
          .cv-card, .cv-card * { background: transparent !important; color: #000 !important; box-shadow: none !important; animation: none !important; transition: none !important; }
          .cv-card { border: 0 !important; border-radius: 0 !important; }
          .cv-head { padding: 0 0 0.4rem !important; border-bottom: 1px solid #000; }
          .cv-body { padding: 0.5rem 0 0 !important; }
          .cv-body > * + * { margin-top: 0.5rem !important; }
          .cv-card { font-size: 9pt; line-height: 1.3; }
          .cv-card h1 { font-size: 20pt !important; }
          .cv-card li, .cv-card p { font-size: 9pt !important; line-height: 1.3 !important; }
          .cv-card .gap-2 { gap: 0.25rem !important; }
          .cv-card .gap-4 { gap: 0.4rem 1rem !important; }
          .cv-chip { border: 1px solid #999; padding: 0 0.4rem !important; font-size: 8.5pt !important; border-radius: 4px !important; }
          .cv-role, .cv-earlier li, .cv-cert { break-inside: avoid; page-break-inside: avoid; }
          .cv-h2 { break-after: avoid; border-bottom: 1px solid #999; padding-bottom: 2px; }
          .cv-role { margin-top: 0.35rem !important; }
          .cv-card .space-y-7 > * + * { margin-top: 0.35rem !important; }
          .cv-card .space-y-3 > * + * { margin-top: 0.25rem !important; }
          .cv-card .space-y-1 > * + * { margin-top: 0.1rem !important; }
          .cv-role ul { margin-top: 0.15rem !important; }
          .cv-card a { text-decoration: none !important; }
        }
      `}</style>

      <CvReveal file={`CV.pdf${kb ? ` :: ${kb}` : ""}`} />

      {/* CV content: always in the DOM; hidden (not removed) only while the sealed screen shows */}
      <div className="cv-container max-w-4xl mx-auto px-4 pb-10 pt-[calc(var(--header-h)+1.5rem)] sm:pb-14">
        <div className="no-print mb-5 flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-mute transition hover:text-fg">
            ← Back to site
          </Link>
          <a
            href="/CV.pdf"
            download
            className="flex items-center gap-2 rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition hover:scale-105"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M10 13.5 5.5 9l1.1-1.1 2.6 2.6V3h1.6v7.5l2.6-2.6L14.5 9 10 13.5ZM4 15.5h12V17H4v-1.5Z" />
            </svg>
            Download PDF{kb ? <span className="font-normal opacity-70"> ({kb})</span> : null}
          </a>
        </div>
        <div className="cv-card bg-white dark:bg-zinc-800/50 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700 overflow-hidden">

          {/* Header */}
          <div className="cv-head bg-zinc-900 dark:bg-zinc-950 text-white px-8 sm:px-12 py-10">
            <div className="flex items-start justify-between gap-4">
              <h1 id="cv-title" tabIndex={-1} className="text-4xl font-bold tracking-tight mb-1 outline-none">{resume.name}</h1>
              <CvReplayButton />
            </div>
            <p className="text-zinc-300 text-lg font-medium mb-4">{resume.headline}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-300">
              <a href={`mailto:${resume.email}`} className="hover:text-white transition">{resume.email}</a>
              <a href={resume.websiteHref} className="hover:text-white transition flex items-center gap-1">
                <FaGlobe className="text-xs" aria-hidden="true" /> {resume.website}
              </a>
              <a href={resume.linkedinHref} target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-1">
                <BsLinkedin className="text-xs" aria-hidden="true" /> {resume.linkedin}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>

          <div className="cv-body px-8 sm:px-12 py-8 space-y-8">

            <section aria-labelledby="cv-profile">
              <h2 id="cv-profile" className={`${h2} mb-3`}>Executive Profile</h2>
              <div className="space-y-3 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {resume.profile.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            </section>

            <hr className="no-print border-zinc-100 dark:border-zinc-700" />

            <section aria-labelledby="cv-scope">
              <h2 id="cv-scope" className={`${h2} mb-3`}>Technical and Leadership Scope</h2>
              <ul className="flex flex-wrap gap-2">
                {resume.scope.map((skill) => (
                  <li key={skill} className="cv-chip text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1 rounded-full">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>

            <hr className="no-print border-zinc-100 dark:border-zinc-700" />

            <section aria-labelledby="cv-experience">
              <h2 id="cv-experience" className={`${h2} mb-5`}>Professional Experience</h2>
              <div className="space-y-7">
                {resume.roles.map((exp) => (
                  <div key={`${exp.company}-${exp.dates}`} className="cv-role">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{exp.company} — {exp.title}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-right">{exp.dates}</p>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{exp.place}</p>
                    <ul className="mt-1.5 space-y-1">
                      {exp.bullets.map((b) => (
                        <li key={b.slice(0, 32)} className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed pl-3 border-l-2 border-zinc-200 dark:border-zinc-600">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <hr className="no-print border-zinc-100 dark:border-zinc-700" />

            <section aria-labelledby="cv-earlier">
              <h2 id="cv-earlier" className={`${h2} mb-4`}>Earlier Experience</h2>
              <ul className="cv-earlier space-y-3">
                {resume.earlier.map((e) => (
                  <li key={`${e.company}-${e.dates}`} className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{e.company} — {e.title}.</strong>{" "}
                    <span className="text-zinc-500 dark:text-zinc-400">{e.place} | {e.dates}.</span> {e.text}
                  </li>
                ))}
              </ul>
            </section>

            <hr className="no-print border-zinc-100 dark:border-zinc-700" />

            <section aria-labelledby="cv-certs">
              <h2 id="cv-certs" className={`${h2} mb-4`}>Certifications</h2>
              <ul className="grid sm:grid-cols-2 gap-4">
                {resume.certs.map((group) => (
                  <li key={group.group} className="cv-cert">
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">{group.group}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{group.items.join(" | ")}</p>
                  </li>
                ))}
              </ul>
            </section>

            <hr className="no-print border-zinc-100 dark:border-zinc-700" />

            <section aria-labelledby="cv-education">
              <h2 id="cv-education" className={`${h2} mb-3`}>Education</h2>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{resume.education.degree}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{resume.education.school}</p>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{resume.education.year}</span>
              </div>
            </section>

          </div>
        </div>

        {/* Footer note */}
        <p className="no-print text-center text-xs text-zinc-500 mt-6">
          Download the PDF above, or print this page from your browser (<kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs">Ctrl/Cmd + P</kbd>).
        </p>
      </div>
    </main>
  );
}
