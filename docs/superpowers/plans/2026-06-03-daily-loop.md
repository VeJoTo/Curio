# Daily Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Curio's playable daily loop — Today → Story → Quiz → Result — composing the Geometric Clay kit, running on a mock Topic fixture, with a reusable indie-game motion layer.

**Architecture:** Expo Router stack. `index` is Today; `topic/[slug]/{index,quiz,result}` are Story/Quiz/Result. Data comes from a typed fixture validated against `@curio/shared`'s `TopicSchema`; depth and score flow via route params; per-screen local state only. A `app/motion/` module (Moti for declarative entrance/loops/burst, Reanimated gesture-handler for the scene swipe) supplies reduced-motion-aware "juice" presets every screen composes.

**Tech Stack:** Expo SDK 51 · Expo Router · React Native · the Geometric Clay kit (`app/theme`, `app/components`) · Moti · react-native-gesture-handler · Reanimated 3 · expo-haptics · Vitest (fixture test).

**Spec reference:** `docs/superpowers/specs/2026-06-03-daily-loop-design.md`

**Branch:** All tasks land on `feat/daily-loop` (already created). Each task commits separately; PR opens after Task 10.

---

## File Structure

```
app/
├── app/
│   ├── _layout.tsx                 # MODIFY — wrap in GestureHandlerRootView
│   ├── index.tsx                   # MODIFY — becomes Today (home)
│   └── topic/[slug]/
│       ├── index.tsx               # NEW — Story
│       ├── quiz.tsx                # NEW — Quiz
│       └── result.tsx              # NEW — Result / Reflect
├── data/
│   ├── topics.ts                   # NEW — fixture + getTopic/todayTopic
│   └── topics.test.ts              # NEW — Vitest: fixture parses TopicSchema
├── motion/
│   ├── config.ts                   # NEW — spring presets + reduced timing
│   ├── Reveal.tsx                  # NEW — entrance (fade+rise+overshoot)
│   ├── Pulse.tsx                   # NEW — idle breath loop
│   ├── Burst.tsx                   # NEW — perfect-score confetti
│   ├── useCountUp.ts               # NEW — score count-up
│   └── index.ts                    # NEW — barrel
└── components/
    ├── SceneFrame.tsx              # NEW — flat clay scene panel
    ├── AnswerChoice.tsx            # NEW — quiz option w/ states + pop/shake
    ├── TopicHeroCard.tsx           # NEW — Today hero composition
    ├── ScoreCard.tsx               # NEW — Result score composition
    └── index.ts                    # MODIFY — export the new components
```

**Boundary discipline:** `data/` depends only on `@curio/shared`. `motion/` depends on `theme` + `hooks/useReducedMotion` + Moti/Reanimated, never on screens. Components compose theme + motion. Screens compose components — screens hold the only screen-specific state.

---

## Pre-task: confirm branch

```bash
cd /Users/vera/Documents/Curio
git branch --show-current   # expect: feat/daily-loop
```

---

### Task 1: Dependencies + gesture-handler root

**Files:**
- Modify: `app/package.json` (via expo install / pnpm add), `app/app/_layout.tsx`

- [ ] **Step 1: Install deps (SDK-correct gesture-handler, plus Moti)**

```bash
cd /Users/vera/Documents/Curio
pnpm --filter @curio/app exec expo install react-native-gesture-handler
pnpm --filter @curio/app add moti
```

Expected: both appear in `app/package.json` dependencies; lockfile updates.

- [ ] **Step 2: Wrap the app in `GestureHandlerRootView`** — replace `app/app/_layout.tsx` body's `return` so the file reads:

