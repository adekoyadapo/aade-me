// Simple in-memory sliding-window rate limiter keyed by a string (e.g., client IP).
// Note: In serverless environments memory may not persist across invocations.

type Store = Map<string, number[]>;

// Persist across hot-reloads in dev
const g = globalThis as unknown as { __rateLimitStore?: Store };
const store: Store = g.__rateLimitStore ?? new Map();
g.__rateLimitStore = store;

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): { ok: boolean; remaining: number; resetAfterMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const arr = store.get(key) ?? [];
  // prune old timestamps
  const recent = arr.filter((ts) => ts > windowStart);

  if (recent.length >= limit) {
    const resetAfterMs = Math.max(0, recent[0] + windowMs - now);
    store.set(key, recent);
    return { ok: false, remaining: 0, resetAfterMs };
  }

  recent.push(now);
  store.set(key, recent);
  return { ok: true, remaining: Math.max(0, limit - recent.length), resetAfterMs: windowMs };
}

