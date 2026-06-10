# Daily Journal & Streak — Design

Date: 2026-06-10
Status: Approved (brainstorming)

Resolves GitHub issues **#5** (persist the reflection) and **#6** ('Done for
today' completion state + streak), designed together because they share one
per-day journal entry.

## Problem

Finishing a topic records nothing:

- The reflection captured on the result screen ("What's one thing that surprised
  you?") lives only in local component state and is discarded on **Done for
  today** (#5).
- Reopening the app re-offers the same topic with no sense of completion or
  progress, and there is no streak (#6).

## Scope

In scope:

- A device-local **journal**: one entry per calendar day capturing the
  completion and the reflection together.
- Persisting the reflection on **Done for today**, and reading it back when the
  result screen is reopened for a day that already has an entry (#5).
- Recording completion on **Done for today**; a **grace** streak derived from the
  journal (#6).
- A **done-state** on Today when today's topic is finished: streak + "come back
  tomorrow" + a quiet "Read it again", shown instead of the Explore hero.
- Pure, unit-tested helpers for the streak and the day key.

Out of scope (deferred):

- A history / past-reflections browsing view. The storage is shaped to support
  it later (`getJournal()` returns every entry), but no UI is built now.
- Any server sync of the journal (device-local only, like the profile).
- Changing what counts as "completed" beyond tapping **Done for today** (e.g.
  partial-quiz credit). Reaching the result screen and tapping Done is the
  single completion signal.
- Per-topic (rather than per-day) keying. Today offers one topic per day, so the
  journal is keyed by day.

## Data model

A new `DayEntry` zod schema in `shared/` (alongside `Profile`, which is also
device-local — keeps all schemas as the single source of truth):

```ts
// shared/src/schemas/journal.ts
export const DayEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // local calendar day, == dayKey()
  slug: z.string().min(1),
  score: z.number().int().min(0),
  total: z.number().int().min(0),
  reflection: z.string().max(2000), // may be "" — empty reflection is allowed
  completedAt: z.string().datetime(), // ISO instant the day was completed
});
export type DayEntry = z.infer<typeof DayEntrySchema>;
```

Notes:

- `date` is the canonical key and equals `dayKey(localDate)` from
  `app/today/selectTopic.ts` (`"YYYY-MM-DD"`, local calendar day).
- The entry's **existence** means "completed"; there is no separate `completed`
  boolean (a day with no entry is simply not done).
- `completedAt` is an ISO instant for ordering/future history; it is the only
  field that is a wall-clock timestamp, written at save time in the screen layer
  (not in pure helpers).
- Empty `reflection` is valid (#5 acceptance criterion).

## Architecture

### Storage — `app/storage/journal.ts`

Mirrors `app/storage/profile.ts` exactly (AsyncStorage seam, never-rejecting
reads, zod-validated writes):

- Key: `curio.journal`.
- On disk: a JSON object map `Record<dayKey, DayEntry>`.
- `getJournal(): Promise<Record<string, DayEntry>>` — never rejects. A read
  error, malformed JSON, or schema mismatch resolves to `{}`. Individual entries
  that fail validation are dropped; valid siblings are kept.
- `recordDay(entry: DayEntry): Promise<void>` — validates via `DayEntrySchema`,
  reads the current map, upserts by `entry.date` (re-completing the same day
  overwrites — idempotent), writes back.
- `getDay(dayKey: string): Promise<DayEntry | null>` — convenience read of one
  entry (used to pre-fill the reflection); never rejects.

### Pure helpers — `app/today/streak.ts`

Both take the journal map and an explicit `today: Date` (no `Date.now()` —
matches the pure, deterministic style of `today/selectTopic.ts`):

- `isCompletedToday(journal, today: Date): boolean` — `dayKey(today) in journal`.
- `computeStreak(journal, today: Date): number` — **grace until end of day**:
  1. Let `anchor` = `dayKey(today)` if present in the journal, else
     `dayKey(yesterday)` if present, else return `0`.
  2. From `anchor`, count consecutive prior days that are present
     (`anchor`, `anchor-1`, `anchor-2`, …) until a gap; return the count.

  Worked example — entries Mon/Tue/Wed, `today = Thu`:
  - Thu not present, Wed (yesterday) present → anchor = Wed → counts Wed, Tue,
    Mon → **3** (alive).
  - Complete Thu → anchor = Thu → counts Thu…Mon → **4**.
  - Skip Thu, open Fri → neither Fri nor Thu present → **0** (broken).

  A `dayKey`-based date step is needed to walk backwards; add a small
  `previousDayKey(key: string): string` (or reuse `dayKey(new Date(y, m, d-1))`)
  kept in this module, pure and unit-tested. Day arithmetic uses local calendar
  components so it is DST-safe.

### UI wiring

**Result screen — `app/app/topic/[slug]/result.tsx`**

- On mount, after the profile load, also `getDay(dayKey(new Date()))`; if an
  entry exists, pre-fill the `reflection` state from it (read-back, #5). Guard
  with the same `active` flag already used for the profile fetch.
- **Done for today** becomes an async action that, before `dismissAll()`, builds
  a `DayEntry` from the route params (`slug`, `score`, `total`) + current
  `reflection` + `date: dayKey(new Date())` + `completedAt: new Date()
  .toISOString()`, and awaits `recordDay(entry)`. Use the existing
  `useAsyncAction` pattern so a write failure surfaces (reuse the inline-error
  convention from #11/#15) rather than being swallowed. The save must not block
  navigation on success.
- **Read it again** is unchanged.

**Today — `app/app/index.tsx`**

- The focus effect already re-reads the profile; extend it to also read the
  journal (`getJournal()`), storing it in state alongside `profile`.
- Compute `done = isCompletedToday(journal, new Date())` and
  `streak = computeStreak(journal, new Date())`.
- When `done`, render a new **`DoneTodayCard`** in place of `TopicHeroCard`:
  - `🔥 {streak}-day streak`, with a softer first-day copy when `streak === 1`
    (e.g. "Day 1 — nice start").
  - "Done for today ✨ / Come back tomorrow for a fresh topic."
  - A quiet ghost **"Read it again"** → `router.push` today's topic
    (`/topic/[slug]` with the profile's `defaultDepth`). Re-finishing overwrites
    the same day's entry (idempotent), so revisiting is safe.
- When not `done`, the Explore hero renders exactly as today.

New component `app/components/DoneTodayCard.tsx` (presentational: takes `streak`,
`topicTitle?`, `onReadAgain`), styled with the existing kit (`ClayCard`, `Text`,
`ClayButton`) so it matches the hero card's surface.

## Data flow

```
Quiz → result.tsx
  mount: getDay(today) → pre-fill reflection (if prior entry)
  "Done for today": recordDay({date: dayKey(today), slug, score, total,
                               reflection, completedAt}) → dismissAll()

Today (index.tsx), on focus:
  getProfile() + getJournal()
  done   = isCompletedToday(journal, today)
  streak = computeStreak(journal, today)
  done ? <DoneTodayCard streak onReadAgain> : <TopicHeroCard …>
```

## Error handling

- `getJournal()` / `getDay()` never reject (bad data → `{}` / `null`), so Today
  and the result screen degrade to "not completed / empty reflection" rather
  than crashing — consistent with `getProfile()`.
- `recordDay()` can reject (validation/quota); the result screen wraps the Done
  action so the failure is shown with a retry affordance and the user is not
  silently stranded (same spirit as #11). Navigation happens only after a
  successful write.

## Testing

- `app/today/streak.test.ts` (node env, repo convention for logic):
  empty journal → `0`; only-today → `1`; today + prior run; yesterday-done grace
  (alive); 2-day gap → `0`; non-consecutive history counts only the run ending at
  the anchor; `isCompletedToday` true/false; `previousDayKey` across
  month/year boundaries.
- `shared` schema: a parse/round-trip test for `DayEntrySchema` (valid entry,
  empty reflection allowed, rejects negative score / bad date), following the
  existing `shared` schema test style.
- `app/storage/journal.ts`: round-trip with a mocked `@react-native-async-storage`
  (matching how/if `profile.ts` is tested); upsert overwrites same day; corrupt
  payload → `{}`.
- `DoneTodayCard` render: shows the streak and fires `onReadAgain` (jsdom
  component test).

## Build order (for the implementation plan)

1. `shared` `DayEntrySchema` + export + test.
2. `app/today/streak.ts` (+ `previousDayKey`) + tests.
3. `app/storage/journal.ts` + test.
4. `result.tsx` wiring (persist + pre-fill).
5. `DoneTodayCard` + Today done-state wiring.

Phases 1–3 are pure/storage and independently testable; 4–5 are the UI. This can
ship as a single PR or split 1–3 / 4–5 if review prefers.
