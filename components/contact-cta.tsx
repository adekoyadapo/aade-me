import Link from "next/link";

/** Call to action band. Links to the contact page. */
export default function ContactCta() {
  return (
    <section className="band band-cta" aria-labelledby="cta-title">
      <div className="wide flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <p className="micro">Contact</p>
          <h2 id="cta-title" className="mt-3 max-w-[24ch] text-[length:var(--fs-h2)]">
            Have a platform, search or AI problem to solve?
          </h2>
        </div>
        <Link
          href="/contact"
          data-ripple
          className="rounded-lg bg-fg px-6 py-3 text-base font-medium text-bg transition-transform hover:scale-[1.03] focus-visible:scale-[1.03]"
        >
          Get in touch
        </Link>
      </div>
    </section>
  );
}
