# Onboarding + Profile Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Curio's nine-step onboarding wizard, the AsyncStorage-backed profile store it persists to, and the first-run gate that routes new users into onboarding and returning users into Today.

**Architecture:** One `onboarding` route holds an `OnboardingDraft` in a `useReducer` and renders the current step component (each owns its CTAs); on finish it validates a `Profile` (`@curio/shared` `ProfileSchema`) via a pure `buildProfile` and persists it through `app/storage/profile.ts` (AsyncStorage seam). Today (`index.tsx`) loads the profile and `<Redirect>`s first-run users to onboarding. Steps compose the Geometric Clay kit + motion.

**Tech Stack:** Expo SDK 51 · Expo Router · the kit (`app/theme`, `app/components`, `app/motion`) · @react-native-async-storage/async-storage · expo-crypto · expo-notifications · Vitest (pure cores).

**Spec reference:** `docs/superpowers/specs/2026-06-03-onboarding-design.md`

**Branch:** All tasks land on `feat/onboarding` (already created). Each task commits separately; PR opens after Task 10.

---

## File Structure

```
app/
├── app/
│   ├── index.tsx                    # MODIFY — first-run gate (profile? → Today : redirect onboarding)
│   └── onboarding.tsx               # NEW — wizard shell route
├── onboarding/
│   ├── types.ts                     # NEW — OnboardingDraft, StepProps, AgeBand
│   ├── buildProfile.ts              # NEW — pure draft → Profile (tested)
│   ├── buildProfile.test.ts         # NEW — Vitest
│   └── steps/
│       ├── Welcome.tsx  NameStep.tsx  AvatarStep.tsx  AgeStep.tsx
│       ├── InterestsStep.tsx  TimeStep.tsx  DepthStep.tsx
│       └── NotificationsStep.tsx  DoneStep.tsx
├── storage/
│   └── profile.ts                   # NEW — AsyncStorage get/save/clear + deviceId
├── data/
│   ├── categories.ts                # NEW — 8 interest categories
│   └── categories.test.ts           # NEW — Vitest: each parses CategorySchema
└── components/
    └── Avatar.tsx                   # MODIFY — extend FACES to 6 + export AVATAR_KEYS
```

**Boundary discipline:** `storage/` and `data/` depend only on `@curio/shared` + AsyncStorage. `onboarding/buildProfile.ts` is pure (no RN/AsyncStorage) so Vitest tests it. Step components compose kit + motion; the shell owns the reducer; only the shell touches storage.

---

## Pre-task: confirm branch

```bash
cd /Users/vera/Documents/Curio
git branch --show-current   # expect: feat/onboarding
```

---

### Task 1: Dependencies

**Files:** Modify `app/package.json` (via expo install)

- [ ] **Step 1: Install**

```bash
cd /Users/vera/Documents/Curio
pnpm --filter @curio/app exec expo install @react-native-async-storage/async-storage expo-crypto expo-notifications
```

Expected: three deps added to `app/package.json` at SDK-51 versions; lockfile updates. If `expo install` misbehaves under pnpm, report rather than hand-pinning.

- [ ] **Step 2: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/package.json pnpm-lock.yaml
git commit -m "chore(app): add async-storage, expo-crypto, expo-notifications"
```

---

### Task 2: Categories fixture (TDD)

**Files:** Create `app/data/categories.ts`, `app/data/categories.test.ts`

- [ ] **Step 1: Write the failing test** — `app/data/categories.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CategorySchema } from '@curio/shared';
import { CATEGORIES } from './categories';

