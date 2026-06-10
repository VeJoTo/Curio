# Daily Journal & Streak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the result-screen reflection and record per-day completion so Today shows a "done for today" state with a grace streak (GitHub #5 + #6).

**Architecture:** One device-local `DayEntry` per calendar day (zod schema in `shared/`) backs both features. A thin AsyncStorage wrapper (`app/storage/journal.ts`, mirroring `storage/profile.ts`) reads/writes a `Record<dayKey, DayEntry>`. Pure, unit-tested helpers in `app/today/streak.ts` derive completion and the streak from that map. The result screen writes/pre-fills the entry; Today renders a `DoneTodayCard` when today is done.

**Tech Stack:** TypeScript, zod, Expo Router, React Native, AsyncStorage, Vitest (node for logic, jsdom for components).

**Spec:** `docs/superpowers/specs/2026-06-10-daily-journal-streak-design.md`

---

## File Structure

- Create `shared/src/schemas/journal.ts` — `DayEntrySchema` + `DayEntry` type.
- Modify `shared/src/index.ts` — re-export the new schema.
- Modify `shared/test/schemas.test.ts` — `DayEntrySchema` cases.
- Create `app/today/streak.ts` — `previousDayKey`, `isCompletedToday`, `computeStreak` (pure).
- Create `app/today/streak.test.ts` — pure-logic tests (node env).
- Create `app/storage/journal.ts` — `getJournal`, `getDay`, `recordDay` (thin wrapper, untested per repo convention — `storage/profile.ts` is likewise untested and there is no AsyncStorage test mock).
- Create `app/components/DoneTodayCard.tsx` — presentational done-state card.
- Create `app/components/DoneTodayCard.test.tsx` — render + interaction (jsdom).
- Modify `app/components/index.ts` — export `DoneTodayCard`.
- Modify `app/app/topic/[slug]/result.tsx` — pre-fill reflection on mount; persist `DayEntry` on "Done for today" (with surfaced error).
- Modify `app/app/index.tsx` — read journal on focus; render `DoneTodayCard` when today is completed.

Note on `[slug]` paths: in this zsh, `git add` paths containing `[slug]` must be quoted (e.g. `git add "app/app/topic/[slug]/result.tsx"`).

---

### Task 1: `DayEntry` schema in `shared/`

