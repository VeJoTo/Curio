import { TopicSchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { getAllTopics, getTopic, theNorthernLights, todayTopic } from './topics';

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
});
