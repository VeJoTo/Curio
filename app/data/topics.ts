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
  heroEmoji: '🌌',
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

export const howYourHeartBeats: Topic = {
  slug: 'how-your-heart-beats',
  title: 'How Your Heart Beats',
  deck: 'A fist-sized muscle, an electrical spark, and 100,000 beats a day that never ask permission.',
  categorySlug: 'biology',
  ageBand: 'all',
  status: 'published',
  publishedAt: '2026-06-04T08:00:00.000Z',
  heroEmoji: '❤️',
  heroImageUrl: PLACEHOLDER_IMG,
  scenesQuick: [
    scene(
      'q1',
      'Your heart is a muscle about the size of your fist, just left of centre.',
      ACCENT.rose,
    ),
    scene('q2', 'It has four chambers — two to receive blood, two to push it out.', ACCENT.teal),
    scene(
      'q3',
      'A tiny patch of cells fires an electrical spark, setting the rhythm.',
      ACCENT.mustard,
    ),
    scene('q4', 'The spark spreads, and the chambers squeeze in a precise order.', ACCENT.indigo),
    scene('q5', 'Lub-dub: that double thump is two sets of valves snapping shut.', ACCENT.rose),
  ],
  scenesDeep: [
    scene(
      'd1',
      'The heart sits near the middle of the chest, its lower tip tilting left, wrapped in a protective sac.',
      ACCENT.rose,
    ),
    scene(
      'd2',
      'It is divided into four chambers: two atria on top, two ventricles below.',
      ACCENT.teal,
    ),
    scene(
      'd3',
      'The right side collects oxygen-poor blood and sends it to the lungs.',
      ACCENT.indigo,
    ),
    scene(
      'd4',
      'The left side receives oxygen-rich blood and pumps it to the whole body.',
      ACCENT.rose,
    ),
    scene(
      'd5',
      'Each beat starts in the sinoatrial node, a cluster of cells in the right atrium.',
      ACCENT.mustard,
    ),
    scene(
      'd6',
      'These cells fire on their own — no signal from the brain required.',
      ACCENT.mustard,
    ),
    scene(
      'd7',
      'The spark sweeps across the atria, making them contract and top up the ventricles.',
      ACCENT.teal,
    ),
    scene(
      'd8',
      'It pauses at a relay, the atrioventricular node, for a split second.',
      ACCENT.indigo,
    ),
    scene('d9', "Then it races down special fibres into the ventricles' walls.", ACCENT.indigo),
    scene(
      'd10',
      'The ventricles squeeze hard, driving blood to the lungs and the body.',
      ACCENT.rose,
    ),
    scene(
      'd11',
      'Two sets of valves snap shut in turn to stop blood flowing backward.',
      ACCENT.teal,
    ),
    scene(
      'd12',
      'That closing is the heartbeat you hear — about 100,000 times a day.',
      ACCENT.rose,
    ),
  ],
  quizQuick: [
    {
      prompt: "What sets the heart's rhythm?",
      choices: [
        {
          text: 'A patch of cells called the sinoatrial node fires an electrical spark',
          isCorrect: true,
        },
        { text: 'Signals sent from the brain with every beat', isCorrect: false },
        { text: 'The lungs pushing air into the chest', isCorrect: false },
      ],
      explanation: 'The sinoatrial node fires on its own, pacing the heart without the brain.',
    },
    {
      prompt: 'How many chambers does the heart have?',
      choices: [
        { text: 'Four — two atria and two ventricles', isCorrect: true },
        { text: 'Two — one for each lung', isCorrect: false },
        { text: 'One large muscular sac', isCorrect: false },
      ],
      explanation: 'Two atria receive blood; two ventricles pump it out.',
    },
    {
      prompt: "What makes the 'lub-dub' sound?",
      choices: [
        { text: 'Heart valves snapping shut', isCorrect: true },
        { text: 'Blood rushing through the lungs', isCorrect: false },
        { text: 'The muscle stretching as it fills', isCorrect: false },
      ],
      explanation: 'Each thump is a set of valves closing to stop backflow.',
    },
  ],
  quizDeep: [
    {
      prompt: 'Where does each heartbeat begin?',
      choices: [
        { text: 'In the sinoatrial node, in the right atrium', isCorrect: true },
        { text: 'In the left ventricle', isCorrect: false },
        { text: 'In the brain stem', isCorrect: false },
      ],
      explanation: "The sinoatrial node is the heart's natural pacemaker.",
    },
    {
      prompt: 'What does the right side of the heart do?',
      choices: [
        { text: 'Sends oxygen-poor blood to the lungs', isCorrect: true },
        { text: 'Pumps oxygen-rich blood to the body', isCorrect: false },
        { text: 'Stores blood between beats', isCorrect: false },
      ],
      explanation: 'The right side routes blood to the lungs to pick up oxygen.',
    },
    {
      prompt: 'Why does the signal pause at the atrioventricular node?',
      choices: [
        { text: 'To let the ventricles fill before they contract', isCorrect: true },
        { text: 'To rest the heart between beats', isCorrect: false },
        { text: 'To cool the electrical signal', isCorrect: false },
      ],
      explanation: 'The brief delay lets the ventricles fill completely first.',
    },
    {
      prompt: 'What do the valves do?',
      choices: [
        { text: 'Stop blood from flowing backward', isCorrect: true },
        { text: 'Generate the electrical spark', isCorrect: false },
        { text: 'Add oxygen to the blood', isCorrect: false },
      ],
      explanation: 'Valves act as one-way doors between chambers.',
    },
    {
      prompt: 'Does the heart need the brain to keep beating?',
      choices: [
        { text: 'No — its own cells can generate the rhythm', isCorrect: true },
        { text: 'Yes — every beat is a brain command', isCorrect: false },
        { text: 'Only during sleep', isCorrect: false },
      ],
      explanation: 'The sinoatrial node fires independently of the brain.',
    },
    {
      prompt: 'Roughly how many times does the heart beat in a day?',
      choices: [
        { text: 'About 100,000 times', isCorrect: true },
        { text: 'About 1,000 times', isCorrect: false },
        { text: 'About 10 million times', isCorrect: false },
      ],
      explanation: 'Around 100,000 beats a day, every day of your life.',
    },
  ],
  sources: ['https://www.nhlbi.nih.gov/health/heart'],
};

