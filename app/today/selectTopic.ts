import type { Topic } from '@curio/shared';

export interface SelectArgs {
  /** Category slugs the user chose during onboarding. */
  interests: string[];
  date: Date;
  topics: Topic[];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar day as a stable "YYYY-MM-DD" key. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** djb2 string hash → unsigned 32-bit int. Deterministic. */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0; // h * 33 + charCode, kept in 32 bits
  }
  return h >>> 0;
}

/**
 * Pick the day's topic. Strict preference: rotate only among published topics whose
 * category matches an interest; fall back to all published topics when none match.
 * Deterministic within a calendar day, varies day to day. Pure — no Date.now / catalog.
 */
export function selectDailyTopic({ interests, date, topics }: SelectArgs): Topic | undefined {
  const published = topics.filter((t) => t.status === 'published');
  const matching = published.filter((t) => interests.includes(t.categorySlug));
  const pool = matching.length > 0 ? matching : published;
  if (pool.length === 0) return undefined;

  const sorted = [...pool].sort((x, y) => x.slug.localeCompare(y.slug));
  const idx = hashString(dayKey(date)) % sorted.length;
  return sorted[idx];
}
