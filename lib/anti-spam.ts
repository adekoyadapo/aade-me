type HeaderReader = { get(name: string): string | null };

/**
 * Best-effort client address. Platform headers set by the edge come first (x-real-ip on Vercel);
 * x-forwarded-for is client-influenced behind a non-overwriting proxy, so it is only a fallback.
 */
export function getClientIpFromHeaders(h: HeaderReader): string {
  const pick = (v: string | null) => (v ? v.split(",")[0].trim().slice(0, 64) : "");
  const ip = pick(h.get("x-real-ip")) || pick(h.get("cf-connecting-ip")) || pick(h.get("x-forwarded-for"));
  return ip || "unknown";
}

/** Rate-limit key: IPv4 as is, IPv6 reduced to its /64 so one host cannot rotate addresses. */
export function ipBucket(ip: string): string {
  if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":");
  return ip;
}

export function isSpamContent(message: string, senderEmail: string): boolean {
  const text = `${senderEmail}\n${message}`.toLowerCase();

  // Too many links is suspicious
  const linkCount = (message.match(/https?:\/\//gi) || []).length;
  if (linkCount > 2) return true;

  // Common spammy keywords (very small, non-exhaustive)
  const keywords = [
    "viagra",
    "cialis",
    "casino",
    "loan",
    "crypto",
    "investment",
    "forex",
    "porn",
    "escort",
    "betting",
  ];
  if (keywords.some((k) => text.includes(k))) return true;

  // Excessively long single word (often tracking blobs)
  if (/\w{80,}/.test(message)) return true;

  return false;
}
