"use client";

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Script from "next/script";
import { sendEmail } from "@/actions/sendEmail";
import SignaturePad from "./signature-pad";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileApi = { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id?: string) => void };
const getTurnstile = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

/** Explicit-render Turnstile: works on first load and on client-side returns to the page. */
function TurnstileWidget({ widgetId }: { widgetId: React.RefObject<string | null> }) {
  const box = useRef<HTMLDivElement>(null);
  const mount = useCallback(() => {
    const api = getTurnstile();
    if (!api || !box.current || widgetId.current) return;
    widgetId.current = api.render(box.current, { sitekey: turnstileSiteKey, theme: "auto", size: "flexible" });
  }, [widgetId]);
  useEffect(() => {
    mount(); // script already loaded (return visit)
    const ref = widgetId;
    return () => {
      if (ref.current) getTurnstile()?.remove(ref.current);
      ref.current = null;
    };
  }, [mount, widgetId]);
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mount} />
      <div ref={box} className="mx-auto mt-6 min-h-[65px]" />
    </>
  );
}
const REASONS = ["New business", "Collaboration", "Just a hello"] as const;

type Errors = Partial<Record<"name" | "email" | "message" | "signature", string>>;
type Receipt = { ref: string; at: string; reason: string; name: string; email: string; chars: number; signature: string };
type Result = { error?: string; data?: { dropped?: boolean; error?: unknown; data?: { id?: string } | null } };

const noop = () => () => {};
const dateNow = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

const field =
  "w-full border-0 border-b border-[var(--line)] bg-transparent px-0 py-2 font-mono text-[15px] text-fg placeholder:text-mute aria-[invalid=true]:border-b-2 aria-[invalid=true]:border-fg";

/** Decorative barcode: deterministic bars from a seed string, so server and client agree. */
function Barcode({ seed }: { seed: string }) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const bars: React.ReactNode[] = [];
  let x = 0;
  for (let i = 0; i < 46; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const w = 1 + ((h >>> 3) & 3) * 0.7;
    bars.push(<rect key={i} x={x} y="0" width={w} height="28" />);
    x += w + 1 + ((h >>> 9) & 1);
  }
  return (
    <svg viewBox={`0 0 ${x} 28`} preserveAspectRatio="none" aria-hidden="true" className="block h-7 w-full" fill="currentColor">
      {bars}
    </svg>
  );
}

function Err({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p id={id} className="mt-1.5 text-sm font-medium">
      <span aria-hidden="true">! </span>
      {text}
    </p>
  ) : null;
}

