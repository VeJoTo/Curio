# Today Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Today screen personal by using the profile it already loads — greet by name, show the chosen avatar in the header, and start the hero card's depth toggle on the user's `defaultDepth`.

**Architecture:** The Today route (`app/app/index.tsx`) already fetches the profile but keeps only a derived gate flag. Store the profile in state and feed it to (a) a two-line header with a pure `greetingLine()` helper + the existing `Avatar` component, and (b) a new optional `initialDepth` prop on `TopicHeroCard`. The only branching logic (the greeting) is extracted to a pure, node-testable helper; the rest is wiring verified by typecheck + manual run.

**Tech Stack:** Expo Router, React Native, TypeScript, Zod (`@curio/shared`), Vitest (node env, pure-logic tests only — no component rendering in this repo).

---

### Task 1: Greeting helper (pure, TDD)

The greeting is the one piece of real branching logic (name optional in `ProfileSchema`). Extract it so the Today JSX stays clean and the logic is unit-tested. New `today/` module mirrors the existing `onboarding/` module convention.

**Files:**
- Create: `app/today/greeting.ts`
- Test: `app/today/greeting.test.ts`
- Modify: `app/vitest.config.ts` (add `today/**` to `include`)

- [ ] **Step 1: Register the new test directory with Vitest**

In `app/vitest.config.ts`, extend the `include` array so the `today/` tests run:

```ts
    include: [
      'theme/**/*.test.ts',
      'data/**/*.test.ts',
      'onboarding/**/*.test.ts',
      'today/**/*.test.ts',
    ],
```

- [ ] **Step 2: Write the failing test**

Create `app/today/greeting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { greetingLine } from './greeting';

describe('greetingLine', () => {
  it('greets by name when present', () => {
    expect(greetingLine('Vera')).toBe('Hi, Vera 👋');
  });

  it('returns null when name is undefined', () => {
    expect(greetingLine(undefined)).toBeNull();
  });

  it('returns null for a blank/whitespace name', () => {
    expect(greetingLine('   ')).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd app && pnpm test -- today/greeting`
Expected: FAIL — cannot resolve `./greeting` (module does not exist yet).

- [ ] **Step 4: Write the minimal implementation**

Create `app/today/greeting.ts`:

```ts
/**
 * The personalized greeting line for the Today header, or `null` when the
 * profile has no usable name (`name` is optional in ProfileSchema). A null
 * result means the header omits the title line and shows only the "Today" meta.
 */
export function greetingLine(name?: string): string | null {
  const trimmed = name?.trim();
  return trimmed ? `Hi, ${trimmed} 👋` : null;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd app && pnpm test -- today/greeting`
Expected: PASS — 3 tests green.

- [ ] **Step 6: Commit**

