export function getClientIpFromHeaders(h: any): string {
  // Try common proxy headers first
  const xff = h.get("x-forwarded-for");
  if (xff) {
    // may contain multiple, take first non-empty
    const first = xff
      .split(",")
      .map((s: string) => s.trim())
      .find(Boolean);
    if (first) return first;
  }
  const xri = h.get("x-real-ip");
  if (xri) return xri;
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
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
