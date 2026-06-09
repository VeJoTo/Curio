# Personalize Today's Topic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pick the day's topic with a strict preference for the profile's interests, deterministic per calendar day, via a pure tested selector; add three full-fidelity topics so the behavior is visible.

**Architecture:** A pure `selectTopic.ts` module (`dayKey` + `selectDailyTopic`) holds all selection logic with no `Date` calls or catalog imports. `data/topics.ts` owns the catalog and wraps the selector in `todayTopic(profile?, date?)` with a guaranteed fallback. `app/index.tsx` derives the topic from the loaded profile after its loading gate.

**Tech Stack:** TypeScript, React Native / Expo Router, Vitest, Zod (`@curio/shared` schemas), pnpm workspace.

**Branch:** `feat/personalize-today-topic` (already checked out).

**Commands:**
- Run one test file: `pnpm --filter @curio/app test <relative-path>`
- Run all app tests: `pnpm --filter @curio/app test`
- Typecheck: `pnpm --filter @curio/app typecheck`

---

## File Structure

- **Create** `app/today/selectTopic.ts` — pure `dayKey(date)` and `selectDailyTopic({interests, date, topics})`. Internal djb2 `hashString`. No `Date` calls, no catalog import.
- **Create** `app/today/selectTopic.test.ts` — pure-function suite over synthetic topic sets.
- **Modify** `app/data/topics.ts` — add `getAllTopics()`; rewrite `todayTopic` to take `(profile?, date?)`; add three new topic constants; register all four in `TOPICS`.
- **Modify** `app/data/topics.test.ts` — update the `todayTopic` test for the new signature; add a catalog-validity test.
- **Modify** `app/app/index.tsx` — move `todayTopic()` below the loading/onboard gates and pass `profile`.

---

## Task 1: Pure topic selector

**Files:**
- Create: `app/today/selectTopic.ts`
- Test: `app/today/selectTopic.test.ts`

The selector only reads `slug`, `categorySlug`, and `status` off each topic, so tests build minimal partials cast to `Topic`.

- [ ] **Step 1: Write the failing test**

Create `app/today/selectTopic.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @curio/app test today/selectTopic.test.ts`
Expected: FAIL — cannot resolve `./selectTopic` / `dayKey is not a function`.

- [ ] **Step 3: Write the implementation**

Create `app/today/selectTopic.ts`:

```ts
import type { Topic } from '@curio/shared';

export interface SelectArgs {
  /** Category slugs the user chose during onboarding. */
  interests: string[];
  date: Date;
  topics: Topic[];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar day as a stable "YYYY-MM-DD" key. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** djb2 string hash → unsigned 32-bit int. Deterministic. */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0; // h * 33 + charCode, kept in 32 bits
  }
  return h >>> 0;
}

/**
 * Pick the day's topic. Strict preference: rotate only among published topics whose
 * category matches an interest; fall back to all published topics when none match.
 * Deterministic within a calendar day, varies day to day. Pure — no Date.now / catalog.
 */
export function selectDailyTopic({ interests, date, topics }: SelectArgs): Topic | undefined {
  const published = topics.filter((t) => t.status === 'published');
  const matching = published.filter((t) => interests.includes(t.categorySlug));
  const pool = matching.length > 0 ? matching : published;
  if (pool.length === 0) return undefined;

  const sorted = [...pool].sort((x, y) => x.slug.localeCompare(y.slug));
  const idx = hashString(dayKey(date)) % sorted.length;
  return sorted[idx];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @curio/app test today/selectTopic.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add app/today/selectTopic.ts app/today/selectTopic.test.ts
git commit -m "feat(app): pure daily topic selector with interest preference (#7)"
```

---

## Task 2: Wire the selector into the catalog

**Files:**
- Modify: `app/data/topics.ts` (add `getAllTopics`, rewrite `todayTopic`)
- Test: `app/data/topics.test.ts`

- [ ] **Step 1: Update the failing test**

In `app/data/topics.test.ts`, replace the existing `todayTopic returns a topic` test and add a `getAllTopics` test. Update the imports line and the final `it` block so the file reads:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @curio/app test data/topics.test.ts`
Expected: FAIL — `getAllTopics` is not exported / `todayTopic` does not accept arguments.

- [ ] **Step 3: Update `app/data/topics.ts`**

Add the import at the top of the file (below the existing `@curio/shared` import line):

```ts
import type { Profile, Scene, Topic } from '@curio/shared';
import { selectDailyTopic } from '../today/selectTopic';
```

(Adjust the existing `import type { Scene, Topic }` line to add `Profile` as shown.)

Replace the existing `getTopic` / `todayTopic` block at the bottom of the file with:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @curio/app test data/topics.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @curio/app typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/data/topics.ts app/data/topics.test.ts
git commit -m "feat(app): todayTopic selects from catalog by profile interests (#7)"
```

---

## Task 3: Author three new topics

**Files:**
- Modify: `app/data/topics.ts` (add three topic constants, register in `TOPICS`)
- Test: `app/data/topics.test.ts` (catalog-validity test)