**Files:**
- Create: `shared/src/schemas/journal.ts`
- Modify: `shared/src/index.ts`
- Test: `shared/test/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Add to the bottom of `shared/test/schemas.test.ts` (and add the import at the top, next to the other schema imports):

```ts
import { type DayEntry, DayEntrySchema } from '../src/schemas/journal.js';
```

```ts
describe('DayEntrySchema', () => {
  const valid: DayEntry = {
    date: '2026-06-10',
    slug: 'the-northern-lights',
    score: 3,
    total: 5,
    reflection: 'Auroras are charged particles, not reflected light.',
    completedAt: '2026-06-10T20:00:00.000Z',
  };

  it('accepts a valid entry', () => {
    expect(DayEntrySchema.parse(valid)).toEqual(valid);
  });

  it('allows an empty reflection', () => {
    expect(DayEntrySchema.parse({ ...valid, reflection: '' }).reflection).toBe('');
  });

  it('rejects a negative score', () => {
    expect(DayEntrySchema.safeParse({ ...valid, score: -1 }).success).toBe(false);
  });

  it('rejects a malformed date', () => {
    expect(DayEntrySchema.safeParse({ ...valid, date: '6/10/2026' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd shared && pnpm test`
Expected: FAIL — cannot resolve `../src/schemas/journal.js` (module does not exist yet).

- [ ] **Step 3: Create the schema**

`shared/src/schemas/journal.ts`:

```ts
import { z } from 'zod';

/** One per-day journal entry: a completed topic plus its reflection. */
export const DayEntrySchema = z.object({
  // Local calendar day, "YYYY-MM-DD" — equals app `dayKey(date)`.
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
  slug: z.string().min(1),
  score: z.number().int().min(0),
  total: z.number().int().min(0),
  // May be "" — an empty reflection is allowed.
  reflection: z.string().max(2000),
  // ISO instant the day was marked done.
  completedAt: z.string().datetime(),
});
export type DayEntry = z.infer<typeof DayEntrySchema>;
```

- [ ] **Step 4: Re-export from the package entry**

In `shared/src/index.ts`, add after the existing exports:

```ts
export * from './schemas/journal.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd shared && pnpm test`
Expected: PASS — including the four new `DayEntrySchema` cases.

- [ ] **Step 6: Commit**

```bash
git add shared/src/schemas/journal.ts shared/src/index.ts shared/test/schemas.test.ts
git commit -m "feat(shared): DayEntry schema for the daily journal (#5, #6)"
```

---

### Task 2: Pure streak helpers

**Files:**
- Create: `app/today/streak.ts`
- Test: `app/today/streak.test.ts`

These are pure and deterministic — `today` is always passed in (never `Date.now()`), matching `app/today/selectTopic.ts`.

- [ ] **Step 1: Write the failing test**

`app/today/streak.test.ts`:

```ts
import type { DayEntry } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { computeStreak, isCompletedToday, previousDayKey } from './streak';

function entry(date: string): DayEntry {
  return { date, slug: 't', score: 1, total: 1, reflection: '', completedAt: `${date}T08:00:00.000Z` };
}
function journalOf(...dates: string[]): Record<string, DayEntry> {
  return Object.fromEntries(dates.map((d) => [d, entry(d)]));
}

// Thu 2026-06-11; prior days 06-10, 06-09, 06-08.
const today = new Date(2026, 5, 11);

describe('previousDayKey', () => {
  it('steps back one day, across month and year boundaries', () => {
    expect(previousDayKey('2026-06-11')).toBe('2026-06-10');
    expect(previousDayKey('2026-06-01')).toBe('2026-05-31');
    expect(previousDayKey('2026-01-01')).toBe('2025-12-31');
  });
});

describe('isCompletedToday', () => {
  it('is true only when today has an entry', () => {
    expect(isCompletedToday(journalOf('2026-06-11'), today)).toBe(true);
    expect(isCompletedToday(journalOf('2026-06-10'), today)).toBe(false);
    expect(isCompletedToday({}, today)).toBe(false);
  });
});

describe('computeStreak', () => {
  it('is 0 for an empty journal', () => {
    expect(computeStreak({}, today)).toBe(0);
  });

  it('counts today plus an unbroken prior run', () => {
    expect(computeStreak(journalOf('2026-06-11', '2026-06-10', '2026-06-09', '2026-06-08'), today)).toBe(4);
  });

  it('stays alive on yesterday (grace until end of day)', () => {
    expect(computeStreak(journalOf('2026-06-10', '2026-06-09', '2026-06-08'), today)).toBe(3);
  });

  it('is 0 once the last completion is two days ago', () => {
    expect(computeStreak(journalOf('2026-06-09', '2026-06-08'), today)).toBe(0);
  });

  it('counts only the run ending at the anchor', () => {
    // 06-10 present, 06-09 missing -> run from today is 06-11, 06-10 = 2.
    expect(computeStreak(journalOf('2026-06-11', '2026-06-10', '2026-06-08'), today)).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm vitest run streak`
Expected: FAIL — cannot resolve `./streak`.

- [ ] **Step 3: Write the implementation**

`app/today/streak.ts`:

```ts
import type { DayEntry } from '@curio/shared';
import { dayKey } from './selectTopic';

type Journal = Record<string, DayEntry>;

/** "YYYY-MM-DD" one calendar day earlier. Local components, so DST-safe. */
export function previousDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

export function isCompletedToday(journal: Journal, today: Date): boolean {
  return Boolean(journal[dayKey(today)]);
}

/**
 * Consecutive completed days. Grace until end of day: the streak is "alive" if
 * the most recent completion is today OR yesterday; it then counts back from
 * that anchor until a gap. A last completion two+ days old reads as 0.
 */
export function computeStreak(journal: Journal, today: Date): number {
  const todayKey = dayKey(today);
  let anchor: string;
  if (journal[todayKey]) {
    anchor = todayKey;
  } else {
    const yesterday = previousDayKey(todayKey);
    if (journal[yesterday]) {
      anchor = yesterday;
    } else {
      return 0;
    }
  }

  let count = 0;
  let cursor = anchor;
  while (journal[cursor]) {
    count += 1;
    cursor = previousDayKey(cursor);
  }
  return count;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && pnpm vitest run streak`
Expected: PASS — all `previousDayKey`, `isCompletedToday`, `computeStreak` cases.

- [ ] **Step 5: Commit**

```bash
git add app/today/streak.ts app/today/streak.test.ts
git commit -m "feat(app): pure streak + completion helpers (#6)"
```

---

### Task 3: Journal storage

**Files:**
- Create: `app/storage/journal.ts`

No unit test: this is a thin AsyncStorage wrapper and mirrors `app/storage/profile.ts`, which is itself untested (the repo has no AsyncStorage test mock). The validation/serialisation logic it relies on (`DayEntrySchema`) is covered by Task 1; the derivations are covered by Task 2.

- [ ] **Step 1: Write the implementation**

`app/storage/journal.ts`:

```ts
import type { DayEntry } from '@curio/shared';
import { DayEntrySchema } from '@curio/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_KEY = 'curio.journal';

type Journal = Record<string, DayEntry>;

export async function getJournal(): Promise<Journal> {
  // Never rejects: a read error, malformed JSON, or a bad shape resolves to {}.
  // Individual entries that fail validation are dropped; valid siblings kept.
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    const out: Journal = {};
    for (const [key, value] of Object.entries(parsed)) {
      const result = DayEntrySchema.safeParse(value);
      if (result.success) {
        out[key] = result.data;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function getDay(dayKey: string): Promise<DayEntry | null> {
  const journal = await getJournal();
  return journal[dayKey] ?? null;
}

export async function recordDay(entry: DayEntry): Promise<void> {
  const valid = DayEntrySchema.parse(entry);
  const journal = await getJournal();
  journal[valid.date] = valid; // upsert by day — re-completing overwrites
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
}
```

- [ ] **Step 2: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add app/storage/journal.ts
git commit -m "feat(app): journal AsyncStorage seam (#5, #6)"
```

---

### Task 4: Persist & pre-fill the reflection on the result screen

**Files:**
- Modify: `app/app/topic/[slug]/result.tsx`

Current relevant code — the imports, the mount effect, and the "Done for today" button:

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ClayButton, ScoreCard, Text, TextField } from '../../../components';
import { Reveal } from '../../../motion';
import { getProfile } from '../../../storage/profile';
import { theme } from '../../../theme';
```

```tsx
  useEffect(() => {
    let active = true;
    getProfile().then((p) => {
      if (active && p) {
        setAvatarKey(p.avatarKey);
      }
    });
    return () => {
      active = false;
    };
  }, []);
```

```tsx
          <ClayButton
            label="Done for today ✓"
            variant="coral"
            onPress={() => router.dismissAll()}
            style={styles.cta}
          />
```

- [ ] **Step 1: Update imports**

Replace the import block above with:

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ClayButton, ScoreCard, Text, TextField } from '../../../components';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { Reveal } from '../../../motion';
import { getDay, recordDay } from '../../../storage/journal';
import { getProfile } from '../../../storage/profile';
import { dayKey } from '../../../today/selectTopic';
import { theme } from '../../../theme';
```

- [ ] **Step 2: Pre-fill the reflection and add the save action**

Extend the mount effect to also load today's entry, and add a save error state + the finish action. Replace the existing `useEffect` block with:

```tsx
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile().then((p) => {
      if (active && p) {
        setAvatarKey(p.avatarKey);
      }
    });
    getDay(dayKey(new Date())).then((existing) => {
      if (active && existing) {
        setReflection(existing.reflection);
      }
    });
    return () => {
      active = false;
    };
  }, []);
```

Then, immediately after the `scoreNum` / `totalNum` lines, add:

```tsx
  const finish = async () => {
    setSaveError(false);
    try {
      await recordDay({
        date: dayKey(new Date()),
        slug: slug ?? '',
        score: scoreNum,
        total: totalNum,
        reflection,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('record day failed', err);
      setSaveError(true);
      return;
    }
    router.dismissAll();
  };
  const done = useAsyncAction(finish);
```

- [ ] **Step 3: Wire the button + error message**

Replace the "Done for today" `ClayButton` with an error line (above it) and the busy-aware button:

```tsx
          {saveError ? (
            <View accessibilityLiveRegion="polite" style={styles.error}>
              <Text variant="meta" color="coral">
                Couldn't save your reflection. Please try again.
              </Text>
            </View>
          ) : null}
          <ClayButton
            label="Done for today ✓"
            variant="coral"
            loading={done.pending}
            onPress={done.run}
            style={styles.cta}
          />
```

- [ ] **Step 4: Add the `error` style**

In the `StyleSheet.create({ ... })` for this screen, add an `error` entry next to `cta`:

```tsx
  error: { marginBottom: theme.space.sm, alignItems: 'center' },
```

- [ ] **Step 5: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Lint (formatting/imports)**

Run from the repo root: `npx biome check --write "app/app/topic/[slug]/result.tsx"` (auto-fixes import ordering/formatting), then `npx biome check "app/app/topic/[slug]/result.tsx"`.
Expected: exits clean (warnings about pre-existing `any` mocks are fine).

- [ ] **Step 7: Commit**

```bash
git add "app/app/topic/[slug]/result.tsx"
git commit -m "feat(app): persist & pre-fill the result reflection (#5)"
```

---

### Task 5: `DoneTodayCard` component

**Files:**
- Create: `app/components/DoneTodayCard.tsx`
- Modify: `app/components/index.ts`
- Test: `app/components/DoneTodayCard.test.tsx`

- [ ] **Step 1: Write the failing test**

`app/components/DoneTodayCard.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DoneTodayCard } from './DoneTodayCard';

afterEach(cleanup);

describe('DoneTodayCard', () => {
  it('shows the streak and fires onReadAgain', () => {
    const onReadAgain = vi.fn();
    render(<DoneTodayCard streak={4} onReadAgain={onReadAgain} />);
    expect(screen.getByText('🔥 4-day streak')).toBeTruthy();
    fireEvent.click(screen.getByText('Read it again'));
    expect(onReadAgain).toHaveBeenCalledOnce();
  });

  it('uses a gentle first-day message at streak 1', () => {
    render(<DoneTodayCard streak={1} onReadAgain={() => {}} />);
    expect(screen.getByText('Day 1 — nice start')).toBeTruthy();
    expect(screen.queryByText('🔥 1-day streak')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm vitest run DoneTodayCard`
Expected: FAIL — cannot resolve `./DoneTodayCard`.

- [ ] **Step 3: Write the component**

`app/components/DoneTodayCard.tsx`:

```tsx
import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { ClayCard } from './ClayCard';
import { Text } from './Text';

interface DoneTodayCardProps {
  streak: number;
  onReadAgain: () => void;
}

export function DoneTodayCard({ streak, onReadAgain }: DoneTodayCardProps) {
  const streakLine = streak <= 1 ? 'Day 1 — nice start' : `🔥 ${streak}-day streak`;
  return (
    <ClayCard surface="cream">
      <Text variant="meta" color="inkSoft" accessibilityLiveRegion="polite">
        {streakLine}
      </Text>
      <Text variant="display" color="ink" style={styles.title}>
        Done for today ✨
      </Text>
      <Text variant="body" color="inkSoft" style={styles.body}>
        Come back tomorrow for a fresh topic.
      </Text>
      <ClayButton
        label="Read it again"
        variant="ghost"
        onPress={onReadAgain}
        style={styles.cta}
      />
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: theme.space.sm },
  body: { marginTop: theme.space.xs },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 4: Export it**

In `app/components/index.ts`, add (keep the list alphabetical — after `ClayCard`):

```ts
export { DoneTodayCard } from './DoneTodayCard';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd app && pnpm vitest run DoneTodayCard`
Expected: PASS — both cases.

- [ ] **Step 6: Commit**

```bash
git add app/components/DoneTodayCard.tsx app/components/DoneTodayCard.test.tsx app/components/index.ts
git commit -m "feat(app): DoneTodayCard done-state component (#6)"
```

---

### Task 6: Today done-state wiring

**Files:**
- Modify: `app/app/index.tsx`

Current relevant code — imports, the focus effect, and the hero render:

```tsx
import { Avatar, Text, TopicHeroCard } from '../components';
import type { Depth } from '../components/TopicHeroCard';
import { todayTopic } from '../data/topics';
import { Reveal } from '../motion';
import { getProfile } from '../storage/profile';
```

```tsx
  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProfile().then((p) => {
        if (active) {
          setProfile(p);
          setGate(p ? 'ready' : 'onboard');
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );
```

```tsx
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal>
          <TopicHeroCard topic={topic} onExplore={onExplore} initialDepth={profile?.defaultDepth} />
        </Reveal>
      </ScrollView>
```

- [ ] **Step 1: Update imports**

Replace the import lines above with:

```tsx
import type { DayEntry, Profile } from '@curio/shared';
import { Avatar, DoneTodayCard, Text, TopicHeroCard } from '../components';
import type { Depth } from '../components/TopicHeroCard';
import { todayTopic } from '../data/topics';
import { Reveal } from '../motion';
import { getJournal } from '../storage/journal';
import { getProfile } from '../storage/profile';
import { computeStreak, isCompletedToday } from '../today/streak';
```

Note: `Profile` is already imported at the top of the file via `import type { Profile } from '@curio/shared';`. Merge the `DayEntry` import into that existing line rather than duplicating it — the final import should read `import type { DayEntry, Profile } from '@curio/shared';` and the standalone `Profile` import (if separate) removed.

- [ ] **Step 2: Add journal state and load it on focus**

Add the journal state next to `profile`:

```tsx
  const [journal, setJournal] = useState<Record<string, DayEntry>>({});
```

Replace the focus effect body to load profile and journal together:

```tsx
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getProfile(), getJournal()]).then(([p, j]) => {
        if (active) {
          setProfile(p);
          setJournal(j);
          setGate(p ? 'ready' : 'onboard');
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );
```

- [ ] **Step 3: Compute done/streak and the revisit handler**

After the existing `const topic = todayTopic(profile ?? undefined);` line, add:

```tsx
  const now = new Date();
  const done = isCompletedToday(journal, now);
  const streak = computeStreak(journal, now);

  const onReadAgain = () => {
    router.push({
      pathname: '/topic/[slug]',
      params: { slug: topic.slug, depth: profile?.defaultDepth ?? 'quick' },
    });
  };
```

- [ ] **Step 4: Render the done card when completed**

Replace the `<Reveal>` block inside the `ScrollView` with:

```tsx
        <Reveal>
          {done ? (
            <DoneTodayCard streak={streak} onReadAgain={onReadAgain} />
          ) : (
            <TopicHeroCard
              topic={topic}
              onExplore={onExplore}
              initialDepth={profile?.defaultDepth}
            />
          )}
        </Reveal>
```

- [ ] **Step 5: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Lint**

Run: `cd .. && pnpm lint`
Expected: EXIT 0 (only pre-existing `any`-mock warnings).

- [ ] **Step 7: Commit**

```bash
git add app/app/index.tsx
git commit -m "feat(app): show DoneTodayCard + streak on Today when done (#6)"
```

---

### Task 7: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `cd app && pnpm test` and `cd ../shared && pnpm test`
Expected: all PASS (app suite includes the new `streak` and `DoneTodayCard` tests; shared includes the `DayEntrySchema` cases).

- [ ] **Step 2: Typecheck the workspace**

Run: `cd ~/Documents/Curio && pnpm -r typecheck`
Expected: PASS for all packages.

- [ ] **Step 3: Lint the workspace**

Run: `cd ~/Documents/Curio && pnpm lint`
Expected: EXIT 0.

- [ ] **Step 4: Manual smoke (web preview)**

Start the app (`cd app && pnpm start --web`) and verify in a real browser (chrome-devtools MCP), per the web-preview note in project memory:
- Finish a topic → tap "Done for today" → returns to Today, which now shows the `DoneTodayCard` with "Day 1 — nice start".
- "Read it again" re-opens today's topic.
- Re-finish the topic, type a reflection, Done; re-open the result and confirm the reflection pre-fills.

Document the outcome (pass/fail with screenshot) rather than asserting success blind.

- [ ] **Step 5: Open the PR**

```bash
git push -u origin feat/daily-journal-streak
gh pr create --title "feat(app): daily journal — persist reflection + done-for-today streak (#5, #6)" --body "Closes #5 and #6. See docs/superpowers/specs/2026-06-10-daily-journal-streak-design.md."
```

Note in the PR description that it touches `result.tsx` and `index.tsx`, which the open #15/#16 PRs also touch — a rebase will be needed depending on merge order.