```tsx
import { Fraunces_600SemiBold, Fraunces_900Black } from '@expo-google-fonts/fraunces';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_900Black,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_700Bold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0. If Biome reformats, `pnpm lint:fix`, re-verify.

- [ ] **Step 4: Commit**

```bash
git add app/package.json app/app/_layout.tsx pnpm-lock.yaml
git commit -m "chore(app): add moti + gesture-handler, gesture root"
```

---

### Task 2: Topic fixture (TDD)

**Files:**
- Create: `app/data/topics.ts`, `app/data/topics.test.ts`

- [ ] **Step 1: Write the failing test** — `app/data/topics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TopicSchema } from '@curio/shared';
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
```

The Vitest config (`app/vitest.config.ts`) currently only includes `theme/**/*.test.ts`. The test importing `@curio/shared` also needs the workspace alias resolved.

- [ ] **Step 2: Widen the Vitest config to include `data/` and resolve `@curio/shared`** — replace `app/vitest.config.ts`:

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@curio/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    include: ['theme/**/*.test.ts', 'data/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 3: Run the test (expect FAIL — module missing)**

```bash
pnpm --filter @curio/app test
```

Expected: FAIL — cannot resolve `./topics`.

- [ ] **Step 4: Write `app/data/topics.ts`** (a full `TopicSchema`-valid fixture)

```ts
import type { Scene, Topic } from '@curio/shared';

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
  deck: "A solar wind, a magnetic field, and a 100-kilometre-tall curtain of green light.",
  categorySlug: 'earth-and-sky',
  ageBand: 'all',
  status: 'published',
  publishedAt: '2026-06-03T08:00:00.000Z',
  heroImageUrl: PLACEHOLDER_IMG,
  scenesQuick: [
    scene('q1', 'It starts at the sun — a gust of charged particles races outward.', ACCENT.mustard),
    scene('q2', "The wind slams into Earth's magnetic field and is funnelled toward the poles.", ACCENT.rose),
    scene('q3', 'High in the sky, the particles crash into oxygen and nitrogen.', ACCENT.teal),
    scene('q4', 'Each gas glows its own colour — green and red from oxygen, blue from nitrogen.', ACCENT.indigo),
    scene('q5', 'The result: a shifting curtain of light, kilometres tall.', ACCENT.teal),
  ],
  scenesDeep: [
    scene('d1', 'The sun constantly sheds a stream of charged particles — the solar wind.', ACCENT.mustard),
    scene('d2', 'A solar flare or coronal hole can send a far stronger gust our way.', ACCENT.mustard),
    scene('d3', "Days later it reaches Earth and meets the magnetosphere — our magnetic shield.", ACCENT.rose),
    scene('d4', 'The field deflects most of it, but funnels some toward the magnetic poles.', ACCENT.rose),
    scene('d5', 'Guided down field lines, particles plunge into the upper atmosphere.', ACCENT.indigo),
    scene('d6', 'Around 100 km up, they collide with oxygen atoms.', ACCENT.teal),
    scene('d7', 'The collisions kick electrons into higher-energy states.', ACCENT.teal),
    scene('d8', 'As electrons fall back, they release the energy as light.', ACCENT.indigo),
    scene('d9', 'Oxygen at ~100 km glows green; far higher it glows deep red.', ACCENT.teal),
    scene('d10', 'Nitrogen adds blues and purples at the curtain’s lower edge.', ACCENT.indigo),
    scene('d11', 'Earth’s field lines shape the light into rippling curtains and arcs.', ACCENT.rose),
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
      explanation: 'Nitrogen emits blue and purple light, often at the curtain’s lower edge.',
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

export function todayTopic(): Topic {
  return theNorthernLights;
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
pnpm --filter @curio/app test
```

Expected: PASS — the fixture parses, plus the existing 8 theme tests still pass.

- [ ] **Step 6: Typecheck + lint, then commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/data/ app/vitest.config.ts
git commit -m "feat(app): Northern Lights topic fixture (parses TopicSchema)"
```

---

### Task 3: Motion module

**Files:**
- Create: `app/motion/config.ts`, `app/motion/Reveal.tsx`, `app/motion/Pulse.tsx`, `app/motion/Burst.tsx`, `app/motion/useCountUp.ts`, `app/motion/index.ts`
- Modify: `app/tsconfig.json` (include `motion/`)

> Verified by typecheck + the screens that consume it (and the final run). Indie-game feel: overshoot springs, all `transform`/`opacity` only, all reduced-motion aware.

- [ ] **Step 1: Add `motion/` to tsconfig include** — in `app/tsconfig.json`, change the `include` array to add `"motion/**/*"`:

```json
  "include": [
    "app/**/*",
    "theme/**/*",
    "components/**/*",
    "hooks/**/*",
    "motion/**/*",
    "index.ts",
    "expo-env.d.ts",
    ".expo/types/**/*.ts"
  ]
```

- [ ] **Step 2: `app/motion/config.ts`** — spring presets (Moti transition shapes)

```ts
// Moti spring transitions. Lower damping = more bounce (indie-game juice).
export const springs = {
  default: { type: 'spring', damping: 14, stiffness: 180, mass: 1 },
  bouncy: { type: 'spring', damping: 10, stiffness: 170, mass: 0.9 },
  soft: { type: 'spring', damping: 18, stiffness: 200, mass: 1 },
} as const;

// Reduced-motion fallback: quick, flat, no overshoot.
export const reducedTiming = { type: 'timing', duration: 120 } as const;
```

- [ ] **Step 3: `app/motion/Reveal.tsx`** — entrance (fade + rise + scale overshoot)

```tsx
import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { reducedTiming, springs } from './config';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function Reveal({ children, delay = 0, style }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <MotiView
      style={style}
      from={reduced ? { opacity: 0 } : { opacity: 0, translateY: 12, scale: 0.96 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, translateY: 0, scale: 1 }}
      transition={{ ...(reduced ? reducedTiming : springs.bouncy), delay }}
    >
      {children}
    </MotiView>
  );
}
```

- [ ] **Step 4: `app/motion/Pulse.tsx`** — idle breath loop

```tsx
import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function Pulse({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <>{children}</>;
  }
  return (
    <MotiView
      from={{ scale: 1 }}
      animate={{ scale: 1.04 }}
      transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
    >
      {children}
    </MotiView>
  );
}
```

- [ ] **Step 5: `app/motion/Burst.tsx`** — perfect-score confetti (self-resolving keyframes)

```tsx
import { MotiView } from 'moti';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { theme } from '../theme';

const PIECES = [
  { x: -36, y: -28, color: theme.color.coral },
  { x: 32, y: -32, color: theme.color.teal },
  { x: -30, y: 26, color: theme.color.mustard },
  { x: 34, y: 24, color: theme.color.indigo },
  { x: 0, y: -42, color: theme.color.rose },
];

export function Burst({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  if (reduced || !active) {
    return null;
  }
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {PIECES.map((p) => (
        <MotiView
          key={`${p.x}:${p.y}`}
          style={[styles.piece, { backgroundColor: p.color }]}
          from={{ opacity: 0, translateX: 0, translateY: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 0],
            translateX: [0, p.x, p.x * 1.3],
            translateY: [0, p.y, p.y * 1.3],
            scale: [0.4, 1, 0.8],
          }}
          transition={{ type: 'timing', duration: 900, delay: 80 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  piece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: theme.color.ink,
  },
});
```

- [ ] **Step 6: `app/motion/useCountUp.ts`** — score count-up

```ts
import { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Counts 0 → target over ~durationMs. Reduced motion jumps straight to target.
export function useCountUp(target: number, durationMs = 700): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced || target <= 0) {
      setValue(target);
      return;
    }
    setValue(0);
    const stepMs = Math.max(40, Math.round(durationMs / target));
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setValue(current);
      if (current >= target) {
        clearInterval(id);
      }
    }, stepMs);
    return () => clearInterval(id);
  }, [target, durationMs, reduced]);

  return value;
}
```

- [ ] **Step 7: `app/motion/index.ts`** — barrel

```ts
export { springs, reducedTiming } from './config';
export { Reveal } from './Reveal';
export { Pulse } from './Pulse';
export { Burst } from './Burst';
export { useCountUp } from './useCountUp';
```

- [ ] **Step 8: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/motion/ app/tsconfig.json
git commit -m "feat(app): indie-game motion module (Reveal/Pulse/Burst/useCountUp)"
```

---

### Task 4: SceneFrame component

**Files:**
- Create: `app/components/SceneFrame.tsx`
- Modify: `app/components/index.ts`

- [ ] **Step 1: Write `app/components/SceneFrame.tsx`**

```tsx
import type { Scene } from '@curio/shared';
import { Platform, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

const CUE: Record<string, string> = {
  '#A8DBC6': '🌍',
  '#F6A6B2': '🧲',
  '#F2C14E': '☀️',
  '#6E4FE8': '🌌',
};

interface SceneFrameProps {
  scene: Scene;
  sceneIndex: number;
  sceneCount: number;
}

export function SceneFrame({ scene, sceneIndex, sceneCount }: SceneFrameProps) {
  const accent = scene.accentColor ?? theme.color.teal;
  const cue = CUE[accent] ?? '✨';

  return (
    <View>
      <View style={[styles.panel, { backgroundColor: accent }]}>
        <Text variant="display">{cue}</Text>
      </View>
      <Text variant="meta" color="inkSoft" style={styles.tag}>
        Scene {sceneIndex + 1} / {sceneCount}
      </Text>
      <Text variant="title" color="ink">
        {scene.caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 230,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select(theme.shadow.clay),
  },
  tag: { marginTop: theme.space.md, marginBottom: theme.space.xs },
});
```

- [ ] **Step 2: Export it from the barrel** — add to `app/components/index.ts` (keep alphabetical):

```ts
export { SceneFrame } from './SceneFrame';
```

- [ ] **Step 3: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/components/SceneFrame.tsx app/components/index.ts
git commit -m "feat(app): SceneFrame (flat clay scene panel)"
```

---

### Task 5: AnswerChoice component

**Files:**
- Create: `app/components/AnswerChoice.tsx`
- Modify: `app/components/index.ts`

- [ ] **Step 1: Write `app/components/AnswerChoice.tsx`** — clay row with reveal states; pop on correct, shake on wrong (Moti keyframes, reduced-motion aware)

```tsx
import { MotiView } from 'moti';
import { Pressable, StyleSheet } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { springs } from '../motion';
import { theme } from '../theme';
import { Text } from './Text';

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'mutedCorrect' | 'dimmed';

interface AnswerChoiceProps {
  label: string;
  state: AnswerState;
  onPress: () => void;
  disabled?: boolean;
}

const BG: Record<AnswerState, string> = {
  idle: theme.color.surface,
  correct: theme.color.teal,
  wrong: theme.color.rose,
  mutedCorrect: theme.color.teal,
  dimmed: theme.color.surface,
};

const MARK: Record<AnswerState, string> = {
  idle: '',
  correct: '✓',
  wrong: '✗',
  mutedCorrect: '✓',
  dimmed: '',
};

export function AnswerChoice({ label, state, onPress, disabled = false }: AnswerChoiceProps) {
  const reduced = useReducedMotion();

  // Pop on correct, shake on wrong (transform-only; off under reduced motion).
  const animate =
    reduced || state === 'idle' || state === 'dimmed' || state === 'mutedCorrect'
      ? { scale: 1, translateX: 0 }
      : state === 'correct'
        ? { scale: [1, 1.06, 1], translateX: 0 }
        : { scale: 1, translateX: [0, -5, 5, -4, 3, 0] };

  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}>
      <MotiView
        style={[styles.row, { backgroundColor: BG[state], opacity: state === 'dimmed' ? 0.5 : 1 }]}
        animate={animate}
        transition={springs.bouncy}
      >
        <Text variant="bodyStrong" color="ink">
          {label}
        </Text>
        {MARK[state] ? (
          <Text variant="bodyStrong" color="ink" style={styles.mark}>
            {MARK[state]}
          </Text>
        ) : null}
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 15,
    minHeight: 52,
    marginBottom: theme.space.xs,
  },
  mark: { marginLeft: 'auto' },
});
```

- [ ] **Step 2: Export it** — add to `app/components/index.ts`:

```ts
export { AnswerChoice } from './AnswerChoice';
```

- [ ] **Step 3: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/components/AnswerChoice.tsx app/components/index.ts
git commit -m "feat(app): AnswerChoice (states + pop/shake)"
```

---

### Task 6: Today screen + TopicHeroCard

**Files:**
- Create: `app/components/TopicHeroCard.tsx`
- Modify: `app/components/index.ts`, `app/app/index.tsx`

- [ ] **Step 1: Write `app/components/TopicHeroCard.tsx`**

```tsx
import type { Topic } from '@curio/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pulse } from '../motion';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { ClayCard } from './ClayCard';
import { Pill } from './Pill';
import { SegmentedToggle } from './SegmentedToggle';
import { Text } from './Text';

export type Depth = 'quick' | 'deep';

interface TopicHeroCardProps {
  topic: Topic;
  onExplore: (depth: Depth) => void;
}

export function TopicHeroCard({ topic, onExplore }: TopicHeroCardProps) {
  const [depth, setDepth] = useState<Depth>('quick');

  const sceneCount = depth === 'quick' ? topic.scenesQuick.length : topic.scenesDeep.length;
  const questionCount = depth === 'quick' ? topic.quizQuick.length : topic.quizDeep.length;
  const minutes = depth === 'quick' ? '~2 min' : '~12 min';

  return (
    <ClayCard surface="cream">
      <Pill label="🌍 Earth & Sky" tint={theme.color.teal} />
      <Text variant="display" color="ink" style={styles.title}>
        {topic.title}
      </Text>
      <View style={styles.hero}>
        <Text variant="display">🌌</Text>
      </View>
      <Text variant="body" color="ink" style={styles.deck}>
        {topic.deck}
      </Text>
      <View style={styles.toggle}>
        <SegmentedToggle
          options={['Quick', 'Deep']}
          value={depth === 'quick' ? 'Quick' : 'Deep'}
          onChange={(v) => setDepth(v === 'Quick' ? 'quick' : 'deep')}
        />
      </View>
      <Text variant="meta" color="inkSoft" style={styles.hint}>
        {minutes} · {sceneCount} scenes · {questionCount} questions
      </Text>
      <Pulse>
        <ClayButton
          label="Explore today →"
          variant="coral"
          onPress={() => onExplore(depth)}
          style={styles.cta}
        />
      </Pulse>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: theme.space.sm },
  hero: {
    height: 150,
    marginTop: theme.space.sm,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deck: { marginTop: theme.space.md, marginBottom: theme.space.md },
  toggle: { marginBottom: theme.space.xs },
  hint: { marginBottom: theme.space.md },
  cta: { alignSelf: 'stretch' },
});
```

> `ClayButton` must accept a `style` prop for `cta` (`alignSelf: 'stretch'`). It currently does not. **Add an optional `style?: StyleProp<ViewStyle>` to `ClayButton`** applied to its `Animated.View` (after the existing styles). Do this edit as part of this step:
> in `app/components/ClayButton.tsx`, add `import type { StyleProp, ViewStyle } from 'react-native';`, add `style?: StyleProp<ViewStyle>;` to `ClayButtonProps`, destructure `style`, and change the `Animated.View` style array to `[styles.btn, { backgroundColor: fill[variant], opacity: disabled ? 0.4 : 1 }, style, disabled ? null : animatedStyle]`.

- [ ] **Step 2: Export TopicHeroCard** — add to `app/components/index.ts`:

```ts
export { TopicHeroCard } from './TopicHeroCard';
```

- [ ] **Step 3: Rewrite `app/app/index.tsx` as Today**

```tsx
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text, TopicHeroCard } from '../components';
import type { Depth } from '../components/TopicHeroCard';
import { todayTopic } from '../data/topics';
import { Reveal } from '../motion';
import { theme } from '../theme';

export default function Today() {
  const router = useRouter();
  const topic = todayTopic();

  const onExplore = (depth: Depth) => {
    router.push({ pathname: '/topic/[slug]', params: { slug: topic.slug, depth } });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text variant="meta" color="inkSoft">
          Today
        </Text>
        <IconButton icon="👤" accessibilityLabel="Profile" onPress={() => {}} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal>
          <TopicHeroCard topic={topic} onExplore={onExplore} />
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
  },
  body: { padding: theme.space.lg, justifyContent: 'center', flexGrow: 1 },
});
```

- [ ] **Step 4: Create stubs for all three loop routes, regenerate typed routes, verify**

Today links to `/topic/[slug]`, and Story/Quiz forward to `/topic/[slug]/quiz` and `/topic/[slug]/result`. So that every `router.push` target is a known typed route from now on (avoiding forward-reference type errors), create all three route files as minimal stubs — Tasks 7–9 replace them. Each of `app/app/topic/[slug]/index.tsx`, `app/app/topic/[slug]/quiz.tsx`, `app/app/topic/[slug]/result.tsx`:

```tsx
import { Text } from 'react-native';

export default function Stub() {
  return <Text>…</Text>;
}
```

Boot Expo once to regenerate `.expo/types` so the new routes become typed, then verify:

```bash
pnpm --filter @curio/app exec expo start --web --port 8081 &
sleep 14 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081
kill %1 2>/dev/null
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: typecheck 0 (all three routes typed; the depth/score params are accepted), lint 0. (`.expo/types` is gitignored; CI uses expo-router's permissive `Href`, so this regen is local-only.)

- [ ] **Step 5: Commit**

```bash
git add app/components/TopicHeroCard.tsx app/components/ClayButton.tsx app/components/index.ts app/app/index.tsx app/app/topic
git commit -m "feat(app): Today screen + TopicHeroCard (depth toggle, entrance)"
```

---

### Task 7: Story screen (scenes + swipe)

**Files:**
- Modify: `app/app/topic/[slug]/index.tsx` (replace the Task 6 stub)

- [ ] **Step 1: Replace `app/app/topic/[slug]/index.tsx`**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { ClayButton, IconButton, ProgressDots, SceneFrame, Text } from '../../../components';
import { getTopic } from '../../../data/topics';
import { Reveal } from '../../../motion';
import { theme } from '../../../theme';

export default function Story() {
  const router = useRouter();
  const { slug, depth } = useLocalSearchParams<{ slug: string; depth?: string }>();
  const topic = getTopic(slug ?? '');
  const isDeep = depth === 'deep';
  const [index, setIndex] = useState(0);

  if (!topic) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text variant="body">Topic not found.</Text>
      </SafeAreaView>
    );
  }

  const scenes = isDeep ? topic.scenesDeep : topic.scenesQuick;
  const isLast = index === scenes.length - 1;

  const go = (next: number) => {
    if (next >= 0 && next < scenes.length) {
      setIndex(next);
    }
  };
  const toQuiz = () => {
    router.push({ pathname: '/topic/[slug]/quiz', params: { slug: topic.slug, depth: isDeep ? 'deep' : 'quick' } });
  };

  const swipe = Gesture.Pan().onEnd((e) => {
    'worklet';
    if (e.translationX < -40) {
      runOnJS(go)(index + 1);
    } else if (e.translationX > 40) {
      runOnJS(go)(index - 1);
    }
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="←" accessibilityLabel="Previous scene" onPress={() => go(index - 1)} />
        <ProgressDots count={scenes.length} index={index} />
        <IconButton icon="✕" accessibilityLabel="Close" onPress={() => router.dismissAll()} />
      </View>

      <GestureDetector gesture={swipe}>
        <View style={styles.stage}>
          <Reveal key={index}>
            <SceneFrame scene={scenes[index]} sceneIndex={index} sceneCount={scenes.length} />
          </Reveal>
        </View>
      </GestureDetector>

      <View style={styles.nav}>
        {index > 0 ? (
          <ClayButton label="← Back" variant="ghost" onPress={() => go(index - 1)} />
        ) : (
          <View />
        )}
        {isLast ? (
          <ClayButton label="Take the quiz →" variant="coral" onPress={toQuiz} />
        ) : (
          <ClayButton label="Next →" variant="indigo" onPress={() => go(index + 1)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
  },
  stage: { flex: 1, padding: theme.space.lg, justifyContent: 'center' },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.space.lg,
  },
});
```

> `scenes[index]` is typed `Scene | undefined` under `noUncheckedIndexedAccess` if the app enabled it — the app extends `expo/tsconfig.base` (which does NOT set it), so `scenes[index]` is `Scene`. If typecheck complains, guard with `const scene = scenes[index]; if (!scene) return null;`.

- [ ] **Step 2: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/app/topic/[slug]/index.tsx
git commit -m "feat(app): Story screen — scenes, progress, swipe"
```

---

### Task 8: Quiz screen

**Files:**
- Modify: `app/app/topic/[slug]/quiz.tsx` (replace the Task 6 stub)

- [ ] **Step 1: Replace `app/app/topic/[slug]/quiz.tsx`**

```tsx
import type { Question } from '@curio/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { AnswerChoice, ClayButton, IconButton, ProgressDots, Text } from '../../../components';
import type { AnswerState } from '../../../components/AnswerChoice';
import { getTopic } from '../../../data/topics';
import { Reveal } from '../../../motion';
import { theme } from '../../../theme';

export default function Quiz() {
  const router = useRouter();
  const { slug, depth } = useLocalSearchParams<{ slug: string; depth?: string }>();
  const topic = getTopic(slug ?? '');
  const isDeep = depth === 'deep';

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  if (!topic) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text variant="body">Topic not found.</Text>
      </SafeAreaView>
    );
  }

  const questions = isDeep ? topic.quizDeep : topic.quizQuick;
  const q: Question = questions[index];
  const isLast = index === questions.length - 1;
  const answered = picked !== null;

  const choose = (choiceIndex: number) => {
    if (answered) {
      return;
    }
    setPicked(choiceIndex);
    if (q.choices[choiceIndex].isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const stateFor = (choiceIndex: number): AnswerState => {
    if (!answered) {
      return 'idle';
    }
    const isCorrect = q.choices[choiceIndex].isCorrect;
    if (choiceIndex === picked) {
      return isCorrect ? 'correct' : 'wrong';
    }
    return isCorrect ? 'mutedCorrect' : 'dimmed';
  };

  const next = () => {
    if (isLast) {
      router.replace({
        pathname: '/topic/[slug]/result',
        params: { slug: topic.slug, depth: isDeep ? 'deep' : 'quick', score: String(score), total: String(questions.length) },
      });
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="✕" accessibilityLabel="Close" onPress={() => router.dismissAll()} />
        <ProgressDots count={questions.length} index={index} />
        <View style={styles.spacer} />
      </View>

      <View style={styles.body}>
        <Reveal key={index}>
          <Text variant="meta" color="inkSoft" style={styles.tag}>
            Question {index + 1} / {questions.length}
          </Text>
          <Text variant="title" color="ink" style={styles.prompt}>
            {q.prompt}
          </Text>
          {q.choices.map((choice, choiceIndex) => (
            <AnswerChoice
              key={choice.text}
              label={choice.text}
              state={stateFor(choiceIndex)}
              disabled={answered}
              onPress={() => choose(choiceIndex)}
            />
          ))}
        </Reveal>

        {answered ? (
          <Reveal style={styles.explWrap}>
            <View style={styles.expl}>
              <Text variant="body" color="ink">
                {q.explanation}
              </Text>
            </View>
            <ClayButton
              label={isLast ? 'See your result →' : 'Next question →'}
              variant="coral"
              onPress={next}
              style={styles.cta}
            />
          </Reveal>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
  },
  spacer: { width: 46 },
  body: { flex: 1, padding: theme.space.lg },
  tag: { marginBottom: theme.space.xs },
  prompt: { marginBottom: theme.space.md },
  explWrap: { marginTop: theme.space.sm },
  expl: {
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.peach,
    padding: theme.space.md,
  },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 2: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/app/topic/[slug]/quiz.tsx
git commit -m "feat(app): Quiz screen — immediate feedback + explanation"
```

---

### Task 9: Result screen + ScoreCard

**Files:**
- Create: `app/components/ScoreCard.tsx`
- Modify: `app/components/index.ts`, `app/app/topic/[slug]/result.tsx` (replace the Task 6 stub)

- [ ] **Step 1: Write `app/components/ScoreCard.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';
import { Burst, useCountUp } from '../motion';
import { theme } from '../theme';
import { Avatar } from './Avatar';
import { Text } from './Text';

interface ScoreCardProps {
  score: number;
  total: number;
}

function message(score: number, total: number): string {
  if (score === total) {
    return 'Aurora expert! 🌟';
  }
  if (score / total >= 2 / 3) {
    return "Nice — you've got the gist! ✨";
  }
  return 'Worth another look ↺';
}

export function ScoreCard({ score, total }: ScoreCardProps) {
  const shown = useCountUp(score);
  const perfect = score === total;

  return (
    <View style={styles.card}>
      <Burst active={perfect} />
      <View style={styles.avatar}>
        <Avatar avatarKey="avatar-fox" size="lg" />
      </View>
      <Text variant="display" color="ink">
        {shown} / {total}
      </Text>
      <Text variant="bodyStrong" color="ink" style={styles.msg}>
        {message(score, total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    padding: theme.space.lg,
    alignItems: 'center',
  },
  avatar: { marginBottom: theme.space.sm },
  msg: { marginTop: theme.space.xs },
});
```

- [ ] **Step 2: Export ScoreCard** — add to `app/components/index.ts`:

```ts
export { ScoreCard } from './ScoreCard';
```

- [ ] **Step 3: Write `app/app/topic/[slug]/result.tsx`**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ClayButton, ScoreCard, Text, TextField } from '../../../components';
import { Reveal } from '../../../motion';
import { theme } from '../../../theme';

export default function Result() {
  const router = useRouter();
  const { slug, score, total } = useLocalSearchParams<{ slug: string; score?: string; total?: string }>();
  const [reflection, setReflection] = useState('');

  const scoreNum = Number(score ?? '0');
  const totalNum = Number(total ?? '0');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Reveal>
          <ScoreCard score={scoreNum} total={totalNum} />
        </Reveal>

        <Reveal delay={120} style={styles.reflectWrap}>
          <Text variant="meta" color="inkSoft" style={styles.tag}>
            Reflect
          </Text>
          <Text variant="title" color="ink" style={styles.prompt}>
            What's one thing that surprised you?
          </Text>
          <TextField
            value={reflection}
            onChangeText={setReflection}
            placeholder="It's not actually reflected light…"
            accessibilityLabel="Your reflection"
          />
        </Reveal>

        <Reveal delay={200} style={styles.actions}>
          <ClayButton
            label="Done for today ✓"
            variant="coral"
            onPress={() => router.dismissAll()}
            style={styles.cta}
          />
          <ClayButton
            label="↺ Read it again"
            variant="ghost"
            onPress={() => router.replace({ pathname: '/topic/[slug]', params: { slug: slug ?? '' } })}
            style={styles.cta}
          />
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  body: { flex: 1, padding: theme.space.lg, justifyContent: 'center' },
  reflectWrap: { marginTop: theme.space.xl },
  tag: { marginBottom: theme.space.xs },
  prompt: { marginBottom: theme.space.sm },
  actions: { marginTop: theme.space.xl, gap: theme.space.sm },
  cta: { alignSelf: 'stretch' },
});
```

- [ ] **Step 4: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/components/ScoreCard.tsx app/components/index.ts app/app/topic/[slug]/result.tsx
git commit -m "feat(app): Result screen — count-up score, reflect, perfect-score burst"
```