export const whyTheMoonHasPhases: Topic = {
  slug: 'why-the-moon-has-phases',
  title: 'Why the Moon Has Phases',
  deck: 'The Moon makes no light of its own — what changes is how much of its sunlit half we can see.',
  categorySlug: 'space',
  ageBand: 'all',
  status: 'published',
  publishedAt: '2026-06-05T08:00:00.000Z',
  heroEmoji: '🌙',
  heroImageUrl: PLACEHOLDER_IMG,
  scenesQuick: [
    scene('q1', "The Moon doesn't glow on its own — it reflects sunlight.", ACCENT.mustard),
    scene('q2', 'Half of the Moon is always lit; half is always dark.', ACCENT.indigo),
    scene(
      'q3',
      'As the Moon orbits Earth, we see that lit half from changing angles.',
      ACCENT.teal,
    ),
    scene(
      'q4',
      "Sometimes we face the lit side, sometimes the dark — that's the phase.",
      ACCENT.indigo,
    ),
    scene('q5', 'A full cycle, new moon to new moon, takes about 29.5 days.', ACCENT.rose),
  ],
  scenesDeep: [
    scene('d1', 'The Moon produces no light of its own; it only reflects the Sun.', ACCENT.mustard),
    scene('d2', 'At any moment, the Sun lights exactly one half of the Moon.', ACCENT.mustard),
    scene('d3', "The other half is in shadow — the Moon's own night.", ACCENT.indigo),
    scene('d4', 'The Moon circles Earth roughly once a month.', ACCENT.teal),
    scene('d5', 'As it orbits, our view of the sunlit half keeps shifting.', ACCENT.teal),
    scene(
      'd6',
      'At new moon, the lit side faces away from us, so the Moon looks dark.',
      ACCENT.indigo,
    ),
    scene('d7', 'A few days later a thin crescent of the lit side comes into view.', ACCENT.rose),
    scene(
      'd8',
      'At first quarter, exactly half the Moon’s face is lit — a half-moon.',
      ACCENT.teal,
    ),
    scene('d9', 'The Moon waxes — the bright part grows night after night.', ACCENT.mustard),
    scene('d10', 'At full moon, we face the entire sunlit half.', ACCENT.rose),
    scene(
      'd11',
      'Then it wanes, shrinking back through gibbous, quarter, and crescent.',
      ACCENT.indigo,
    ),
    scene('d12', 'New moon to new moon takes about 29.5 days — one lunar month.', ACCENT.rose),
  ],
  quizQuick: [
    {
      prompt: "Where does the Moon's light come from?",
      choices: [
        { text: 'It reflects light from the Sun', isCorrect: true },
        { text: 'It glows from heat inside it', isCorrect: false },
        { text: "It reflects light from Earth's cities", isCorrect: false },
      ],
      explanation: 'The Moon makes no light; it reflects sunlight.',
    },
    {
      prompt: 'Why do we see different phases?',
      choices: [
        { text: "Our view of the Moon's sunlit half changes as it orbits Earth", isCorrect: true },
        { text: "Earth's shadow covers part of the Moon each night", isCorrect: false },
        { text: 'Clouds hide part of the Moon', isCorrect: false },
      ],
      explanation: 'Phases come from the changing angle on the lit half, not a shadow.',
    },
    {
      prompt: 'How long is one full cycle of phases?',
      choices: [
        { text: 'About 29.5 days', isCorrect: true },
        { text: 'Exactly 7 days', isCorrect: false },
        { text: 'About 365 days', isCorrect: false },
      ],
      explanation: 'New moon to new moon takes roughly 29.5 days.',
    },
  ],
  quizDeep: [
    {
      prompt: 'How much of the Moon is sunlit at any time?',
      choices: [
        { text: 'Exactly half', isCorrect: true },
        { text: 'All of it', isCorrect: false },
        { text: 'It varies from none to all', isCorrect: false },
      ],
      explanation: 'The Sun always lights one half; we just see it from different angles.',
    },
    {
      prompt: 'What is a new moon?',
      choices: [
        {
          text: 'When the lit half faces away from Earth, so the Moon looks dark',
          isCorrect: true,
        },
        { text: "When Earth's shadow fully covers the Moon", isCorrect: false },
        { text: 'When the Moon is closest to Earth', isCorrect: false },
      ],
      explanation: 'At new moon the sunlit side points away from us.',
    },
    {
      prompt: "What does 'waxing' mean?",
      choices: [
        { text: 'The visible lit portion is growing', isCorrect: true },
        { text: 'The Moon is moving closer', isCorrect: false },
        { text: 'The Moon is fully dark', isCorrect: false },
      ],
      explanation: 'Waxing is the lit part increasing toward full.',
    },
    {
      prompt: 'What causes a full moon?',
      choices: [
        { text: 'We face the entire sunlit half of the Moon', isCorrect: true },
        { text: 'The Moon passes behind the Sun', isCorrect: false },
        { text: 'The Moon stops rotating', isCorrect: false },
      ],
      explanation: 'At full moon the whole lit side faces Earth.',
    },
    {
      prompt: "Are the Moon's phases caused by Earth's shadow?",
      choices: [
        { text: "No — that's a lunar eclipse, which is different", isCorrect: true },
        { text: 'Yes, the shadow makes every phase', isCorrect: false },
        { text: 'Only the crescent is the shadow', isCorrect: false },
      ],
      explanation: "Phases come from viewing angle; Earth's shadow causes eclipses.",
    },
    {
      prompt: 'How long does the Moon take to cycle through all its phases?',
      choices: [
        { text: 'About 29.5 days', isCorrect: true },
        { text: 'About 24 hours', isCorrect: false },
        { text: 'About 12 days', isCorrect: false },
      ],
      explanation: 'One full phase cycle is roughly 29.5 days.',
    },
  ],
  sources: ['https://science.nasa.gov/moon/moon-phases/'],
};