describe('categories fixture', () => {
  it('has 8 categories', () => {
    expect(CATEGORIES).toHaveLength(8);
  });

  it('every category parses CategorySchema (slug/name/colorToken)', () => {
    for (const c of CATEGORIES) {
      const result = CategorySchema.safeParse({ slug: c.slug, name: c.name, colorToken: c.colorToken });
      expect(result.success).toBe(true);
    }
  });

  it('slugs are unique', () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`./categories` missing): `pnpm --filter @curio/app test`

- [ ] **Step 3: Write `app/data/categories.ts`**

```ts
import type { Category } from '@curio/shared';

// Display category: the shared Category fields + an app-side emoji.
export interface DisplayCategory extends Category {
  emoji: string;
}

export const CATEGORIES: DisplayCategory[] = [
  { slug: 'earth-and-sky', name: 'Earth & Sky', colorToken: 'teal', emoji: '🌍' },
  { slug: 'biology', name: 'Biology', colorToken: 'rose', emoji: '🧬' },
  { slug: 'how-things-work', name: 'How Things Work', colorToken: 'mustard', emoji: '⚙️' },
  { slug: 'history', name: 'History', colorToken: 'indigo', emoji: '🏛️' },
  { slug: 'space', name: 'Space', colorToken: 'coral', emoji: '🚀' },
  { slug: 'art', name: 'Art', colorToken: 'rose', emoji: '🎨' },
  { slug: 'mind-and-brain', name: 'Mind & Brain', colorToken: 'teal', emoji: '🧠' },
  { slug: 'food-and-cooking', name: 'Food & Cooking', colorToken: 'mustard', emoji: '🍳' },
];
```

- [ ] **Step 4: Run — expect PASS** (3 new tests + existing). Then typecheck + lint + commit:

```bash
pnpm --filter @curio/app test
pnpm --filter @curio/app typecheck && pnpm lint
git add app/data/categories.ts app/data/categories.test.ts
git commit -m "feat(app): interest categories fixture (parses CategorySchema)"
```

---

### Task 3: Extend the Avatar set

**Files:** Modify `app/components/Avatar.tsx`

- [ ] **Step 1: Extend `FACES` and export `AVATAR_KEYS`** — in `app/components/Avatar.tsx`, replace the `FACES` const with the 6-entry version below, and add the `AVATAR_KEYS` export right after it:

```tsx
// Placeholder mapping until the real illustrated avatar set ships.
const FACES: Record<string, { glyph: string; tint: string; name: string }> = {
  'avatar-fox': { glyph: '🦊', tint: theme.color.rose, name: 'Fox' },
  'avatar-owl': { glyph: '🦉', tint: theme.color.teal, name: 'Owl' },
  'avatar-bee': { glyph: '🐝', tint: theme.color.mustard, name: 'Bee' },
  'avatar-cat': { glyph: '🐈', tint: theme.color.peach, name: 'Cat' },
  'avatar-frog': { glyph: '🐸', tint: theme.color.teal, name: 'Frog' },
  'avatar-butterfly': { glyph: '🦋', tint: theme.color.rose, name: 'Butterfly' },
};

// Ordered list of selectable avatar keys (for the onboarding picker).
export const AVATAR_KEYS = Object.keys(FACES);
```

- [ ] **Step 2: Export `AVATAR_KEYS` from the barrel** — add to `app/components/index.ts`:

```ts
export { Avatar, AVATAR_KEYS } from './Avatar';
```

(Replace the existing `export { Avatar } from './Avatar';` line.)

- [ ] **Step 3: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/components/Avatar.tsx app/components/index.ts
git commit -m "feat(app): extend avatar set to 6 + export AVATAR_KEYS"
```

---

### Task 4: Profile store + buildProfile (TDD the pure core)

**Files:** Create `app/onboarding/types.ts`, `app/onboarding/buildProfile.ts`, `app/onboarding/buildProfile.test.ts`, `app/storage/profile.ts`. Modify `app/tsconfig.json`, `app/vitest.config.ts`.

- [ ] **Step 1: Add `onboarding/` + `storage/` to tsconfig and vitest** — in `app/tsconfig.json` `include`, add `"onboarding/**/*"` and `"storage/**/*"`. In `app/vitest.config.ts`, add `'onboarding/**/*.test.ts'` to `test.include` (it currently lists theme + data). The vitest `@curio/shared` alias is already present.

- [ ] **Step 2: Write `app/onboarding/types.ts`**

```ts
import type { Profile } from '@curio/shared';

export type AgeBand = Profile['ageBand'];
export type Depth = Profile['defaultDepth'];
export type NotifPermission = Profile['notifPermission'];

export interface OnboardingDraft {
  name?: string;
  avatarKey?: string;
  ageBand?: AgeBand;
  interests: string[];
  dailyTime?: string;
  defaultDepth?: Depth;
  notifPermission?: NotifPermission;
}

export interface StepProps {
  draft: OnboardingDraft;
  patch: (p: Partial<OnboardingDraft>) => void;
  next: () => void;
  finish: () => void;
}
```

- [ ] **Step 3: Write the failing test** — `app/onboarding/buildProfile.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ProfileSchema } from '@curio/shared';
import { buildProfile } from './buildProfile';
import type { OnboardingDraft } from './types';

const DEVICE_ID = 'd1a2b3c4-1111-2222-3333-444455556666';

const complete: OnboardingDraft = {
  name: 'Vera',
  avatarKey: 'avatar-fox',
  ageBand: '18-24',
  interests: ['earth-and-sky', 'biology', 'space'],
  dailyTime: '08:00',
  defaultDepth: 'quick',
  notifPermission: 'granted',
};

describe('buildProfile', () => {
  it('builds a ProfileSchema-valid profile from a complete draft', () => {
    const profile = buildProfile(complete, DEVICE_ID);
    expect(ProfileSchema.safeParse(profile).success).toBe(true);
    expect(profile.deviceId).toBe(DEVICE_ID);
    expect(profile.name).toBe('Vera');
  });

  it('omits name when blank/whitespace', () => {
    const profile = buildProfile({ ...complete, name: '   ' }, DEVICE_ID);
    expect(profile.name).toBeUndefined();
    expect(ProfileSchema.safeParse(profile).success).toBe(true);
  });

  it('accepts interests at the 3 and 7 bounds', () => {
    const three = buildProfile({ ...complete, interests: ['a', 'b', 'c'] }, DEVICE_ID);
    const seven = buildProfile({ ...complete, interests: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }, DEVICE_ID);
    expect(ProfileSchema.safeParse(three).success).toBe(true);
    expect(ProfileSchema.safeParse(seven).success).toBe(true);
  });

  it('throws on an incomplete draft (missing avatarKey)', () => {
    const { avatarKey: _omit, ...partial } = complete;
    expect(() => buildProfile(partial as OnboardingDraft, DEVICE_ID)).toThrow();
  });
});
```

- [ ] **Step 4: Run — expect FAIL.** `pnpm --filter @curio/app test`

- [ ] **Step 5: Write `app/onboarding/buildProfile.ts`**

```ts
import type { Profile } from '@curio/shared';
import { ProfileSchema } from '@curio/shared';
import type { OnboardingDraft } from './types';

// Assembles a Profile from the wizard draft and validates it.
// Throws (via ProfileSchema.parse) if the draft is incomplete — the Done step
// only calls this once every required step is satisfied.
export function buildProfile(draft: OnboardingDraft, deviceId: string): Profile {
  const name = draft.name?.trim();
  const candidate = {
    deviceId,
    ...(name ? { name } : {}),
    avatarKey: draft.avatarKey,
    ageBand: draft.ageBand,
    interests: draft.interests,
    dailyTime: draft.dailyTime,
    defaultDepth: draft.defaultDepth,
    notifPermission: draft.notifPermission,
  };
  return ProfileSchema.parse(candidate);
}
```

- [ ] **Step 6: Run — expect PASS.** Then write `app/storage/profile.ts` (AsyncStorage I/O — verified by running, not unit-tested):

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import type { Profile } from '@curio/shared';
import { ProfileSchema } from '@curio/shared';

const PROFILE_KEY = 'curio.profile';
const DEVICE_ID_KEY = 'curio.deviceId';

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export async function getProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const result = ProfileSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  const valid = ProfileSchema.parse(profile);
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(valid));
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
```

- [ ] **Step 7: Verify + commit**

```bash
pnpm --filter @curio/app test && pnpm --filter @curio/app typecheck && pnpm lint
git add app/onboarding/types.ts app/onboarding/buildProfile.ts app/onboarding/buildProfile.test.ts app/storage/profile.ts app/tsconfig.json app/vitest.config.ts
git commit -m "feat(app): profile store + buildProfile (tested)"
```

---

### Task 5: Wizard shell + step stubs + first-run gate

**Files:** Create `app/app/onboarding.tsx`, the 9 files in `app/onboarding/steps/`. Modify `app/app/index.tsx`.

> The shell renders the current step via a `switch`. To let the shell compile and the flow be walkable, create all 9 step components as minimal stubs now; Tasks 6–9 replace them. Each stub renders the step name + a primary button calling `next()` (or `finish()` for Done).

- [ ] **Step 1: Create the 9 stub step files.** Each file `app/onboarding/steps/<Name>.tsx` has this content (substitute the component name and label per the table; the Done stub calls `finish` instead of `next`):

```tsx
import { View } from 'react-native';
import { ClayButton, Text } from '../../components';
import type { StepProps } from '../types';

export function Welcome({ next }: StepProps) {
  return (
    <View style={{ gap: 16 }}>
      <Text variant="title">Welcome</Text>
      <ClayButton label="Next →" variant="coral" onPress={next} />
    </View>
  );
}
```

Files + component names + label + (Done uses `finish`):
| File | Component | Label |
|---|---|---|
| `Welcome.tsx` | `Welcome` | Welcome |
| `NameStep.tsx` | `NameStep` | Name |
| `AvatarStep.tsx` | `AvatarStep` | Avatar |
| `AgeStep.tsx` | `AgeStep` | Age |
| `InterestsStep.tsx` | `InterestsStep` | Interests |
| `TimeStep.tsx` | `TimeStep` | Daily time |
| `DepthStep.tsx` | `DepthStep` | Depth |
| `NotificationsStep.tsx` | `NotificationsStep` | Notifications |
| `DoneStep.tsx` | `DoneStep` (button calls `finish`) | You're set |

- [ ] **Step 2: Write the shell `app/app/onboarding.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useReducer } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, ProgressDots } from '../components';
import { buildProfile } from '../onboarding/buildProfile';
import { AgeStep } from '../onboarding/steps/AgeStep';
import { AvatarStep } from '../onboarding/steps/AvatarStep';
import { DepthStep } from '../onboarding/steps/DepthStep';
import { DoneStep } from '../onboarding/steps/DoneStep';
import { InterestsStep } from '../onboarding/steps/InterestsStep';
import { NameStep } from '../onboarding/steps/NameStep';
import { NotificationsStep } from '../onboarding/steps/NotificationsStep';
import { TimeStep } from '../onboarding/steps/TimeStep';
import { Welcome } from '../onboarding/steps/Welcome';
import type { OnboardingDraft, StepProps } from '../onboarding/types';
import { getDeviceId, saveProfile } from '../storage/profile';
import { Reveal } from '../motion';
import { theme } from '../theme';

const STEP_COUNT = 9;

type State = { step: number; draft: OnboardingDraft };
type Action =
  | { type: 'patch'; patch: Partial<OnboardingDraft> }
  | { type: 'next' }
  | { type: 'back' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'patch':
      return { ...state, draft: { ...state.draft, ...action.patch } };
    case 'next':
      return { ...state, step: Math.min(state.step + 1, STEP_COUNT - 1) };
    case 'back':
      return { ...state, step: Math.max(state.step - 1, 0) };
  }
}

export default function Onboarding() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, { step: 0, draft: { interests: [] } });

  const stepProps: StepProps = {
    draft: state.draft,
    patch: (patch) => dispatch({ type: 'patch', patch }),
    next: () => dispatch({ type: 'next' }),
    finish: async () => {
      const deviceId = await getDeviceId();
      await saveProfile(buildProfile(state.draft, deviceId));
      router.replace('/');
    },
  };

  const steps = [
    Welcome,
    NameStep,
    AvatarStep,
    AgeStep,
    InterestsStep,
    TimeStep,
    DepthStep,
    NotificationsStep,
    DoneStep,
  ];
  const Step = steps[state.step];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.side}>
          {state.step > 0 ? (
            <IconButton icon="←" accessibilityLabel="Back" onPress={() => dispatch({ type: 'back' })} />
          ) : null}
        </View>
        <ProgressDots count={STEP_COUNT} index={state.step} />
        <View style={styles.side} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal key={state.step}>
          <Step {...stepProps} />
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
  side: { width: 46 },
  body: { padding: theme.space.lg, flexGrow: 1, justifyContent: 'center' },
});
```

- [ ] **Step 3: Modify `app/app/index.tsx` — add the first-run gate.** Replace the file with the version below (it keeps the Today screen and adds the profile gate):

```tsx
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text, TopicHeroCard } from '../components';
import type { Depth } from '../components/TopicHeroCard';
import { todayTopic } from '../data/topics';
import { Reveal } from '../motion';
import { getProfile } from '../storage/profile';
import { theme } from '../theme';

type GateState = 'loading' | 'onboard' | 'ready';

export default function Today() {
  const router = useRouter();
  const topic = todayTopic();
  const [gate, setGate] = useState<GateState>('loading');

  useEffect(() => {
    let mounted = true;
    getProfile().then((profile) => {
      if (mounted) {
        setGate(profile ? 'ready' : 'onboard');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (gate === 'loading') {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.color.indigo} />
      </SafeAreaView>
    );
  }
  if (gate === 'onboard') {
    return <Redirect href="/onboarding" />;
  }

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
  center: { alignItems: 'center', justifyContent: 'center' },
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

- [ ] **Step 4: Regenerate typed routes, verify**

```bash
pnpm --filter @curio/app exec expo start --web --port 8081 > /tmp/curio-ob.log 2>&1 &
sleep 14
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081
pkill -f "expo start" 2>/dev/null
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: HTTP 200; typecheck 0 (the new `/onboarding` route is typed so `<Redirect href="/onboarding">` and `router.replace('/')` resolve); lint 0. If lint reformats, `pnpm lint:fix`, re-verify.

- [ ] **Step 5: Commit**

```bash
git add app/app/onboarding.tsx app/onboarding/steps app/app/index.tsx
git commit -m "feat(app): onboarding wizard shell + first-run gate"
```

---

### Task 6: Welcome, Name, Depth steps

**Files:** Replace `app/onboarding/steps/Welcome.tsx`, `NameStep.tsx`, `DepthStep.tsx`

- [ ] **Step 1: `Welcome.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';
import { ClayButton, Text } from '../../components';
import { Pulse } from '../../motion';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function Welcome({ next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="display" style={styles.hero}>
        🦉✨
      </Text>
      <Text variant="display" color="ink">
        Stay curious.
      </Text>
      <Text variant="body" color="inkSoft">
        One surprising thing a day. Two minutes, or a deep dive.
      </Text>
      <Pulse>
        <ClayButton label="Get started →" variant="coral" onPress={next} style={styles.cta} />
      </Pulse>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.md },
  hero: { fontSize: 56, lineHeight: 64 },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 2: `NameStep.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';
import { ClayButton, Text, TextField } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function NameStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        What should we call you?
      </Text>
      <TextField
        value={draft.name ?? ''}
        onChangeText={(name) => patch({ name })}
        placeholder="Your name"
        accessibilityLabel="Your name"
      />
      <ClayButton label="Next →" variant="coral" onPress={next} style={styles.cta} />
      <ClayButton
        label="Skip"
        variant="ghost"
        onPress={() => {
          patch({ name: undefined });
          next();
        }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.xs },
});
```

- [ ] **Step 3: `DepthStep.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';
import { ClayButton, SegmentedToggle, Text } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function DepthStep({ draft, patch, next }: StepProps) {
  const value = draft.defaultDepth === 'deep' ? 'Deep' : 'Quick';
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        Quick or deep?
      </Text>
      <Text variant="body" color="inkSoft">
        Your default each day — you can switch any time.
      </Text>
      <SegmentedToggle
        options={['Quick', 'Deep']}
        value={value}
        onChange={(v) => patch({ defaultDepth: v === 'Deep' ? 'deep' : 'quick' })}
      />
      <ClayButton
        label="Next →"
        variant="coral"
        onPress={() => {
          if (!draft.defaultDepth) {
            patch({ defaultDepth: 'quick' });
          }
          next();
        }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 4: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/onboarding/steps/Welcome.tsx app/onboarding/steps/NameStep.tsx app/onboarding/steps/DepthStep.tsx
git commit -m "feat(app): onboarding Welcome, Name, Depth steps"
```

---

### Task 7: Avatar, Age steps

**Files:** Replace `app/onboarding/steps/AvatarStep.tsx`, `AgeStep.tsx`

- [ ] **Step 1: `AvatarStep.tsx`**

```tsx
import { Pressable, StyleSheet, View } from 'react-native';
import { AVATAR_KEYS, Avatar, ClayButton, Text } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function AvatarStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        Pick a face
      </Text>
      <View style={styles.grid}>
        {AVATAR_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => patch({ avatarKey: key })}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${key}`}
            accessibilityState={{ selected: draft.avatarKey === key }}
            style={[styles.cell, draft.avatarKey === key ? styles.selected : null]}
          >
            <Avatar avatarKey={key} size="lg" />
          </Pressable>
        ))}
      </View>
      <ClayButton
        label="Next →"
        variant="coral"
        disabled={!draft.avatarKey}
        onPress={next}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, justifyContent: 'center' },
  cell: { borderRadius: theme.radius.md, padding: 4 },
  selected: { borderWidth: 2, borderColor: theme.color.indigo },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 2: `AgeStep.tsx`** (single-choice → auto-advance on tap)

```tsx
import { StyleSheet, View } from 'react-native';
import { Pill, Text } from '../../components';
import { theme } from '../../theme';
import type { AgeBand, StepProps } from '../types';

const BANDS: { value: AgeBand; label: string }[] = [
  { value: 'under-13', label: 'Under 13' },
  { value: '13-17', label: '13–17' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+', label: '55+' },
];

export function AgeStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        How old are you?
      </Text>
      <Text variant="body" color="inkSoft">
        Tunes how content is pitched.
      </Text>
      <View style={styles.row}>
        {BANDS.map((b) => (
          <Pill
            key={b.value}
            label={b.label}
            selected={draft.ageBand === b.value}
            onPress={() => {
              patch({ ageBand: b.value });
              next();
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: theme.space.sm },
});
```

- [ ] **Step 3: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/onboarding/steps/AvatarStep.tsx app/onboarding/steps/AgeStep.tsx
git commit -m "feat(app): onboarding Avatar + Age steps"
```

---

### Task 8: Interests, Time steps

**Files:** Replace `app/onboarding/steps/InterestsStep.tsx`, `TimeStep.tsx`

- [ ] **Step 1: `InterestsStep.tsx`** (multi-select, 3–7)

```tsx
import { StyleSheet, View } from 'react-native';
import { ClayButton, Pill, Text } from '../../components';
import { CATEGORIES } from '../../data/categories';
import { theme } from '../../theme';
import type { StepProps } from '../types';

const MIN = 3;
const MAX = 7;

export function InterestsStep({ draft, patch, next }: StepProps) {
  const selected = draft.interests;

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      patch({ interests: selected.filter((s) => s !== slug) });
    } else if (selected.length < MAX) {
      patch({ interests: [...selected, slug] });
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        What are you into?
      </Text>
      <Text variant="meta" color="inkSoft">
        Pick {MIN}–{MAX} · {selected.length} chosen
      </Text>
      <View style={styles.row}>
        {CATEGORIES.map((c) => (
          <Pill
            key={c.slug}
            label={`${c.emoji} ${c.name}`}
            tint={theme.categoryColor[c.colorToken]}
            selected={selected.includes(c.slug)}
            onPress={() => toggle(c.slug)}
          />
        ))}
      </View>
      <ClayButton
        label="Next →"
        variant="coral"
        disabled={selected.length < MIN}
        onPress={next}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 2: `TimeStep.tsx`** (preset chips auto-advance + custom inline stepper)

```tsx
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ClayButton, IconButton, Pill, Text } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

const PRESETS = [
  { label: '🌅 Morning · 8:00', value: '08:00' },
  { label: '☀️ Midday · 12:00', value: '12:00' },
  { label: '🌆 Evening · 18:00', value: '18:00' },
  { label: '🌙 Night · 21:00', value: '21:00' },
];

function hhmm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function TimeStep({ draft, patch, next }: StepProps) {
  const [custom, setCustom] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  if (custom) {
    return (
      <View style={styles.wrap}>
        <Text variant="title" color="ink">
          Pick a time
        </Text>
        <View style={styles.stepper}>
          <IconButton icon="−" accessibilityLabel="Earlier hour" onPress={() => setHour((h) => (h + 23) % 24)} />
          <Text variant="display" color="ink">
            {hhmm(hour, minute)}
          </Text>
          <IconButton icon="+" accessibilityLabel="Later hour" onPress={() => setHour((h) => (h + 1) % 24)} />
        </View>
        <View style={styles.stepper}>
          <IconButton icon="−" accessibilityLabel="Earlier minutes" onPress={() => setMinute((m) => (m === 0 ? 30 : 0))} />
          <Text variant="meta" color="inkSoft">
            minutes
          </Text>
          <IconButton icon="+" accessibilityLabel="Later minutes" onPress={() => setMinute((m) => (m === 0 ? 30 : 0))} />
        </View>
        <ClayButton
          label="Set time →"
          variant="coral"
          onPress={() => {
            patch({ dailyTime: hhmm(hour, minute) });
            next();
          }}
          style={styles.cta}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        When should we nudge you?
      </Text>
      <View style={styles.row}>
        {PRESETS.map((p) => (
          <Pill
            key={p.value}
            label={p.label}
            selected={draft.dailyTime === p.value}
            onPress={() => {
              patch({ dailyTime: p.value });
              next();
            }}
          />
        ))}
      </View>
      <ClayButton label="Custom…" variant="ghost" onPress={() => setCustom(true)} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: theme.space.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 3: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/onboarding/steps/InterestsStep.tsx app/onboarding/steps/TimeStep.tsx
git commit -m "feat(app): onboarding Interests + Time steps"
```

---

### Task 9: Notifications, Done steps

**Files:** Replace `app/onboarding/steps/NotificationsStep.tsx`, `DoneStep.tsx`

- [ ] **Step 1: `NotificationsStep.tsx`**

```tsx
import * as Notifications from 'expo-notifications';
import { Platform, StyleSheet, View } from 'react-native';
import { ClayButton, Text } from '../../components';
import { theme } from '../../theme';
import type { NotifPermission, StepProps } from '../types';

function toPermission(status: Notifications.PermissionStatus): NotifPermission {
  if (status === 'granted') {
    return 'granted';
  }
  if (status === 'denied') {
    return 'denied';
  }
  return 'undetermined';
}

export function NotificationsStep({ patch, next }: StepProps) {
  const allow = async () => {
    if (Platform.OS === 'web') {
      patch({ notifPermission: 'undetermined' });
      next();
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    patch({ notifPermission: toPermission(status) });
    next();
  };

  return (
    <View style={styles.wrap}>
      <Text variant="display" style={styles.hero}>
        🔔
      </Text>
      <Text variant="title" color="ink">
        One gentle nudge a day
      </Text>
      <Text variant="body" color="inkSoft">
        No spam — just your daily spark, at the time you picked.
      </Text>
      <ClayButton label="Allow notifications" variant="coral" onPress={allow} style={styles.cta} />
      <ClayButton
        label="Maybe later"
        variant="ghost"
        onPress={() => {
          patch({ notifPermission: 'undetermined' });
          next();
        }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  hero: { fontSize: 48, lineHeight: 56 },
  cta: { alignSelf: 'stretch', marginTop: theme.space.xs },
});
```

- [ ] **Step 2: `DoneStep.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';
import { Avatar, ClayButton, Text } from '../../components';
import { Burst } from '../../motion';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function DoneStep({ draft, finish }: StepProps) {
  const name = draft.name?.trim();
  return (
    <View style={styles.wrap}>
      <Burst active />
      <View style={styles.avatar}>
        <Avatar avatarKey={draft.avatarKey ?? 'avatar-fox'} size="lg" />
      </View>
      <Text variant="display" color="ink">
        {name ? `You're all set, ${name}!` : "You're all set!"}
      </Text>
      <Text variant="body" color="inkSoft">
        Your first topic is waiting.
      </Text>
      <ClayButton label="Start exploring →" variant="coral" onPress={finish} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm, alignItems: 'center' },
  avatar: { marginBottom: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 3: Verify + commit**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
git add app/onboarding/steps/NotificationsStep.tsx app/onboarding/steps/DoneStep.tsx
git commit -m "feat(app): onboarding Notifications + Done steps"
```

---

### Task 10: Verification run + PR

- [ ] **Step 1: Monorepo checks**

```bash
cd /Users/vera/Documents/Curio
pnpm lint && pnpm typecheck && pnpm test
```

Expected: all green (shared 20, api 2, authoring 3, app: theme 8 + topic 3 + categories 3 + buildProfile 4 = 18).

- [ ] **Step 2: Boot web + walk the flow**

```bash
pnpm --filter @curio/app start
```

Press `w`. With no stored profile, the app redirects to onboarding. Walk all nine steps: Welcome → Name (try Skip and typing) → Avatar (Next disabled until one picked) → Age (tap auto-advances) → Interests (Next disabled until 3; cap at 7) → Time (preset auto-advances; try Custom…) → Depth → Notifications (web stores 'undetermined') → Done (confetti) → lands on Today. Reload → goes straight to Today (profile persisted in localStorage). In devtools, clearing `localStorage` and reloading returns to onboarding.

- [ ] **Step 3: Simulator**

Press `i`/`a`. Walk the flow; on the Notifications step confirm the native OS permission prompt appears; confirm persistence across relaunch.

- [ ] **Step 4: Reduced-motion + a11y**

Reduce Motion on → step entrances/confetti degrade; flow still completes. VoiceOver: Pills announce selection, ProgressDots announce step n of 9, the name field is labelled.

- [ ] **Step 5: Push + PR**

```bash
git push -u origin feat/onboarding
gh pr create \
  --title "Onboarding: 9-step wizard + profile store + first-run gate" \
  --body "$(cat <<'EOF'
## Summary
- 9-step onboarding wizard (Welcome → … → Done) building a device-local profile
- AsyncStorage profile store + first-run gate (no profile → onboarding, else Today)
- buildProfile validated against @curio/shared ProfileSchema (unit-tested)
- 8-category interests fixture, 6-avatar set, expo-notifications permission step
- Adds async-storage, expo-crypto, expo-notifications

## Test plan
- [x] pnpm lint && pnpm typecheck && pnpm test (buildProfile + categories parse schemas)
- [ ] Manual: fresh start → onboarding → all 9 steps → Today; relaunch skips onboarding; web + simulator; reduced-motion + VoiceOver

## Spec & plan
- docs/superpowers/specs/2026-06-03-onboarding-design.md
- docs/superpowers/plans/2026-06-03-onboarding.md

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
| §4 profile store + buildProfile | Task 4 |
| §5 categories fixture | Task 2 |
| §6 avatar set | Task 3 |
| §7 wizard + 9 steps | Tasks 5–9 |
| §8 first-run gate | Task 5 |
| §9 deps | Task 1 |
| §10 verification | Task 10 |

**Deferred:** SQLite (history/saved/catalog), server /devices registration + local-notif scheduling, profile editing, MMKV.

## Done when
- PR `feat/onboarding` open, CI green, reviewed and merged by a human.