```bash
git add app/today/greeting.ts app/today/greeting.test.ts app/vitest.config.ts
git commit -m "feat(app): greetingLine helper for Today header

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `initialDepth` prop on TopicHeroCard

Let the hero card start on the user's chosen depth. The toggle stays fully interactive — only the initial segment changes. Existing callers that omit the prop keep starting on Quick. (No render-test infra exists in this repo, so this is verified by typecheck; behavior is confirmed manually in Task 3.)

**Files:**
- Modify: `app/components/TopicHeroCard.tsx`

- [ ] **Step 1: Add the optional prop to the interface**

In `app/components/TopicHeroCard.tsx`, extend `TopicHeroCardProps`:

```ts
interface TopicHeroCardProps {
  topic: Topic;
  onExplore: (depth: Depth) => void;
  initialDepth?: Depth;
}
```

- [ ] **Step 2: Seed state from the prop**

Update the component signature and the `useState` call:

```ts
export function TopicHeroCard({ topic, onExplore, initialDepth = 'quick' }: TopicHeroCardProps) {
  const [depth, setDepth] = useState<Depth>(initialDepth);
```

Leave the rest of the component (toggle, `onExplore(depth)`, styles) unchanged.

- [ ] **Step 3: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS — no errors. (`Depth` is `'quick' | 'deep'`, matching `DepthSchema`/`profile.defaultDepth`.)

- [ ] **Step 4: Commit**

```bash
git add app/components/TopicHeroCard.tsx
git commit -m "feat(app): TopicHeroCard initialDepth prop (defaults to quick)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wire the profile into the Today screen

Keep the loaded profile in state, render the two-line greeting + real avatar in the header (display-only — no tap handler), and pass `defaultDepth` to the hero card.

**Files:**
- Modify: `app/app/index.tsx`

- [ ] **Step 1: Import the pieces**

In `app/app/index.tsx`, update imports. Add `Avatar` to the components import, drop `IconButton` (no longer used), import the `Profile` type and the greeting helper:

```ts
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import type { Profile } from '@curio/shared';
import { Avatar, Text, TopicHeroCard } from '../components';
import type { Depth } from '../components/TopicHeroCard';
import { todayTopic } from '../data/topics';
import { Reveal } from '../motion';
import { getProfile } from '../storage/profile';
import { greetingLine } from '../today/greeting';
import { theme } from '../theme';
```

(`Avatar` is already re-exported from `app/components/index.ts`, alongside `Text` and `TopicHeroCard`.)

- [ ] **Step 2: Store the profile in state**

Add profile state and set it in the loader (keep the `mounted` guard). Replace the existing `useState`/`useEffect` block:

```ts
  const router = useRouter();
  const topic = todayTopic();
  const [gate, setGate] = useState<GateState>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;
    getProfile().then((p) => {
      if (mounted) {
        setProfile(p);
        setGate(p ? 'ready' : 'onboard');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);
```

- [ ] **Step 3: Render greeting + avatar in the header, pass initialDepth**

The `loading` and `onboard` branches are unchanged. Replace the `ready` return (the header + body) with:

```ts
  const greeting = profile ? greetingLine(profile.name) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="meta" color="inkSoft">
            Today
          </Text>
          {greeting ? (
            <Text variant="title" color="ink">
              {greeting}
            </Text>
          ) : null}
        </View>
        {profile ? <Avatar avatarKey={profile.avatarKey} size="sm" /> : null}
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal>
          <TopicHeroCard
            topic={topic}
            onExplore={onExplore}
            initialDepth={profile?.defaultDepth}
          />
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
```

Keep the existing `onExplore` definition above the return unchanged.

- [ ] **Step 4: Add the `headerText` style**

In the `StyleSheet.create({...})` block, add a `headerText` entry (the `header` row already uses `space-between` + `alignItems: 'center'`, which works once it holds a text column on the left and the avatar on the right):

```ts
  headerText: { flex: 1 },
```

Leave `screen`, `center`, `header`, and `body` as they are.

- [ ] **Step 5: Typecheck and lint**

Run: `cd app && pnpm typecheck`
Expected: PASS — no errors, and no "IconButton declared but never used" (it was removed from imports).

Run (from repo root): `pnpm lint`
Expected: PASS — Biome clean.

- [ ] **Step 6: Manual verification**

Run: `cd app && pnpm start` (press `w` for web, or run on a simulator).

Verify, against a profile that has a name and `defaultDepth: 'deep'`:
- Today header shows "Today" with "Hi, {name} 👋" beneath it.
- The chosen avatar (not the generic 👤) appears top-right and does nothing when tapped.
- The hero card's depth toggle starts on **Deep**.

Then, to confirm graceful degradation with no name: in the running app clear the stored name (or re-run onboarding skipping the name step). Expected: no greeting line, header matches the original "Today"-only look; avatar still shows.

> If you don't have a name-less profile handy, this branch is already covered by the `greetingLine(undefined) === null` unit test from Task 1 — manual recheck is optional.

- [ ] **Step 7: Commit**

```bash
git add app/app/index.tsx
git commit -m "feat(app): personalize Today header with name, avatar, and default depth

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] Run the full app test suite: `cd app && pnpm test` — all green (existing + new greeting tests).
- [ ] Run `pnpm typecheck` and `pnpm lint` from repo root — both clean.
- [ ] Confirm the three manual checks in Task 3 Step 6 pass.
