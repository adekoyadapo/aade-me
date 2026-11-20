// In-memory sliding-window rate limiter keyed by a string (e.g. client IP prefix).
//
// LIMITATION: state is per server instance. On serverless hosts each warm instance has its own
// map, so the effective limit is (limit x instances). It is a speed bump, not a guarantee.
// Mitigations used by callers: a global bucket (`contact:global`) and Cloudflare Turnstile,
// which is the real abuse control. No external store is used on purpose.

type Store = Map<string, number[]>;

// Persist across hot-reloads in dev
const g = globalThis as unknown as { __rateLimitStore?: Store };
const store: Store = g.__rateLimitStore ?? new Map();
g.__rateLimitStore = store;

const MAX_KEYS = 5000; // memory cap: a flood of spoofed keys cannot grow the map without bound

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): { ok: boolean; remaining: number; resetAfterMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (store.size > MAX_KEYS) {
    for (const [k, v] of store) {
      if (!v.some((ts) => ts > windowStart)) store.delete(k);
    }
    // Still full of live keys: fail safe by refusing new keys.
    if (store.size > MAX_KEYS && !store.has(key)) return { ok: false, remaining: 0, resetAfterMs: windowMs };
  }

  const recent = (store.get(key) ?? []).filter((ts) => ts > windowStart);

  if (recent.length >= limit) {
    const resetAfterMs = Math.max(0, recent[0] + windowMs - now);
    store.set(key, recent);
    return { ok: false, remaining: 0, resetAfterMs };
  }

  recent.push(now);
  store.set(key, recent);
  return { ok: true, remaining: Math.max(0, limit - recent.length), resetAfterMs: windowMs };
}
