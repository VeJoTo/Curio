import { TopicSchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { getTopic, theNorthernLights, todayTopic } from './topics';

describe('topic fixture', () => {
  it('the Northern Lights fixture parses against the real TopicSchema', () => {
    const result = TopicSchema.safeParse(theNorthernLights);
    expect(result.success).toBe(true);
  });

  it('getTopic returns the fixture by slug and undefined otherwise', () => {
    expect(getTopic('the-northern-lights')).toBe(theNorthernLights);
    expect(getTopic('nope')).toBeUndefined();
  });

  it('todayTopic returns a topic', () => {
    expect(todayTopic().slug).toBe('the-northern-lights');
  });
});