---

### Task 10: Verification run + PR

- [ ] **Step 1: Tests + lint + typecheck across the monorepo**

```bash
cd /Users/vera/Documents/Curio
pnpm lint && pnpm typecheck && pnpm test
```

Expected: all green (shared 20, api 2, authoring 3, app theme 8 + fixture 3).

- [ ] **Step 2: Boot on web and play the loop**

```bash
pnpm --filter @curio/app start
```

Press `w`. Walk the whole loop on **both** depths:
- Today renders; toggle Quick/Deep updates the hint; "Explore today" → Story.
- Story: scenes advance by Next **and** by swipe; progress dots track; last scene → "Take the quiz".
- Quiz: tapping a wrong answer shakes + reveals the correct (teal); explanation appears; advance; last question → "See your result".
- Result: score counts up; a perfect score (answer all correctly) triggers the confetti burst + avatar; "Done" returns to Today; "Read it again" restarts the story.

Confirm motion reads as indie-game juicy (overshoot entrances, pop, shake, pulse).

- [ ] **Step 3: Boot on a simulator**

Press `i` or `a`. Confirm haptics fire (device), gestures work, transitions are smooth (~60fps).

- [ ] **Step 4: Reduced-motion pass**

Enable Reduce Motion. Re-walk: decorative loops/burst stop, entrances become quick fades, the loop stays fully usable. VoiceOver: choices announce state, score and progress announce. Stop Expo with Ctrl-C.

