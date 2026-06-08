import type { Profile, Scene, Topic } from '@curio/shared';
import { selectDailyTopic } from '../today/selectTopic';

// Palette hexes used as scene accents (kept in sync with app/theme/tokens.ts).
const ACCENT = {
  teal: '#A8DBC6',
  rose: '#F6A6B2',
  mustard: '#F2C14E',
  indigo: '#6E4FE8',
} as const;

const PLACEHOLDER_IMG = 'https://cdn.curio.example/placeholder.webp';

function scene(id: string, caption: string, accentColor: string): Scene {
  return { id, imageUrl: PLACEHOLDER_IMG, caption, accentColor, motion: 'fade' };
}

export const theNorthernLights: Topic = {
  slug: 'the-northern-lights',
  title: 'The Northern Lights',
  deck: 'A solar wind, a magnetic field, and a 100-kilometre-tall curtain of green light.',
  categorySlug: 'earth-and-sky',
  ageBand: 'all',
  status: 'published',
  publishedAt: '2026-06-03T08:00:00.000Z',
  heroImageUrl: PLACEHOLDER_IMG,
  scenesQuick: [
    scene(
      'q1',
      'It starts at the sun — a gust of charged particles races outward.',
      ACCENT.mustard,
    ),
    scene(
      'q2',
      "The wind slams into Earth's magnetic field and is funnelled toward the poles.",
      ACCENT.rose,
    ),
    scene('q3', 'High in the sky, the particles crash into oxygen and nitrogen.', ACCENT.teal),
    scene(
      'q4',
      'Each gas glows its own colour — green and red from oxygen, blue from nitrogen.',
      ACCENT.indigo,
    ),
    scene('q5', 'The result: a shifting curtain of light, kilometres tall.', ACCENT.teal),
  ],
  scenesDeep: [
    scene(
      'd1',
      'The sun constantly sheds a stream of charged particles — the solar wind.',
      ACCENT.mustard,
    ),
    scene(
      'd2',
      'A solar flare or coronal hole can send a far stronger gust our way.',
      ACCENT.mustard,
    ),
    scene(
      'd3',
      'Days later it reaches Earth and meets the magnetosphere — our magnetic shield.',
      ACCENT.rose,
    ),
    scene(
      'd4',
      'The field deflects most of it, but funnels some toward the magnetic poles.',
      ACCENT.rose,
    ),
    scene(
      'd5',
      'Guided down field lines, particles plunge into the upper atmosphere.',
      ACCENT.indigo,
    ),
    scene('d6', 'Around 100 km up, they collide with oxygen atoms.', ACCENT.teal),
    scene('d7', 'The collisions kick electrons into higher-energy states.', ACCENT.teal),
    scene('d8', 'As electrons fall back, they release the energy as light.', ACCENT.indigo),
    scene('d9', 'Oxygen at ~100 km glows green; far higher it glows deep red.', ACCENT.teal),
    scene('d10', "Nitrogen adds blues and purples at the curtain's lower edge.", ACCENT.indigo),
    scene(
      'd11',
      "Earth's field lines shape the light into rippling curtains and arcs.",
      ACCENT.rose,
    ),
    scene('d12', 'The same physics paints aurorae on Jupiter, Saturn, and beyond.', ACCENT.mustard),
  ],
  quizQuick: [
    {
      prompt: 'What causes the northern lights?',
      choices: [
        { text: 'Charged particles from the sun hitting the atmosphere', isCorrect: true },
        { text: 'Sunlight reflecting off polar ice', isCorrect: false },
        { text: 'City lights scattering in the clouds', isCorrect: false },
      ],
      explanation: 'Charged solar particles excite atmospheric gases, which release light.',
    },
    {
      prompt: "What sets the aurora's colour?",
      choices: [
        { text: 'Which gas the particles hit, and how high up', isCorrect: true },
        { text: 'The temperature of the solar wind', isCorrect: false },
        { text: 'Reflected light from the polar ice', isCorrect: false },
      ],
      explanation: 'Green is oxygen near 100 km; red is oxygen higher up; blue/purple is nitrogen.',
    },
    {
      prompt: 'Why do the lights cluster near the poles?',
      choices: [
        { text: "Earth's magnetic field funnels particles there", isCorrect: true },
        { text: 'The poles are closest to the sun', isCorrect: false },
        { text: 'Cold air glows more easily', isCorrect: false },
      ],
      explanation: 'The magnetosphere guides charged particles down toward the magnetic poles.',
    },
  ],
  quizDeep: [
    {
      prompt: 'What is the solar wind?',
      choices: [
        { text: 'A stream of charged particles flowing from the sun', isCorrect: true },
        { text: 'Heat radiating from the sun', isCorrect: false },
        { text: 'Wind on the surface of the sun', isCorrect: false },
      ],
      explanation: 'The sun continuously sheds charged particles into space.',
    },
    {
      prompt: 'What protects Earth from most of the solar wind?',
      choices: [
        { text: 'The magnetosphere', isCorrect: true },
        { text: 'The ozone layer', isCorrect: false },
        { text: 'The jet stream', isCorrect: false },
      ],
      explanation: "Earth's magnetic field deflects most incoming charged particles.",
    },
    {
      prompt: 'Where do the light-producing collisions happen?',
      choices: [
        { text: 'In the upper atmosphere, around 100 km up', isCorrect: true },
        { text: 'At ground level', isCorrect: false },
        { text: 'On the surface of the sun', isCorrect: false },
      ],
      explanation: 'Particles collide with atmospheric gases high above the surface.',
    },
    {
      prompt: 'Why does oxygen glow green?',
      choices: [
        { text: 'Excited electrons release green light as they settle', isCorrect: true },
        { text: 'Oxygen is naturally green', isCorrect: false },
        { text: 'It reflects green starlight', isCorrect: false },
      ],
      explanation: 'Energised oxygen at ~100 km emits a characteristic green wavelength.',
    },
    {
      prompt: 'What adds blue and purple to the display?',
      choices: [
        { text: 'Nitrogen', isCorrect: true },
        { text: 'Helium', isCorrect: false },
        { text: 'Water vapour', isCorrect: false },
      ],
      explanation: "Nitrogen emits blue and purple light, often at the curtain's lower edge.",
    },
    {
      prompt: 'Do other planets have aurorae?',
      choices: [
        { text: 'Yes — including Jupiter and Saturn', isCorrect: true },
        { text: 'No, only Earth', isCorrect: false },
        { text: 'Only planets without moons', isCorrect: false },
      ],
      explanation: 'Any planet with a magnetic field and atmosphere can host aurorae.',
    },
  ],
  sources: ['https://www.nasa.gov/aurora'],
};

const TOPICS: Record<string, Topic> = {
  [theNorthernLights.slug]: theNorthernLights,
};

export function getTopic(slug: string): Topic | undefined {
  return TOPICS[slug];
}

export function getAllTopics(): Topic[] {
  return Object.values(TOPICS);
}

export function todayTopic(profile?: Profile, date = new Date()): Topic {
  return (
    selectDailyTopic({
      interests: profile?.interests ?? [],
      date,
      topics: getAllTopics(),
    }) ?? theNorthernLights // guaranteed fallback: the catalog always has at least this topic
  );
}
