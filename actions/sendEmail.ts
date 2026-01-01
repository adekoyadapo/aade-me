"use server";

import React from "react";
import { Resend } from "resend";
import { validateString, getErrorMessage } from "@/lib/utils";
import ContactFormEmail from "@/email/contact-form-email";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders, isSpamContent } from "@/lib/anti-spam";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (formData: FormData) => {
  const senderEmail = formData.get("senderEmail");
  const message = formData.get("message");
  const honeytrap = formData.get("honeytrap");
  const jsOnly = formData.get("js_only");
  const formTsRaw = formData.get("form_ts");
  const turnstileToken = formData.get("cf-turnstile-response");

  // Lightweight bot checks (do not disclose granular reasons to client)
  // 1) Honeypot must be empty
  if (typeof honeytrap === "string" && honeytrap.trim().length > 0) {
    // Silently drop to avoid helping bot adaptation
    console.warn("[contact] dropped submission due to honeypot");
    return { data: { dropped: true } };
  }

  // 2) Require JS set flag (bots without JS won't include this)
  if (jsOnly !== "1") {
    console.warn("[contact] dropped submission due to missing js_only flag");
    return { data: { dropped: true } };
  }

  // 3) Human interaction time: require a minimal delay from render
  const now = Date.now();
  const formTs = typeof formTsRaw === "string" ? parseInt(formTsRaw, 10) : 0;
  if (!Number.isNaN(formTs) && formTs > 0) {
    const minDelayMs = 2000; // 2 seconds
    if (now - formTs < minDelayMs) {
      console.warn("[contact] dropped submission due to too-fast submit");
      return { data: { dropped: true } };
    }
  }

  // 4) Rate limit by client IP
  const ip = getClientIpFromHeaders(await headers());
  const { ok: allowed } = rateLimit(`contact:${ip}`, 3, 5 * 60_000); // 3 per 5 minutes
  if (!allowed) {
    console.warn(`(rate-limit) blocked submission from ${ip}`);
    return { error: "Too many submissions. Please try again later." };
  }

  // 4b) Cloudflare Turnstile verification
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("Turnstile secret not configured. Set TURNSTILE_SECRET_KEY.");
    return { error: "Service misconfigured. Please try again later." };
  }
  if (!turnstileToken || typeof turnstileToken !== "string") {
    return { error: "Verification failed. Please try again." };
  }
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: turnstileToken,
        remoteip: ip,
      }),
      // Avoid caching
      cache: "no-store",
    });
    const out = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    if (!out.success) {
      console.warn("[contact] Turnstile verification failed", out["error-codes"]);
      return { error: "Verification failed. Please try again." };
    }
  } catch (e) {
    console.error("[contact] Turnstile verification error", e);
    return { error: "Verification failed. Please try again." };
  }

  // Simple server-side validation
  if (!validateString(senderEmail, 500)) {
    return {
      error: "Invalid sender email",
    };
  }
  // rudimentary email format check
  const email = String(senderEmail);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address" };
  }
  if (!validateString(message, 5000)) {
    return {
      error: "Invalid message",
    };
  }

  // 5) Basic spam heuristics
  if (isSpamContent(String(message), String(senderEmail))) {
    console.warn("[contact] dropped submission due to spam heuristics");
    return { data: { dropped: true } };
  }

  let data;
  try {
    data = await resend.emails.send({
      from: "Aade.me <no-reply@aade.me>",
      to: "adekoyadapo@gmail.com",
      subject: "New contact form Entry",
      replyTo: String(senderEmail),
      react: React.createElement(ContactFormEmail, {
        message: message,
        senderEmail: senderEmail,
      }),
    });
  } catch (error: unknown) {
    return {
      error: getErrorMessage(error),
    };
  }

  return {
    data,
  };
};
