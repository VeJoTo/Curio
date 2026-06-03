# Profile Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an editable Profile screen reached from the Today avatar, reusing onboarding's inputs via two extracted shared controls, with a single validated Save.

**Architecture:** Bottom-up. First extract the heavy onboarding inputs (`AvatarPicker`, `TimePicker`) and a shared age-band list, keeping onboarding behavior identical. Then add pure draft helpers (validity/dirty/merge) with tests. Then the `profile.tsx` editor that composes controls + helpers + Save. Finally wire the Today avatar to navigate to it.

**Tech Stack:** Expo Router (file-based `Stack`), React Native, TypeScript, Zod (`@curio/shared`), Vitest (node env, pure-logic tests only — no component rendering).

**Conventions to follow (from the existing codebase):**
- Conditional rendering uses ternaries returning `null`, never `cond && <JSX>` (react-native-skills `rendering-no-falsy-and`).
- Styling via `StyleSheet.create`; spacing/colors from `theme`.
- Screens are `SafeAreaView` + header row + `ScrollView`, matching `onboarding.tsx` / `quiz.tsx`.
- Match the existing claymorphism design system (`ClayCard`, `Pill`, `ClayButton`, Fraunces/Manrope type) — do not introduce a new aesthetic.

---

### Task 1: Shared age-band list

`BANDS` currently lives inside `AgeStep`. Move it to a shared data module so the editor and the step use one source.

**Files:**
- Create: `app/data/ageBands.ts`
- Test: `app/data/ageBands.test.ts`
- Modify: `app/onboarding/steps/AgeStep.tsx`

(`data/**/*.test.ts` is already in the Vitest `include`, so no config change.)

- [ ] **Step 1: Write the failing test**

Create `app/data/ageBands.test.ts`:

```ts
import { ProfileSchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { AGE_BANDS } from './ageBands';

describe('AGE_BANDS', () => {
  it('covers exactly the age bands the schema accepts', () => {
    const schemaValues = [...ProfileSchema.shape.ageBand.options].sort();
    const listValues = AGE_BANDS.map((b) => b.value).sort();
    expect(listValues).toEqual(schemaValues);
  });

  it('gives every band a non-empty label', () => {
    for (const band of AGE_BANDS) {
      expect(band.label.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app && pnpm test -- ageBands`
Expected: FAIL — cannot resolve `./ageBands`.

- [ ] **Step 3: Create the shared module**

Create `app/data/ageBands.ts`:

```ts
import type { Profile } from '@curio/shared';

export type AgeBand = Profile['ageBand'];

export const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: 'under-13', label: 'Under 13' },
  { value: '13-17', label: '13–17' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+', label: '55+' },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app && pnpm test -- ageBands`
Expected: PASS — 2 tests green.

- [ ] **Step 5: Refactor AgeStep to use the shared list**

Replace the entire contents of `app/onboarding/steps/AgeStep.tsx` with (drops the local `BANDS` const and the now-unused `AgeBand` import):

```tsx
import { StyleSheet, View } from 'react-native';
import { Pill, Text } from '../../components';
import { AGE_BANDS } from '../../data/ageBands';
import { theme } from '../../theme';
import type { StepProps } from '../types';

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
        {AGE_BANDS.map((b) => (
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

- [ ] **Step 6: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS — no errors (no unused `AgeBand` import remains).

- [ ] **Step 7: Commit**

```bash
git add app/data/ageBands.ts app/data/ageBands.test.ts app/onboarding/steps/AgeStep.tsx
git commit -m "refactor(app): extract shared AGE_BANDS list

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: AvatarPicker control

Extract the avatar grid from `AvatarStep` into a controlled component used by both onboarding and the editor.

**Files:**
- Create: `app/components/AvatarPicker.tsx`
- Modify: `app/components/index.ts`
- Modify: `app/onboarding/steps/AvatarStep.tsx`

- [ ] **Step 1: Create the AvatarPicker component**

