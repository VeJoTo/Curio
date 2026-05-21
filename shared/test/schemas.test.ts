import { describe, it, expect } from 'vitest';
import { TopicSchema, type Topic } from '../src/schemas/topic.js';

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
});
