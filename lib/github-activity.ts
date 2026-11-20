export type Day = { date: string; level: 0 | 1 | 2 | 3 | 4; count: number };
export type Activity = { total: number; days: Day[]; from: string; to: string; busiestMonth: string | null };

const USER = "adekoyadapo";
const REVALIDATE = 21600; // 6 hours

/**
 * Public GitHub contribution calendar for the profile, fetched on the server and cached (ISR, 6 h).
 * Source: the public contributions fragment, no auth. It counts contributions (commits, PRs, issues, reviews), not commits only.
 * Upgrade path (not implemented, never required): if GITHUB_TOKEN is set, query the GraphQL
 * `user.contributionsCollection.contributionCalendar` for exact counts. Keep the token server-side only.
 * Returns null on any failure so the page can hide the card rows.
 */
export async function getGithubActivity(): Promise<Activity | null> {
  try {
    const res = await fetch(`https://github.com/users/${USER}/contributions`, {
      next: { revalidate: REVALIDATE },
      headers: { "user-agent": "aade.me" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return parse(await res.text());
  } catch {
    return null;
  }
}

export function parse(html: string): Activity | null {
  try {
    const counts = new Map<string, number>();
    for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>\s*([^<]*?)\s*<\/tool-tip>/g)) {
      const n = /^(\d[\d,]*)\s+contribution/.exec(m[2]);
      counts.set(m[1], n ? parseInt(n[1].replace(/,/g, ""), 10) : 0);
    }
    const days: Day[] = [];
    for (const m of html.matchAll(/<td\b[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)) {
      const tag = m[0];
      const lv = /\bdata-level="([0-4])"/.exec(tag);
      const id = /\bid="([^"]+)"/.exec(tag);
      if (!lv) continue;
      const level = Number(lv[1]) as Day["level"];
      const count = id ? counts.get(id[1]) ?? (level ? 1 : 0) : level ? 1 : 0;
      days.push({ date: m[1], level, count });
    }
    days.sort((a, b) => (a.date < b.date ? -1 : 1));
    if (days.length < 300 || days.length > 380) return null;
    const head = /([\d,]+)\s+contributions?\s+in the last year/.exec(html.replace(/\s+/g, " "));
    const total = head ? parseInt(head[1].replace(/,/g, ""), 10) : days.reduce((s, d) => s + d.count, 0);
    if (!Number.isFinite(total) || total < 0) return null;
    const byMonth = new Map<string, number>();
    for (const d of days) byMonth.set(d.date.slice(0, 7), (byMonth.get(d.date.slice(0, 7)) ?? 0) + d.count);
    const best = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0];
    const busiestMonth = best && best[1] > 0
      ? new Date(best[0] + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
      : null;
    return { total, days, from: days[0].date, to: days[days.length - 1].date, busiestMonth };
  } catch {
    return null;
  }
}
