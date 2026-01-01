# Porfolio Website

[Personal portfolio website](aade.me)

## Anti-spam and Bot Protection

- Removed Google reCAPTCHA and its dependencies.
- Added server-side honeypot validation and silent drop of bot submissions.
- Added minimum human-interaction delay check via hidden `form_ts`.
- Added IP-based rate limiting: max 3 submissions per 5 minutes.
- Basic content heuristics to drop obvious spam (excess links/keywords).
- Cloudflare Turnstile challenge added to contact form, with server-side verification.

See `components/contact.tsx`, `actions/sendEmail.ts`, and `lib/rate-limit.ts`.

## Dependency Upgrades and Security

- Upgraded framework and tooling to resolve `npm audit` issues (0 remaining):
  - `next` 16.1.x, `react` 19.x, `react-dom` 19.x
  - `resend` 6.x (use `replyTo` instead of `reply_to`)
  - `postcss` 8.5.x, `autoprefixer` 10.4.x
  - `@react-email/components` 1.x, `@react-email/tailwind` 2.x
  - Updated assorted dev deps (ESLint 9, types, icons)
- Adjusted code to match new APIs:
  - Replaced `experimental_useFormStatus` with `useFormStatus`.
  - `headers()` is now awaited in server action.
  - Next config `experimental.serverActions` expects an object.

Minimum Node.js: 18.18+ (or 20+ recommended).

## Node Version

- Project engines set to Node `>=24.9.0` in `package.json`.
- Added `.nvmrc` and `.node-version` pinned to `24.9.0`.
- Added `.npmrc` with `engine-strict=true` to enforce engines.

## Turnstile Environment Variables

Set the following environment variables:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — your Cloudflare Turnstile site key (public, used on the client).
- `TURNSTILE_SECRET_KEY` — your Cloudflare Turnstile secret key (server verification).