- [ ] **Step 1: Write the failing catalog-validity test**

In `app/data/topics.test.ts`, add this block after the existing `describe('topic fixture', ...)` block:

```ts
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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @curio/app test data/topics.test.ts`
Expected: FAIL — `expected length 1 to be 4`.

- [ ] **Step 3: Add the three topic constants**

In `app/data/topics.ts`, immediately **before** the `const TOPICS: Record<string, Topic> = {` line, insert the three constants below. They reuse the existing `scene()` helper and `ACCENT` palette already defined in the file.

```ts
export const howYourHeartBeats: Topic = {
  slug: 'how-your-heart-beats',
  title: 'How Your Heart Beats',
  deck: 'A fist-sized muscle, an electrical spark, and 100,000 beats a day that never ask permission.',
  categorySlug: 'biology',
  ageBand: 'all',
  status: 'published',
  publishedAt: '2026-06-04T08:00:00.000Z',
  heroImageUrl: PLACEHOLDER_IMG,
  scenesQuick: [
    scene('q1', 'Your heart is a muscle about the size of your fist, just left of centre.', ACCENT.rose),
    scene('q2', 'It has four chambers — two to receive blood, two to push it out.', ACCENT.teal),
    scene('q3', 'A tiny patch of cells fires an electrical spark, setting the rhythm.', ACCENT.mustard),
    scene('q4', 'The spark spreads, and the chambers squeeze in a precise order.', ACCENT.indigo),
    scene('q5', 'Lub-dub: that double thump is two sets of valves snapping shut.', ACCENT.rose),
  ],
  scenesDeep: [
    scene('d1', 'The heart sits in your chest, tilted slightly left, wrapped in a protective sac.', ACCENT.rose),
    scene('d2', 'It is divided into four chambers: two atria on top, two ventricles below.', ACCENT.teal),
    scene('d3', 'The right side collects oxygen-poor blood and sends it to the lungs.', ACCENT.indigo),
    scene('d4', 'The left side receives oxygen-rich blood and pumps it to the whole body.', ACCENT.rose),
    scene('d5', 'Each beat starts in the sinoatrial node, a cluster of cells in the right atrium.', ACCENT.mustard),
    scene('d6', 'These cells fire on their own — no signal from the brain required.', ACCENT.mustard),
    scene('d7', 'The spark sweeps across the atria, making them contract and top up the ventricles.', ACCENT.teal),
    scene('d8', 'It pauses at a relay, the atrioventricular node, for a split second.', ACCENT.indigo),
    scene('d9', "Then it races down special fibres into the ventricles' walls.", ACCENT.indigo),
    scene('d10', 'The ventricles squeeze hard, driving blood to the lungs and the body.', ACCENT.rose),
    scene('d11', 'Valves between the chambers snap shut to stop blood flowing backward.', ACCENT.teal),
    scene('d12', 'That closing is the heartbeat you hear — about 100,000 times a day.', ACCENT.rose),
  ],
  quizQuick: [
    {
      prompt: "What sets the heart's rhythm?",
      choices: [
        { text: 'A patch of cells called the sinoatrial node fires an electrical spark', isCorrect: true },
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
  heroImageUrl: PLACEHOLDER_IMG,
  scenesQuick: [
    scene('q1', "The Moon doesn't glow on its own — it reflects sunlight.", ACCENT.mustard),
    scene('q2', 'Half of the Moon is always lit; half is always dark.', ACCENT.indigo),
    scene('q3', 'As the Moon orbits Earth, we see that lit half from changing angles.', ACCENT.teal),
    scene('q4', "Sometimes we face the lit side, sometimes the dark — that's the phase.", ACCENT.indigo),
    scene('q5', 'A full cycle, new moon to new moon, takes about 29.5 days.', ACCENT.rose),
  ],
  scenesDeep: [
    scene('d1', 'The Moon produces no light of its own; it only reflects the Sun.', ACCENT.mustard),
    scene('d2', 'At any moment, the Sun lights exactly one half of the Moon.', ACCENT.mustard),
    scene('d3', "The other half is in shadow — the Moon's own night.", ACCENT.indigo),
    scene('d4', 'The Moon circles Earth roughly once a month.', ACCENT.teal),
    scene('d5', 'As it orbits, our view of the sunlit half keeps shifting.', ACCENT.teal),
    scene('d6', 'At new moon, the lit side faces away from us, so the Moon looks dark.', ACCENT.indigo),
    scene('d7', 'A few days later a thin crescent of the lit side comes into view.', ACCENT.rose),
    scene('d8', 'At first quarter, we see half of the lit side as a half-moon.', ACCENT.teal),
    scene('d9', 'The Moon waxes — the bright part grows night after night.', ACCENT.mustard),
    scene('d10', 'At full moon, we face the entire sunlit half.', ACCENT.rose),
    scene('d11', 'Then it wanes, shrinking back through gibbous, quarter, and crescent.', ACCENT.indigo),
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
        { text: 'When the lit half faces away from Earth, so the Moon looks dark', isCorrect: true },
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
  heroImageUrl: PLACEHOLDER_IMG,
  scenesQuick: [
    scene('q1', 'Sound is a wave — a pattern of pressure rippling through the air.', ACCENT.teal),
    scene('q2', "Two waves can add up, or cancel out if they're perfectly opposite.", ACCENT.mustard),
    scene('q3', 'Noise-cancelling headphones listen to the noise around you with a tiny mic.', ACCENT.indigo),
    scene('q4', 'They instantly generate the opposite wave and play it into your ear.', ACCENT.mustard),
    scene('q5', 'The two waves meet, flatten each other, and the noise fades.', ACCENT.teal),
  ],
  scenesDeep: [
    scene('d1', 'Sound travels as waves of high and low air pressure.', ACCENT.teal),
    scene('d2', 'When two waves line up crest to crest, they add — louder.', ACCENT.mustard),
    scene('d3', "When one wave's crest meets another's trough, they cancel — quieter.", ACCENT.indigo),
    scene('d4', 'Noise-cancelling headphones exploit that cancelling on purpose.', ACCENT.mustard),
    scene('d5', 'A tiny microphone samples the unwanted sound around you.', ACCENT.indigo),
    scene('d6', 'A chip measures the incoming wave many thousands of times a second.', ACCENT.teal),
    scene('d7', "It calculates the exact opposite, or 'anti-noise', wave.", ACCENT.mustard),
    scene('d8', 'A speaker plays that anti-noise into your ear within a fraction of a millisecond.', ACCENT.indigo),
    scene('d9', 'Your eardrum receives noise and anti-noise at once — they roughly cancel.', ACCENT.teal),
    scene('d10', 'It works best on steady, low drones like engines and air conditioning.', ACCENT.rose),
    scene('d11', 'Sudden, sharp sounds like speech are harder to cancel in time.', ACCENT.rose),
    scene('d12', "That's why it dulls a plane's roar but not a person calling your name.", ACCENT.indigo),
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
        { text: 'The anti-noise must reach your ear at the same moment as the noise', isCorrect: true },
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
```

