import type { Topic } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { dayKey, selectDailyTopic } from './selectTopic';

// The selector only reads slug/categorySlug/status; a cast partial keeps tests focused.
function t(slug: string, categorySlug: string, status: Topic['status'] = 'published'): Topic {
  return { slug, categorySlug, status } as Topic;
}

const DATE = new Date(2026, 5, 8); // local 2026-06-08

describe('dayKey', () => {
  it('formats the local calendar day as zero-padded YYYY-MM-DD', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('is stable across times within the same calendar day', () => {
    expect(dayKey(new Date(2026, 5, 8, 0, 1))).toBe(dayKey(new Date(2026, 5, 8, 23, 59)));
  });
});

describe('selectDailyTopic', () => {
  const a = t('aurora', 'earth-and-sky');
  const b = t('moon', 'space');
  const c = t('mural', 'art');

  it('prefers a topic whose category matches an interest', () => {
    const picked = selectDailyTopic({ interests: ['space'], date: DATE, topics: [a, b, c] });
    expect(picked?.slug).toBe('moon');
  });

  it('never returns a non-matching topic when matches exist', () => {
    for (let d = 1; d <= 28; d++) {
      const picked = selectDailyTopic({
        interests: ['space', 'art'],
        date: new Date(2026, 0, d),
        topics: [a, b, c],
      });
      expect(['space', 'art']).toContain(picked?.categorySlug);
    }
  });

  it('falls back to all published topics when nothing matches', () => {
    const picked = selectDailyTopic({ interests: ['history'], date: DATE, topics: [a, b, c] });
    expect([a, b, c]).toContain(picked);
  });

  it('ignores non-published topics', () => {
    const draftMoon = t('moon-draft', 'space', 'draft');
    const picked = selectDailyTopic({
      interests: ['space'],
      date: DATE,
      topics: [a, draftMoon, b],
    });
    expect(picked?.slug).toBe('moon'); // draftMoon excluded, only published 'moon' matches
  });

  it('returns undefined when there are no published topics', () => {
    expect(selectDailyTopic({ interests: [], date: DATE, topics: [] })).toBeUndefined();
    expect(
      selectDailyTopic({ interests: ['space'], date: DATE, topics: [t('x', 'space', 'draft')] }),
    ).toBeUndefined();
  });

  it('is deterministic within a calendar day', () => {
    const morning = selectDailyTopic({ interests: [], date: new Date(2026, 5, 8, 7), topics: [a, b, c] });
    const night = selectDailyTopic({ interests: [], date: new Date(2026, 5, 8, 22), topics: [a, b, c] });
    expect(morning?.slug).toBe(night?.slug);
  });

  it('changes the pick across days', () => {
    const slugs = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const picked = selectDailyTopic({ interests: [], date: new Date(2026, 0, d), topics: [a, b, c] });
      if (picked) slugs.add(picked.slug);
    }
    expect(slugs.size).toBeGreaterThan(1);
  });

  it('picks the same topic regardless of input order (slug-sorted)', () => {
    const forward = selectDailyTopic({ interests: [], date: DATE, topics: [a, b, c] });
    const shuffled = selectDailyTopic({ interests: [], date: DATE, topics: [c, a, b] });
    expect(forward?.slug).toBe(shuffled?.slug);
  });
});
