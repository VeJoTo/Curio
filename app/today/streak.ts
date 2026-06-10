import type { DayEntry } from '@curio/shared';
import { dayKey } from './selectTopic';

type Journal = Record<string, DayEntry>;

/**
 * "YYYY-MM-DD" one calendar day earlier. `key` is always a dayKey()-produced
 * string, so the split parses cleanly. Local components, so DST-safe.
 */
export function previousDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

export function isCompletedToday(journal: Journal, today: Date): boolean {
  return Boolean(journal[dayKey(today)]);
}

/**
 * Consecutive completed days. Grace until end of day: the streak is "alive" if
 * the most recent completion is today OR yesterday; it then counts back from
 * that anchor until a gap. A last completion two+ days old reads as 0.
 */
export function computeStreak(journal: Journal, today: Date): number {
  const todayKey = dayKey(today);
  let anchor: string;
  if (journal[todayKey]) {
    anchor = todayKey;
  } else {
    const yesterday = previousDayKey(todayKey);
    if (journal[yesterday]) {
      anchor = yesterday;
    } else {
      return 0;
    }
  }

  // Terminates: `cursor` strictly decreases by one day each step and every
  // counted day must exist in the finite journal, so it stops at the first gap
  // (bounded by the number of stored entries).
  let count = 0;
  let cursor = anchor;
  while (journal[cursor]) {
    count += 1;
    cursor = previousDayKey(cursor);
  }
  return count;
}