export default function ContactLetter() {
  const widgetId = useRef<string | null>(null);
  const [formTs] = useState(() => Date.now().toString());
  const today = useSyncExternalStore(noop, dateNow, () => "");
  const [strokes, setStrokes] = useState(0);
  const [padKey, setPadKey] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const val = (k: string) => String(fd.get(k) ?? "").trim();
    const name = val("name");
    const email = val("senderEmail");
    const body = val("body");
    const typed = val("typedSignature");
    const reason = val("reason") || "Just a hello";

    const next: Errors = {};
    if (!name) next.name = "Enter your name.";
    if (!email) next.email = "Enter your email address.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Enter a valid email address, like you@company.com.";
    if (!body) next.message = "Write a short message.";
    if (!typed && strokes === 0) next.signature = "Sign the letter: draw on the pad or type your name below it.";
    setErrors(next);
    if (Object.keys(next).length) {
      setStatus({ ok: false, text: "The letter is not ready to send. Fix the marked fields." });
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    const signature = [typed ? `typed "${typed}"` : null, strokes ? `drawn (${strokes} stroke${strokes > 1 ? "s" : ""})` : null]
      .filter(Boolean)
      .join(" and ");
    const out = new FormData();
    out.set("senderEmail", email);
    out.set("message", `Reason: ${reason}\nFrom: ${name}${val("via") ? `\nFound via: ${val("via")}` : ""}\nSigned: ${signature}\n\n${body}`);
    out.set("honeytrap", val("honeytrap"));
    out.set("form_ts", val("form_ts"));
    out.set("js_only", "1");
    const token = fd.get("cf-turnstile-response");
    if (token) out.set("cf-turnstile-response", token);

    setPending(true);
    setStatus({ ok: true, text: "Sending..." });
    try {
      const res = (await sendEmail(out)) as Result;
      const id = res.data?.data?.id;
      if (res.error) {
        setStatus({ ok: false, text: res.error });
      } else if (res.data?.dropped || res.data?.error || !id) {
        setStatus({
          ok: false,
          text: "The message was not delivered. It may have been sent too fast or flagged as spam (more than two links, or a very long unbroken string). Wait a moment, adjust it and try again.",
        });
      } else {
        setReceipt({ ref: id.slice(0, 8).toUpperCase(), at: new Date().toLocaleString("en-GB"), reason, name, email, chars: body.length, signature });
        setStatus({ ok: true, text: "Message sent. The ticket at the top right of the letter shows the details." });
        return;
      }
      if (widgetId.current) getTurnstile()?.reset(widgetId.current);
    } catch {
      setStatus({ ok: false, text: "Something went wrong while sending. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  };

  const again = () => {
    setReceipt(null);
    setStatus(null);
    setErrors({});
    setStrokes(0);
    setPadKey((k) => k + 1);
    document.querySelector<HTMLFormElement>("#letter-form")?.reset();
  };

  const rows: [string, string][] = receipt
    ? [
        ["Ref", receipt.ref],
        ["Sent", receipt.at],
        ["Re", receipt.reason],
        ["From", receipt.name],
        ["Reply to", receipt.email],
        ["Length", `${receipt.chars} chars`],
        ["Signed", receipt.signature],
      ]
    : [["Ref", "\u2014"], ["Sent", "\u2014"], ["Re", "\u2014"], ["Reply to", "\u2014"]];

  const ticket = (
    <aside
      aria-labelledby={receipt ? "receipt-title" : undefined}
      aria-hidden={receipt ? undefined : true}
      className={`ticket ${receipt ? "rise" : ""}`}
      data-state={receipt ? "sent" : "draft"}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 40 46" className="ticket-clip">
        <ellipse cx="21" cy="38" rx="15" ry="3.2" fill="rgba(0,0,0,.28)" />
        <path d="M9 14C5 6 8 1.5 12 1.5S14 7 14 13M31 14c4-8 1-12.500-3-12.500S26 7 26 13" fill="none" stroke="#b9bcc2" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 12h30l-3 22a3 3 0 0 1-3 2.500H11A3 3 0 0 1 8 34z" fill="#1b1b1d" />
        <path d="M5 12h30l-.6 4.500H5.600z" fill="#3a3b40" />
        <path d="M8.500 30.500l-.5 3.500a3 3 0 0 0 3 2.500h18a3 3 0 0 0 3-2.500l-.5-3.500z" fill="#101011" />
        <path d="M7 13.200h26" stroke="#8d9097" strokeWidth=".8" strokeLinecap="round" opacity=".7" />
      </svg>
      <h2 id="receipt-title" className="font-mono text-[11px] font-semibold uppercase tracking-tight">Ade A.:: intake</h2>
      <p className="font-mono text-[10px] uppercase text-mute">{receipt ? "Receipt \u00b7 counter 01" : "Draft \u00b7 not sent"}</p>
      <dl className="mt-3 font-mono text-[10px] uppercase">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-t border-dotted border-[var(--line)] py-1.5">
            <dt className="text-mute">{k}</dt>
            <dd className="break-words text-right">{v}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-dotted border-[var(--line)] py-1.5">
          <dt className="text-mute">Status</dt>
          <dd>{receipt ? "Sent" : "Draft"}</dd>
        </div>
      </dl>
      <div className="mt-2"><Barcode seed={receipt?.ref ?? "draft"} /></div>
      {receipt ? (
        <button type="button" onClick={again} className="mt-3 font-mono text-[10px] uppercase underline underline-offset-4">
          Write another letter
        </button>
      ) : (
        <p className="mt-2 font-mono text-[10px] uppercase text-mute">Keep this half</p>
      )}
    </aside>
  );

  return (
    <div className="paper-wrap">
      {ticket}
      <form id="letter-form" noValidate onSubmit={onSubmit} aria-label="Contact letter" className="paper">
        <div className="flex items-start gap-5 border-b border-[var(--line)] pb-6">
          <span aria-hidden="true" className="paper-mono">AA</span>
          <p className="leading-snug">
            <b className="text-lg font-medium">Ade A.</b>
            <span className="block font-mono text-[11px] uppercase tracking-tight text-mute">Enterprise Solutions Architecture</span>
          </p>
        </div>

        <p className="mt-6 min-h-4 font-mono text-xs uppercase text-mute"><time suppressHydrationWarning>{today}</time></p>
        <p className="mt-4 font-mono text-base">Dear Ade,</p>

        <fieldset className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <legend className="sr-only">Reason for writing</legend>
          <span aria-hidden="true" className="paper-label">Re ::</span>
          {REASONS.map((r) => (
            <React.Fragment key={r}>
              <input id={`reason-${r}`} className="reason sr-only" type="radio" name="reason" value={r} defaultChecked={r === "Just a hello"} />
              <label htmlFor={`reason-${r}`} className="paper-reason">{r}</label>
            </React.Fragment>
          ))}
        </fieldset>

        {/* Honeypot: hidden from people and assistive tech; bots fill it */}
        <input className="hidden" type="text" name="honeytrap" autoComplete="off" tabIndex={-1} aria-hidden="true" />
        <input type="hidden" name="form_ts" value={formTs} />

        <div className="mt-5 grid grid-cols-[4.25rem_1fr] items-baseline gap-x-3 sm:grid-cols-[5rem_1fr]">
          <label htmlFor="c-name" className="paper-label">Name ::</label>
          <div>
            <input id="c-name" name="name" autoComplete="name" maxLength={120} placeholder="Your name"
              className={field} aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} />
            <Err id="c-name-err" text={errors.name} />
          </div>
          <label htmlFor="c-email" className="paper-label mt-4">From ::</label>
          <div className="mt-4">
            <input id="c-email" name="senderEmail" type="email" autoComplete="email" maxLength={254} placeholder="you@company.com"
              className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-err" : undefined} />
            <Err id="c-email-err" text={errors.email} />
          </div>
          <label htmlFor="c-via" className="paper-label mt-4">Via ::</label>
          <div className="mt-4">
            <input id="c-via" name="via" autoComplete="off" maxLength={120} placeholder="A friend, a search, a post... (optional)" className={field} />
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="c-body" className="sr-only">Message</label>
          <textarea
            id="c-body" name="body" rows={6} maxLength={4600}
            placeholder="Tell me what you are building: scale, constraints, timeline."
            className="paper-ruled w-full resize-y border-0 bg-transparent p-0 font-mono text-[15px] text-fg placeholder:text-mute"
            aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-body-err" : undefined}
          />
          <Err id="c-body-err" text={errors.message} />
        </div>

        <p className="mt-8 font-mono text-base">Sincerely,</p>
        <div className="mt-2">
          <SignaturePad onStrokes={setStrokes} resetKey={padKey} describedBy="sig-hint" />
          <p id="sig-hint" className="paper-label mt-2">Drawing is optional. Typing your name as the signature is accepted.</p>
          <label htmlFor="c-sig" className="paper-label mt-4 block">Or type your name as signature</label>
          <input
            id="c-sig" name="typedSignature" autoComplete="off" maxLength={120} placeholder="Type your name"
            className={`${field} italic`} aria-invalid={!!errors.signature}
            aria-describedby={errors.signature ? "c-sig-err sig-hint" : "sig-hint"}
          />
          <Err id="c-sig-err" text={errors.signature} />
        </div>

        {turnstileSiteKey && <TurnstileWidget widgetId={widgetId} />}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={pending} className="paper-send">
            {pending ? "Sending..." : "Send the letter"}
          </button>
          <p role="status" aria-live="polite" className={`min-h-6 max-w-[60ch] text-sm ${status && !status.ok ? "font-medium" : "text-mute"}`}>
            {status?.text}
          </p>
        </div>
      </form>
    </div>
  );
}