export const howNoiseCancellingWorks: Topic = {
  slug: 'how-noise-cancelling-works',
  title: 'How Noise-Cancelling Works',
  deck: 'To erase a sound, play its exact opposite — a wave that meets the noise and flattens it.',
  categorySlug: 'how-things-work',
  ageBand: 'all',
  status: 'published',
  publishedAt: '2026-06-06T08:00:00.000Z',
  heroEmoji: '🎧',
  heroImageUrl: PLACEHOLDER_IMG,
  scenesQuick: [
    scene('q1', 'Sound is a wave — a pattern of pressure rippling through the air.', ACCENT.teal),
    scene(
      'q2',
      "Two waves can add up, or cancel out if they're perfectly opposite.",
      ACCENT.mustard,
    ),
    scene(
      'q3',
      'Noise-cancelling headphones listen to the noise around you with a tiny mic.',
      ACCENT.indigo,
    ),
    scene(
      'q4',
      'They generate the opposite wave in microseconds and play it into your ear.',
      ACCENT.mustard,
    ),
    scene('q5', 'The two waves meet, flatten each other, and the noise fades.', ACCENT.teal),
  ],
  scenesDeep: [
    scene('d1', 'Sound travels as waves of high and low air pressure.', ACCENT.teal),
    scene('d2', 'When two waves line up crest to crest, they add — louder.', ACCENT.mustard),
    scene(
      'd3',
      "When one wave's crest meets another's trough, they cancel — quieter.",
      ACCENT.indigo,
    ),
    scene('d4', 'Noise-cancelling headphones exploit that cancelling on purpose.', ACCENT.mustard),
    scene('d5', 'A tiny microphone samples the unwanted sound around you.', ACCENT.indigo),
    scene('d6', 'A chip measures the incoming wave many thousands of times a second.', ACCENT.teal),
    scene('d7', "It calculates the exact opposite, or 'anti-noise', wave.", ACCENT.mustard),
    scene(
      'd8',
      'A speaker plays that anti-noise into your ear within a fraction of a millisecond.',
      ACCENT.indigo,
    ),
    scene(
      'd9',
      'Your eardrum receives noise and anti-noise at once — they roughly cancel.',
      ACCENT.teal,
    ),
    scene(
      'd10',
      'It works best on steady, low drones like engines and air conditioning.',
      ACCENT.rose,
    ),
    scene('d11', 'Sudden, sharp sounds like speech are harder to cancel in time.', ACCENT.rose),
    scene(
      'd12',
      "That's why it dulls a plane's roar but not a person calling your name.",
      ACCENT.indigo,
    ),
  ],
  quizQuick: [
    {
      prompt: 'What is sound, physically?',
      choices: [
        { text: 'A wave of changing air pressure', isCorrect: true },
        { text: 'A stream of tiny particles of light', isCorrect: false },
        { text: 'A magnetic field moving through the air', isCorrect: false },
      ],
      explanation: 'Sound is a pressure wave travelling through the air.',
    },
    {
      prompt: 'How do the headphones quiet the noise?',
      choices: [
        { text: 'They play the opposite wave, which cancels the noise', isCorrect: true },
        { text: 'They physically block all sound with thick padding', isCorrect: false },
        { text: 'They slow the air down inside the ear cup', isCorrect: false },
      ],
      explanation: 'Anti-noise meets the noise and the two cancel out.',
    },
    {
      prompt: 'What kind of sound is easiest to cancel?',
      choices: [
        { text: 'Steady low drones like engine hum', isCorrect: true },
        { text: 'Sudden sharp sounds like a shout', isCorrect: false },
        { text: 'Complete silence', isCorrect: false },
      ],
      explanation: 'Constant low sounds are predictable, so they cancel well.',
    },
  ],
  quizDeep: [
    {
      prompt: "What happens when a wave's crest meets another wave's trough?",
      choices: [
        { text: 'They cancel, making the sound quieter', isCorrect: true },
        { text: 'They add, making it louder', isCorrect: false },
        { text: 'They change colour', isCorrect: false },
      ],
      explanation: 'Opposite waves cancel — the basis of noise cancelling.',
    },
    {
      prompt: "What does the headphone's microphone do?",
      choices: [
        { text: 'Samples the surrounding noise so it can be cancelled', isCorrect: true },
        { text: 'Records your voice for calls only', isCorrect: false },
        { text: 'Measures the temperature of the air', isCorrect: false },
      ],
      explanation: 'The mic captures the noise the chip needs to invert.',
    },
    {
      prompt: "What is 'anti-noise'?",
      choices: [
        { text: 'A wave that is the exact opposite of the noise', isCorrect: true },
        { text: 'A louder copy of the noise', isCorrect: false },
        { text: 'A high-pitched warning tone', isCorrect: false },
      ],
      explanation: 'Anti-noise is the inverted wave that cancels the original.',
    },
    {
      prompt: 'Why must the headphones react so fast?',
      choices: [
        {
          text: 'The anti-noise must reach your ear at the same moment as the noise',
          isCorrect: true,
        },
        { text: 'To save battery power', isCorrect: false },
        { text: 'To keep the music in tune', isCorrect: false },
      ],
      explanation: "If the timing is off, the waves won't cancel.",
    },
    {
      prompt: 'Why is speech harder to cancel than engine hum?',
      choices: [
        { text: 'It changes suddenly and unpredictably', isCorrect: true },
        { text: 'It is much louder than any engine', isCorrect: false },
        { text: 'It travels faster than other sound', isCorrect: false },
      ],
      explanation: 'Sharp, changing sounds are hard to predict and invert in time.',
    },
    {
      prompt: 'What does noise cancelling do best?',
      choices: [
        { text: 'Dulls steady background drones', isCorrect: true },
        { text: 'Silences every possible sound completely', isCorrect: false },
        { text: "Improves your music's bass", isCorrect: false },
      ],
      explanation: 'It excels at constant low-frequency noise.',
    },
  ],
  sources: ['https://www.scientificamerican.com/article/how-do-noise-cancelling-headphones-work/'],
};

const TOPICS: Record<string, Topic> = {
  [theNorthernLights.slug]: theNorthernLights,
  [howYourHeartBeats.slug]: howYourHeartBeats,
  [whyTheMoonHasPhases.slug]: whyTheMoonHasPhases,
  [howNoiseCancellingWorks.slug]: howNoiseCancellingWorks,
};

export function getTopic(slug: string): Topic | undefined {
  return TOPICS[slug];
}

/** Rough read-time estimate in minutes: ~15s per scene + ~20s per quiz question, min 1. */
export function estimateMinutes(sceneCount: number, questionCount: number): number {
  return Math.max(1, Math.round((sceneCount * 15 + questionCount * 20) / 60));
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