Create `app/components/AvatarPicker.tsx` (the grid markup + styles lifted verbatim from `AvatarStep`, now value/onChange-driven):

```tsx
import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { AVATAR_KEYS, AVATAR_NAMES, Avatar } from './Avatar';

interface AvatarPickerProps {
  value?: string;
  onChange: (key: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <View style={styles.grid}>
      {AVATAR_KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Choose ${AVATAR_NAMES[key] ?? key}`}
          accessibilityState={{ selected: value === key }}
          style={[styles.cell, value === key ? styles.selected : null]}
        >
          <Avatar avatarKey={key} size="lg" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, justifyContent: 'center' },
  cell: { borderRadius: theme.radius.md, padding: 4 },
  selected: { borderWidth: 2, borderColor: theme.color.indigo },
});
```

- [ ] **Step 2: Export it from the components barrel**

In `app/components/index.ts`, add this line in alphabetical position (right after the `Avatar` export on line 2):

```ts
export { AvatarPicker } from './AvatarPicker';
```

- [ ] **Step 3: Refactor AvatarStep to consume it**

Replace the entire contents of `app/onboarding/steps/AvatarStep.tsx` with:

```tsx
import { StyleSheet, View } from 'react-native';
import { AvatarPicker, ClayButton, Text } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function AvatarStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        Pick a face
      </Text>
      <AvatarPicker value={draft.avatarKey} onChange={(key) => patch({ avatarKey: key })} />
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
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

This preserves onboarding behavior exactly: same grid, same disabled-until-selected `Next →`.

- [ ] **Step 4: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS — no errors.

- [ ] **Step 5: Commit**

```bash
git add app/components/AvatarPicker.tsx app/components/index.ts app/onboarding/steps/AvatarStep.tsx
git commit -m "refactor(app): extract AvatarPicker control

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: TimePicker control

Extract the full time UI (presets + custom stepper) from `TimeStep` into a controlled component that emits `onChange` on commit but does not navigate.

**Files:**
- Create: `app/components/TimePicker.tsx`
- Modify: `app/components/index.ts`
- Modify: `app/onboarding/steps/TimeStep.tsx`

**Behavior note (one intentional, cosmetic deviation):** In onboarding today, switching to custom mode swaps the screen heading to "Pick a time". After this extraction the heading is owned by the *screen*, not the picker, so onboarding shows "When should we nudge you?" in both preset and custom mode. Every interaction (preset tap and custom "Set time →" both advance) is otherwise identical. This is the only behavioral change to onboarding and it is purely the custom-mode sub-heading text.

- [ ] **Step 1: Create the TimePicker component**

Create `app/components/TimePicker.tsx`:

```tsx
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { IconButton } from './IconButton';
import { Pill } from './Pill';
import { Text } from './Text';

const PRESETS = [
  { label: '🌅 Morning · 8:00', value: '08:00' },
  { label: '☀️ Midday · 12:00', value: '12:00' },
  { label: '🌆 Evening · 18:00', value: '18:00' },
  { label: '🌙 Night · 21:00', value: '21:00' },
];

