"use server";

import React from "react";
import { Resend } from "resend";
import ContactFormEmail from "@/email/contact-form-email";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders, ipBucket, isSpamContent } from "@/lib/anti-spam";

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_EMAIL = 254; // RFC 5321 path limit
const MAX_MESSAGE = 6000; // client composes reason + name + via + signature + body (body <= 4600)
const MAX_TOKEN = 2048; // Turnstile tokens are < 2048 chars
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

const GENERIC = "The message could not be sent. Please try again later.";

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[contact] TURNSTILE_SECRET_KEY is not set; refusing submissions");
    return false; // fail closed
  }
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    // Cloudflare invalidates a token after one successful verification, so replays fail here.
    const out = (await res.json()) as { success?: boolean };
    return out.success === true;
  } catch {
    return false;
  }
}

export const sendEmail = async (formData: FormData) => {
  const senderEmail = formData.get("senderEmail");
  const message = formData.get("message");
  const honeytrap = formData.get("honeytrap");
  const jsOnly = formData.get("js_only");
  const formTsRaw = formData.get("form_ts");
  const turnstileToken = formData.get("cf-turnstile-response");

  // 1) Honeypot must be empty (silent drop, no hint to bots)
  if (typeof honeytrap === "string" && honeytrap.trim().length > 0) return { data: { dropped: true } };

  // 2) Script flag
  if (jsOnly !== "1") return { data: { dropped: true } };

  // 3) Time trap: a valid, plausible render timestamp is required (fail closed)
  const now = Date.now();
  const formTs = typeof formTsRaw === "string" ? parseInt(formTsRaw, 10) : NaN;
  if (!Number.isFinite(formTs) || formTs > now + 60_000 || now - formTs < 2000 || now - formTs > 24 * 3600_000) {
    return { data: { dropped: true } };
  }

  // 4) Cheap input validation before any network call
  if (typeof senderEmail !== "string" || senderEmail.length > MAX_EMAIL || !EMAIL_RE.test(senderEmail)) {
    return { error: "Please enter a valid email address" };
  }
  if (typeof message !== "string" || message.trim().length === 0 || message.length > MAX_MESSAGE) {
    return { error: "Invalid message" };
  }
  if (!turnstileToken || typeof turnstileToken !== "string" || turnstileToken.length > MAX_TOKEN) {
    return { error: "Verification failed. Please try again." };
  }

  // 5) Rate limits: per client prefix and a global ceiling (per-instance, see lib/rate-limit.ts)
  const ip = getClientIpFromHeaders(await headers());
  if (!rateLimit(`contact:${ipBucket(ip)}`, 3, 5 * 60_000).ok || !rateLimit("contact:global", 30, 60 * 60_000).ok) {
    return { error: "Too many submissions. Please try again later." };
  }

  // 6) Cloudflare Turnstile, server side
  if (!process.env.TURNSTILE_SECRET_KEY) return { error: "Service misconfigured. Please try again later." };
  if (!(await verifyTurnstile(turnstileToken, ip))) return { error: "Verification failed. Please try again." };

  // 7) Content heuristics
  if (isSpamContent(message, senderEmail)) return { data: { dropped: true } };

  try {
    const result = await resend.emails.send({
      from: "Aade.me <no-reply@aade.me>",
      to: "adekoyadapo@gmail.com",
      subject: "Message from aade.me", // constant: user input never reaches a header
      replyTo: senderEmail, // validated above: no whitespace, CR or LF possible
      react: React.createElement(ContactFormEmail, { message, senderEmail }),
    });
    if (result.error || !result.data?.id) {
      console.error("[contact] provider rejected the send", result.error?.name ?? "unknown");
      return { error: GENERIC };
    }
    return { data: { data: { id: result.data.id } } };
  } catch {
    console.error("[contact] provider call failed");
    return { error: GENERIC };
  }
};
