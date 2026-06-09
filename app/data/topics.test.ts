import { TopicSchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { getCategory } from './categories';
import { estimateMinutes, getAllTopics, getTopic, theNorthernLights, todayTopic } from './topics';

describe('topic fixture', () => {
  it('the Northern Lights fixture parses against the real TopicSchema', () => {
    const result = TopicSchema.safeParse(theNorthernLights);
    expect(result.success).toBe(true);
  });

  it('getTopic returns the fixture by slug and undefined otherwise', () => {
    expect(getTopic('the-northern-lights')).toBe(theNorthernLights);
    expect(getTopic('nope')).toBeUndefined();
  });

  it('getAllTopics includes the Northern Lights fixture', () => {
    expect(getAllTopics()).toContain(theNorthernLights);
  });

  it('todayTopic returns a published topic from the catalog', () => {
    const date = new Date(2026, 5, 8);
    const topic = todayTopic(undefined, date);
    expect(getAllTopics()).toContain(topic);
    expect(topic.status).toBe('published');
  });

  it('todayTopic is deterministic for a given profile and date', () => {
    const date = new Date(2026, 5, 8);
    const profile = { interests: ['space'] } as Parameters<typeof todayTopic>[0];
    expect(todayTopic(profile, date).slug).toBe(todayTopic(profile, date).slug);
  });

  it('todayTopic honors the profile interests against the real catalog', () => {
    const date = new Date(2026, 5, 8);
    const spaceProfile = { interests: ['space'] } as Parameters<typeof todayTopic>[0];
    expect(todayTopic(spaceProfile, date).categorySlug).toBe('space');

    const bioProfile = { interests: ['biology'] } as Parameters<typeof todayTopic>[0];
    expect(todayTopic(bioProfile, date).categorySlug).toBe('biology');
  });
});

describe('topic catalog', () => {
  it('contains four published topics', () => {
    const topics = getAllTopics();
    expect(topics).toHaveLength(4);
    expect(topics.every((t) => t.status === 'published')).toBe(true);
  });

  it('every catalog topic parses against the real TopicSchema', () => {
    for (const topic of getAllTopics()) {
      const result = TopicSchema.safeParse(topic);
      expect(result.success, `${topic.slug} failed schema`).toBe(true);
    }
  });

  it('catalog topics have unique slugs', () => {
    const slugs = getAllTopics().map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every catalog topic has a heroEmoji', () => {
    for (const topic of getAllTopics()) {
      expect(topic.heroEmoji, `${topic.slug} missing heroEmoji`).toBeTruthy();
    }
  });

  it('every catalog topic has a categorySlug known to CATEGORIES', () => {
    for (const topic of getAllTopics()) {
      expect(
        getCategory(topic.categorySlug),
        `${topic.slug} has unknown categorySlug`,
      ).toBeDefined();
    }
  });
});

describe('estimateMinutes', () => {
  it('grows with scene and question counts', () => {
    expect(estimateMinutes(5, 3)).toBeLessThan(estimateMinutes(12, 6));
  });

  it('is at least one minute', () => {
    expect(estimateMinutes(0, 0)).toBe(1);
  });

  it('gives a sensible quick-read estimate (not the old bogus ~12 min)', () => {
    expect(estimateMinutes(5, 3)).toBeLessThanOrEqual(3);
  });
});