- [ ] **Step 4: Register the new topics**

In `app/data/topics.ts`, replace the `TOPICS` map definition with:

```ts
const TOPICS: Record<string, Topic> = {
  [theNorthernLights.slug]: theNorthernLights,
  [howYourHeartBeats.slug]: howYourHeartBeats,
  [whyTheMoonHasPhases.slug]: whyTheMoonHasPhases,
  [howNoiseCancellingWorks.slug]: howNoiseCancellingWorks,
};
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @curio/app test data/topics.test.ts`
Expected: PASS (catalog has four valid, unique, published topics).

- [ ] **Step 6: Run the full app test suite**

Run: `pnpm --filter @curio/app test`
Expected: PASS — including `today/selectTopic.test.ts`, which now exercises real rotation behavior indirectly through the catalog.

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @curio/app typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add app/data/topics.ts app/data/topics.test.ts
git commit -m "feat(app): add heart, moon, and noise-cancelling topics (#7)"
```

---

## Task 4: Pass the profile into the Today screen

**Files:**
- Modify: `app/app/index.tsx`

This is a wiring change; behavior is covered by the catalog tests, so no new unit test (the screen has no existing test harness). Verify by typecheck and reading the diff.

- [ ] **Step 1: Move the topic derivation below the gates**

In `app/app/index.tsx`, delete this line from near the top of the `Today` component (currently around line 24):

```ts
  const topic = todayTopic();
```

Then, after the `if (gate === 'onboard') { return <Redirect href="/onboarding" />; }` block and before `const onExplore = ...`, insert:

```ts
  const topic = todayTopic(profile ?? undefined);
```

(`profile` is typed `Profile | null`; `?? undefined` matches `todayTopic`'s optional parameter. Once the gate is `ready`, `profile` is non-null, so this picks by the user's interests.)

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @curio/app typecheck`
Expected: no errors.

- [ ] **Step 3: Run the full app test suite**

Run: `pnpm --filter @curio/app test`
Expected: PASS.

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: no errors (or run `pnpm lint:fix` to auto-format, then re-stage).

- [ ] **Step 5: Commit**

```bash
git add app/app/index.tsx
git commit -m "feat(app): Today screen picks topic from the loaded profile (#7)"
```

---

## Done criteria

- `selectDailyTopic` is pure, takes `(interests, date, topics)`, and is unit-tested for preference, fallback, published-only filtering, determinism within a day, day-to-day variation, and slug-sort stability.
- The catalog holds four valid published topics across `earth-and-sky`, `biology`, `space`, and `how-things-work`.
- `todayTopic(profile)` returns an interest-matching topic when one exists, otherwise any published topic, never `undefined`.
- The Today screen shows a topic chosen from the signed-in profile's interests.
- `pnpm --filter @curio/app test`, `pnpm --filter @curio/app typecheck`, and `pnpm lint` all pass.