function hhmm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface TimePickerProps {
  value?: string;
  onChange: (hhmm: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [custom, setCustom] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  if (custom) {
    return (
      <View style={styles.wrap}>
        <View style={styles.stepper}>
          <IconButton
            icon="−"
            accessibilityLabel="Earlier hour"
            onPress={() => setHour((h) => (h + 23) % 24)}
          />
          <Text variant="display" color="ink">
            {hhmm(hour, minute)}
          </Text>
          <IconButton
            icon="+"
            accessibilityLabel="Later hour"
            onPress={() => setHour((h) => (h + 1) % 24)}
          />
        </View>
        <View style={styles.stepper}>
          <IconButton
            icon="−"
            accessibilityLabel="Earlier minutes"
            onPress={() => setMinute((m) => (m + 45) % 60)}
          />
          <Text variant="meta" color="inkSoft">
            minutes
          </Text>
          <IconButton
            icon="+"
            accessibilityLabel="Later minutes"
            onPress={() => setMinute((m) => (m + 15) % 60)}
          />
        </View>
        <ClayButton
          label="Set time →"
          variant="coral"
          onPress={() => onChange(hhmm(hour, minute))}
          style={styles.cta}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {PRESETS.map((p) => (
          <Pill
            key={p.value}
            label={p.label}
            selected={value === p.value}
            onPress={() => onChange(p.value)}
          />
        ))}
      </View>
      <ClayButton
        label="Custom…"
        variant="ghost"
        onPress={() => setCustom(true)}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space.sm,
  },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 2: Export it from the components barrel**

In `app/components/index.ts`, add (alphabetical position is right before `TopicHeroCard`):

```ts
export { TimePicker } from './TimePicker';
```

- [ ] **Step 3: Refactor TimeStep to consume it**

Replace the entire contents of `app/onboarding/steps/TimeStep.tsx` with:

```tsx
import { StyleSheet, View } from 'react-native';
import { Text, TimePicker } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function TimeStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        When should we nudge you?
      </Text>
      <TimePicker
        value={draft.dailyTime}
        onChange={(t) => {
          patch({ dailyTime: t });
          next();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
});
```

Onboarding advance-on-commit is preserved: both a preset tap and the custom "Set time →" call `onChange`, which does `patch` + `next` — exactly as before.

- [ ] **Step 4: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS — no errors (no leftover unused imports like `IconButton`/`Pill` in `TimeStep`).

- [ ] **Step 5: Commit**

```bash
git add app/components/TimePicker.tsx app/components/index.ts app/onboarding/steps/TimeStep.tsx
git commit -m "refactor(app): extract TimePicker control

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Profile draft helpers (TDD)

Pure functions for the editor's validity, dirty-check, and merge-to-Profile logic. This is the only real branching logic, so it is fully unit-tested.

**Files:**
- Create: `app/profile/draft.ts`
- Test: `app/profile/draft.test.ts`
- Modify: `app/vitest.config.ts` (add `profile/**` to `include`)

- [ ] **Step 1: Register the test directory with Vitest**

In `app/vitest.config.ts`, add `'profile/**/*.test.ts'` to the `include` array (alongside the existing `theme`/`data`/`onboarding`/`today` entries). The array should read:

```ts
    include: [
      'theme/**/*.test.ts',
      'data/**/*.test.ts',
      'onboarding/**/*.test.ts',
      'today/**/*.test.ts',
      'profile/**/*.test.ts',
    ],
```

- [ ] **Step 2: Write the failing test**

Create `app/profile/draft.test.ts`:

```ts
import type { Profile } from '@curio/shared';
import { ProfileSchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { type ProfileDraft, draftFromProfile, isDirty, isValidDraft, toProfile } from './draft';

const PROFILE: Profile = {
  deviceId: 'd1a2b3c4-1111-2222-3333-444455556666',
  name: 'Vera',
  avatarKey: 'avatar-fox',
  ageBand: '25-34',
  interests: ['space', 'history', 'biology'],
  dailyTime: '08:00',
  defaultDepth: 'quick',
  notifPermission: 'granted',
};

const base = (): ProfileDraft => draftFromProfile(PROFILE);

describe('draftFromProfile', () => {
  it('copies the editable fields and clones interests', () => {
    const draft = draftFromProfile(PROFILE);
    expect(draft).toEqual({
      name: 'Vera',
      avatarKey: 'avatar-fox',
      ageBand: '25-34',
      interests: ['space', 'history', 'biology'],
      dailyTime: '08:00',
      defaultDepth: 'quick',
    });
    expect(draft.interests).not.toBe(PROFILE.interests);
  });
});

describe('isValidDraft', () => {
  it('is true for a complete draft', () => {
    expect(isValidDraft(base())).toBe(true);
  });

  it('is false when avatar or time is empty', () => {
    expect(isValidDraft({ ...base(), avatarKey: '' })).toBe(false);
    expect(isValidDraft({ ...base(), dailyTime: '' })).toBe(false);
  });

  it('is false when interests are out of the 3-7 range', () => {
    expect(isValidDraft({ ...base(), interests: ['a', 'b'] })).toBe(false);
    expect(isValidDraft({ ...base(), interests: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] })).toBe(false);
  });

  it('does not depend on name (name is optional)', () => {
    expect(isValidDraft({ ...base(), name: undefined })).toBe(true);
  });
});

describe('isDirty', () => {
  it('is false for an unchanged copy', () => {
    expect(isDirty(base(), base())).toBe(false);
  });

  it('is true when a scalar field changes', () => {
    expect(isDirty({ ...base(), defaultDepth: 'deep' }, base())).toBe(true);
    expect(isDirty({ ...base(), name: 'Nova' }, base())).toBe(true);
  });

  it('ignores interest ordering', () => {
    expect(isDirty({ ...base(), interests: ['history', 'biology', 'space'] }, base())).toBe(false);
  });

  it('is true when an interest is added or removed', () => {
    expect(isDirty({ ...base(), interests: ['space', 'history'] }, base())).toBe(true);
  });
});

describe('toProfile', () => {
  it('preserves deviceId and notifPermission from the base', () => {
    const next = toProfile({ ...base(), defaultDepth: 'deep' }, PROFILE);
    expect(next.deviceId).toBe(PROFILE.deviceId);
    expect(next.notifPermission).toBe('granted');
    expect(next.defaultDepth).toBe('deep');
  });

  it('normalizes a blank name to undefined', () => {
    expect(toProfile({ ...base(), name: '   ' }, PROFILE).name).toBeUndefined();
    expect(toProfile({ ...base(), name: undefined }, PROFILE).name).toBeUndefined();
  });

  it('trims a non-blank name', () => {
    expect(toProfile({ ...base(), name: '  Nova ' }, PROFILE).name).toBe('Nova');
  });

  it('produces a profile that passes ProfileSchema', () => {
    const next = toProfile({ ...base(), interests: ['space', 'art', 'music'] }, PROFILE);
    expect(ProfileSchema.safeParse(next).success).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd app && pnpm test -- profile/draft`
Expected: FAIL — cannot resolve `./draft`.

- [ ] **Step 4: Implement the helpers**

Create `app/profile/draft.ts`:

```ts
import type { Profile } from '@curio/shared';

export interface ProfileDraft {
  name?: string;
  avatarKey: string;
  ageBand: Profile['ageBand'];
  interests: string[];
  dailyTime: string;
  defaultDepth: Profile['defaultDepth'];
}

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 7;

/** Seed an editable draft from a stored profile (interests cloned so edits don't mutate it). */
export function draftFromProfile(p: Profile): ProfileDraft {
  return {
    name: p.name,
    avatarKey: p.avatarKey,
    ageBand: p.ageBand,
    interests: [...p.interests],
    dailyTime: p.dailyTime,
    defaultDepth: p.defaultDepth,
  };
}

/** Saveable when required fields are set and interests are within 3-7. Name is optional. */
export function isValidDraft(draft: ProfileDraft): boolean {
  return (
    draft.avatarKey.length > 0 &&
    draft.dailyTime.length > 0 &&
    draft.interests.length >= MIN_INTERESTS &&
    draft.interests.length <= MAX_INTERESTS
  );
}

function sameInterests(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, i) => value === sortedB[i]);
}

/** True when the draft differs from the originally-loaded values (interest order ignored). */
export function isDirty(draft: ProfileDraft, original: ProfileDraft): boolean {
  return (
    draft.name !== original.name ||
    draft.avatarKey !== original.avatarKey ||
    draft.ageBand !== original.ageBand ||
    draft.dailyTime !== original.dailyTime ||
    draft.defaultDepth !== original.defaultDepth ||
    !sameInterests(draft.interests, original.interests)
  );
}

/** Merge draft edits over the loaded profile, preserving deviceId/notifPermission and normalizing name. */
export function toProfile(draft: ProfileDraft, base: Profile): Profile {
  const name = draft.name?.trim();
  return {
    ...base,
    name: name ? name : undefined,
    avatarKey: draft.avatarKey,
    ageBand: draft.ageBand,
    interests: draft.interests,
    dailyTime: draft.dailyTime,
    defaultDepth: draft.defaultDepth,
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd app && pnpm test -- profile/draft`
Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add app/profile/draft.ts app/profile/draft.test.ts app/vitest.config.ts
git commit -m "feat(app): profile draft helpers (valid/dirty/merge)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Profile editor screen

The screen that composes the controls and helpers into an editable form with a single validated Save.

**Files:**
- Create: `app/app/profile.tsx`

- [ ] **Step 1: Create the screen**

Create `app/app/profile.tsx`:

```tsx
import type { Profile } from '@curio/shared';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import {
  AvatarPicker,
  ClayButton,
  ClayCard,
  IconButton,
  Pill,
  SegmentedToggle,
  Text,
  TextField,
  TimePicker,
} from '../components';
import { AGE_BANDS } from '../data/ageBands';
import { CATEGORIES } from '../data/categories';
import { Reveal } from '../motion';
import {
  type ProfileDraft,
  draftFromProfile,
  isDirty,
  isValidDraft,
  toProfile,
} from '../profile/draft';
import { clearProfile, getProfile, saveProfile } from '../storage/profile';
import { theme } from '../theme';

const MAX_INTERESTS = 7;

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; profile: Profile; original: ProfileDraft };

export default function ProfileScreen() {
  const router = useRouter();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getProfile().then((p) => {
      if (!mounted) {
        return;
      }
      if (p) {
        setLoad({ status: 'ready', profile: p, original: draftFromProfile(p) });
        setDraft(draftFromProfile(p));
      } else {
        setLoad({ status: 'missing' });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (load.status === 'loading') {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.color.indigo} />
      </SafeAreaView>
    );
  }
  if (load.status === 'missing' || !draft) {
    return <Redirect href="/onboarding" />;
  }

  const { profile, original } = load;
  const canSave = isDirty(draft, original) && isValidDraft(draft);

  const toggleInterest = (slug: string) => {
    if (draft.interests.includes(slug)) {
      setDraft({ ...draft, interests: draft.interests.filter((s) => s !== slug) });
    } else if (draft.interests.length < MAX_INTERESTS) {
      setDraft({ ...draft, interests: [...draft.interests, slug] });
    }
  };

  const onSave = async () => {
    try {
      setSaveError(false);
      await saveProfile(toProfile(draft, profile));
      router.back();
    } catch (err) {
      console.error('profile save failed', err);
      setSaveError(true);
    }
  };

  const onStartOver = () => {
    Alert.alert('Start over?', 'This clears your profile and restarts onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start over',
        style: 'destructive',
        onPress: () => {
          clearProfile()
            .then(() => router.replace('/onboarding'))
            .catch((err) => console.error('clearProfile failed', err));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="←" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text variant="title" color="ink">
          You
        </Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal>
          <ClayCard surface="cream">
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Avatar
            </Text>
            <AvatarPicker value={draft.avatarKey} onChange={(k) => setDraft({ ...draft, avatarKey: k })} />
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Name
            </Text>
            <TextField
              value={draft.name ?? ''}
              onChangeText={(name) => setDraft({ ...draft, name })}
              placeholder="Your name"
              accessibilityLabel="Your name"
            />
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Age
            </Text>
            <View style={styles.row}>
              {AGE_BANDS.map((b) => (
                <Pill
                  key={b.value}
                  label={b.label}
                  selected={draft.ageBand === b.value}
                  onPress={() => setDraft({ ...draft, ageBand: b.value })}
                />
              ))}
            </View>
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Interests · {draft.interests.length} chosen
            </Text>
            <View style={styles.row}>
              {CATEGORIES.map((c) => (
                <Pill
                  key={c.slug}
                  label={`${c.emoji} ${c.name}`}
                  tint={theme.categoryColor[c.colorToken]}
                  selected={draft.interests.includes(c.slug)}
                  onPress={() => toggleInterest(c.slug)}
                />
              ))}
            </View>
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Daily time
            </Text>
            <TimePicker value={draft.dailyTime} onChange={(t) => setDraft({ ...draft, dailyTime: t })} />
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Default depth
            </Text>
            <SegmentedToggle
              options={['Quick', 'Deep']}
              value={draft.defaultDepth === 'deep' ? 'Deep' : 'Quick'}
              onChange={(v) => setDraft({ ...draft, defaultDepth: v === 'Deep' ? 'deep' : 'quick' })}
            />
          </ClayCard>

          {saveError ? (
            <Text variant="meta" color="coral" style={styles.error}>
              Couldn't save. Please try again.
            </Text>
          ) : null}

          <ClayButton
            label="Save changes"
            variant="coral"
            disabled={!canSave}
            onPress={onSave}
            style={styles.save}
          />

          <Text variant="meta" color="inkSoft" style={styles.notif}>
            Notifications: {profile.notifPermission}
          </Text>
          <ClayButton label="Start over" variant="ghost" onPress={onStartOver} style={styles.startOver} />
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
  spacer: { width: 46 },
  body: { padding: theme.space.lg },
  card: { marginTop: theme.space.md },
  label: { marginBottom: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  error: { marginTop: theme.space.md },
  save: { alignSelf: 'stretch', marginTop: theme.space.lg },
  notif: { marginTop: theme.space.lg, textAlign: 'center' },
  startOver: { alignSelf: 'center', marginTop: theme.space.sm },
});
```

- [ ] **Step 2: Typecheck and lint**

Run: `cd app && pnpm typecheck`
Expected: PASS — no errors.

Run (from repo root): `pnpm lint`
Expected: PASS. If Biome reports import-ordering issues in `profile.tsx`, run `pnpm lint:fix`, re-check, and include the reformatted file in the commit.

- [ ] **Step 3: Commit**

```bash
git add app/app/profile.tsx
git commit -m "feat(app): editable profile screen

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Open Profile from the Today avatar

Make the header avatar on Today navigate to `/profile`.

**Files:**
- Modify: `app/app/index.tsx`

- [ ] **Step 1: Add Pressable to the imports**

In `app/app/index.tsx`, add `Pressable` to the `react-native` import. The line currently is:

```tsx
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
```

Change it to:

```tsx
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
```

- [ ] **Step 2: Wrap the avatar in a Pressable**

In the `ready`-branch header, the avatar currently renders as:

```tsx
        {profile ? <Avatar avatarKey={profile.avatarKey} size="sm" /> : null}
```

Replace it with:

```tsx
        {profile ? (
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <Avatar avatarKey={profile.avatarKey} size="sm" />
          </Pressable>
        ) : null}
```

(`router` is already defined at the top of the component. `Avatar` stays presentational; the Today screen owns the press.)

- [ ] **Step 3: Typecheck and lint**

Run: `cd app && pnpm typecheck`
Expected: PASS.

Run (from repo root): `pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/app/index.tsx
git commit -m "feat(app): open profile from the Today avatar

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] Full app test suite: `cd app && pnpm test` — all green (existing + new `ageBands` and `profile/draft` tests).
- [ ] `pnpm typecheck` and `pnpm lint` from repo root — both clean.
- [ ] Manual (web `pnpm start` → `w`, and/or simulator):
  - Tap the Today avatar → Profile opens with current values pre-filled.
  - "Save changes" is disabled until a change is made; reducing interests below 3 disables it; raising above 7 is prevented by the toggle.
  - Edit a field, Save → returns to Today; reopen Profile → change persisted; Today greeting/avatar/hero depth reflect the edit.
  - Walk onboarding (Avatar step + Time step, including Custom) — behaves as before (only the custom-mode sub-heading text differs, per Task 3's note).
  - "Start over" → confirm dialog → clears profile and lands on onboarding.