- [ ] **Step 5: Push + open PR**

```bash
git push -u origin feat/daily-loop
gh pr create \
  --title "Daily loop: Today → Story → Quiz → Result, with indie-game motion" \
  --body "$(cat <<'EOF'
## Summary
- Playable daily loop on a mock Northern Lights fixture (parses @curio/shared TopicSchema)
- Today (depth toggle) → Story (scenes + swipe) → Quiz (immediate feedback) → Result (count-up, reflect)
- New components: SceneFrame, AnswerChoice, TopicHeroCard, ScoreCard
- Reusable app/motion/ module: Reveal, Pulse, Burst, useCountUp — transform/opacity only, reduced-motion aware
- Adds Moti + react-native-gesture-handler

## Test plan
- [x] pnpm lint && pnpm typecheck && pnpm test (fixture parses TopicSchema)
- [ ] Manual: full loop both depths on web + simulator; haptics; reduced-motion + VoiceOver pass

## Spec & plan
- docs/superpowers/specs/2026-06-03-daily-loop-design.md
- docs/superpowers/plans/2026-06-03-daily-loop.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr checks --watch
```

- [ ] **Step 6: Stop — hand back for human review and merge.**

---

## Self-review checklist

| Spec section | Plan task |
|---|---|
| §2 four screens | Tasks 6–9 |
| §2 SceneFrame + AnswerChoice | Tasks 4, 5 |
| §3 fixture + getTopic | Task 2 |
| §3 Expo Router stack, params | Tasks 1, 6–9 |
| §4 screen layouts | Tasks 6–9 |
| §6 fixture parses TopicSchema (test) | Task 2 |
| §7 routes | Tasks 6–9 |
| §8 motion module (Reveal/Pulse/Burst/useCountUp), reduced-motion, transform-only | Task 3, used 6–9 |
| §9 Moti + gesture-handler deps + gesture root | Task 1 |
| §10 verification | Task 10 |

**Deferred (not this slice):** save/favorites/History/reflection persistence, real data/API, onboarding/profile/settings, real illustrations.

## Done when
- PR `feat/daily-loop` open, CI green, reviewed and merged by a human.
