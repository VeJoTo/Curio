import { describe, it, expect } from 'vitest';
import { TopicSchema, type Topic } from '../src/schemas/topic.js';
import { CategorySchema } from '../src/schemas/category.js';
import { ProfileSchema, type Profile } from '../src/schemas/profile.js';
import { DeviceSchema, type Device } from '../src/schemas/device.js';

describe('TopicSchema', () => {
  const validTopic: Topic = {
    slug: 'the-northern-lights',
    title: 'The Northern Lights',
    deck: 'A solar wind, a magnetic field, and a 100-kilometer-tall curtain of green light.',
    categorySlug: 'earth-and-sky',
    ageBand: 'all',
    status: 'published',
    publishedAt: '2026-05-20T08:00:00.000Z',
    heroImageUrl: 'https://cdn.sanity.io/.../hero.webp',
    scenesQuick: [
      { id: 'q1', imageUrl: 'https://cdn.sanity.io/.../q1.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'q2', imageUrl: 'https://cdn.sanity.io/.../q2.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'q3', imageUrl: 'https://cdn.sanity.io/.../q3.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'q4', imageUrl: 'https://cdn.sanity.io/.../q4.webp', caption: 'It starts at the sun.', motion: 'fade' }
    ],
    scenesDeep: [
      { id: 'd1', imageUrl: 'https://cdn.sanity.io/.../d1.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd2', imageUrl: 'https://cdn.sanity.io/.../d2.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd3', imageUrl: 'https://cdn.sanity.io/.../d3.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd4', imageUrl: 'https://cdn.sanity.io/.../d4.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd5', imageUrl: 'https://cdn.sanity.io/.../d5.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd6', imageUrl: 'https://cdn.sanity.io/.../d6.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd7', imageUrl: 'https://cdn.sanity.io/.../d7.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd8', imageUrl: 'https://cdn.sanity.io/.../d8.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd9', imageUrl: 'https://cdn.sanity.io/.../d9.webp', caption: 'It starts at the sun.', motion: 'fade' },
      { id: 'd10', imageUrl: 'https://cdn.sanity.io/.../d10.webp', caption: 'It starts at the sun.', motion: 'fade' }
    ],
    quizQuick: [
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' },
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' },
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' }
    ],
    quizDeep: [
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' },
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' },
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' },
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' },
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' }
    ],
    sources: ['https://nasa.gov/.../aurora']
  };

  it('parses a valid topic', () => {
    const result = TopicSchema.safeParse(validTopic);
    expect(result.success).toBe(true);
  });

  it('rejects a topic with an empty title', () => {
    const result = TopicSchema.safeParse({ ...validTopic, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects scenesQuick with fewer than 4 scenes', () => {
    const result = TopicSchema.safeParse({ ...validTopic, scenesQuick: [] });
    expect(result.success).toBe(false);
  });

  it('rejects quizQuick with non-3 question count', () => {
    const result = TopicSchema.safeParse({ ...validTopic, quizQuick: [] });
    expect(result.success).toBe(false);
  });

  it('requires at least one correct choice', () => {
    const bad = {
      ...validTopic,
      quizQuick: [{
        prompt: 'X?',
        choices: [{ text: 'a', isCorrect: false }, { text: 'b', isCorrect: false }],
        explanation: 'x'
      },
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' },
      { prompt: 'What causes the lights?', choices: [
        { text: 'Solar wind hitting the atmosphere', isCorrect: true },
        { text: 'Reflected moonlight', isCorrect: false }
      ], explanation: 'Charged solar particles excite atmospheric gases.' }]
    };
    const result = TopicSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects a slug with a leading dash', () => {
    const result = TopicSchema.safeParse({ ...validTopic, slug: '-bad' });
    expect(result.success).toBe(false);
  });

  it('rejects a slug with uppercase letters', () => {
    const result = TopicSchema.safeParse({ ...validTopic, slug: 'Bad-Slug' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty sources array', () => {
    const result = TopicSchema.safeParse({ ...validTopic, sources: [] });
    expect(result.success).toBe(false);
  });
});

describe('CategorySchema', () => {
  it('parses a valid category', () => {
    const result = CategorySchema.safeParse({
      slug: 'earth-and-sky',
      name: 'Earth & Sky',
      colorToken: 'teal',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown colorToken', () => {
    const result = CategorySchema.safeParse({ slug: 'x', name: 'X', colorToken: 'magenta' });
    expect(result.success).toBe(false);
  });
});

describe('ProfileSchema', () => {
  const validProfile: Profile = {
    deviceId: 'd1a2b3c4-1111-2222-3333-444455556666',
    name: 'Vera',
    avatarKey: 'avatar-04',
    ageBand: '18-24',
    interests: ['earth-and-sky', 'biology'],
    dailyTime: '08:00',
    defaultDepth: 'quick',
    notifPermission: 'granted',
  };

  it('parses a valid profile', () => {
    expect(ProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it('rejects dailyTime in 12h format', () => {
    expect(ProfileSchema.safeParse({ ...validProfile, dailyTime: '8:00 AM' }).success).toBe(false);
  });

  it('rejects empty interests', () => {
    expect(ProfileSchema.safeParse({ ...validProfile, interests: [] }).success).toBe(false);
  });

  it('allows missing name (skip on onboarding 1.2)', () => {
    const { name: _, ...withoutName } = validProfile;
    expect(ProfileSchema.safeParse(withoutName).success).toBe(true);
  });
});

describe('DeviceSchema', () => {
  const validDevice: Device = {
    id: 'd1a2b3c4-1111-2222-3333-444455556666',
    pushToken: 'ExponentPushToken[xxxxxxxx]',
    prefs: {
      categories: ['earth-and-sky'],
      localTime: '08:00',
      tz: 'Europe/Oslo',
      defaultDepth: 'quick',
    },
  };

  it('parses a valid device row', () => {
    expect(DeviceSchema.safeParse(validDevice).success).toBe(true);
  });

  it('rejects malformed push token', () => {
    expect(DeviceSchema.safeParse({ ...validDevice, pushToken: 'fcm-xyz' }).success).toBe(false);
  });
});
