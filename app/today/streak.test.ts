import type { DayEntry } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { computeStreak, isCompletedToday, previousDayKey } from './streak';

function entry(date: string): DayEntry {
  return {
    date,
    slug: 't',
    score: 1,
    total: 1,
    reflection: '',
    completedAt: `${date}T08:00:00.000Z`,
  };
}
function journalOf(...dates: string[]): Record<string, DayEntry> {
  return Object.fromEntries(dates.map((d) => [d, entry(d)]));
}

// Thu 2026-06-11; prior days 06-10, 06-09, 06-08.
const today = new Date(2026, 5, 11);

describe('previousDayKey', () => {
  it('steps back one day, across month and year boundaries', () => {
    expect(previousDayKey('2026-06-11')).toBe('2026-06-10');
    expect(previousDayKey('2026-06-01')).toBe('2026-05-31');
    expect(previousDayKey('2026-01-01')).toBe('2025-12-31');
  });
});

describe('isCompletedToday', () => {
  it('is true only when today has an entry', () => {
    expect(isCompletedToday(journalOf('2026-06-11'), today)).toBe(true);
    expect(isCompletedToday(journalOf('2026-06-10'), today)).toBe(false);
    expect(isCompletedToday({}, today)).toBe(false);
  });
});

describe('computeStreak', () => {
  it('is 0 for an empty journal', () => {
    expect(computeStreak({}, today)).toBe(0);
  });

  it('is 1 on the first day of use (today done, no prior history)', () => {
    expect(computeStreak(journalOf('2026-06-11'), today)).toBe(1);
  });

  it('counts today plus an unbroken prior run', () => {
    expect(
      computeStreak(journalOf('2026-06-11', '2026-06-10', '2026-06-09', '2026-06-08'), today),
    ).toBe(4);
  });

  it('stays alive on yesterday (grace until end of day)', () => {
    expect(computeStreak(journalOf('2026-06-10', '2026-06-09', '2026-06-08'), today)).toBe(3);
  });

  it('is 0 once the last completion is two days ago', () => {
    expect(computeStreak(journalOf('2026-06-09', '2026-06-08'), today)).toBe(0);
  });

  it('counts only the run ending at the anchor', () => {
    // 06-10 present, 06-09 missing -> run from today is 06-11, 06-10 = 2.
    expect(computeStreak(journalOf('2026-06-11', '2026-06-10', '2026-06-08'), today)).toBe(2);
  });
});
