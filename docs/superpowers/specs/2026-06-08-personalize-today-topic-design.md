# Personalize today's topic by profile interests

**Issue:** VeJoTo/Curio #7
**Date:** 2026-06-08

## Problem

Onboarding collects interests (category slugs) and a default depth, but the daily
topic ignores them — `todayTopic()` in `app/data/topics.ts` returns a fixed topic.
Every user sees the same thing regardless of what they chose.

## Goal

Pick the day's topic from the catalog with a **strict preference** for topics whose
category matches one of the profile's interests, falling back gracefully when nothing
matches. Selection must be deterministic within a calendar day and change day to day.
The selection logic is a pure, unit-tested function.

To make the feature observable in the running app (the catalog currently holds one
topic), author three additional full-fidelity topics across distinct categories.

## Architecture

Three units, tight boundaries:

1. **`app/today/selectTopic.ts`** — pure selection logic. No `Date` calls, no catalog
   import; everything comes in as arguments.
2. **`app/data/topics.ts`** — owns the topic catalog; exposes `getAllTopics()` and a
   thin `todayTopic(profile?, date?)` wrapper that calls the selector with a guaranteed
   fallback.
3. **`app/app/index.tsx`** — wires the loaded profile into `todayTopic(profile)`.

### `app/today/selectTopic.ts`

```ts
export function dayKey(date: Date): string;        // local calendar day, "YYYY-MM-DD"

export interface SelectArgs {
  interests: string[];
  date: Date;
  topics: Topic[];
}
export function selectDailyTopic(args: SelectArgs): Topic | undefined;
```

`selectDailyTopic` algorithm (strict preference):

1. `published` = `topics` with `status === 'published'`.
2. `pool` = `published` whose `categorySlug` is in `interests`.
3. If `pool` is empty → `pool = published` (fallback when nothing matches).
4. If `pool` is still empty → return `undefined`.
5. Sort `pool` by `slug` ascending — stable ordering independent of catalog insertion order.
6. `idx = hash(dayKey(date)) % pool.length`; return `pool[idx]`.

`hash` is a small deterministic non-negative string hash (djb2). It is internal to the
module (not exported). `dayKey` uses **local** date components (`getFullYear` /
`getMonth` / `getDate`) so the day boundary matches the user's wall clock, and
zero-pads month/day.

### `app/data/topics.ts`

Add a catalog accessor and rewrite the wrapper:

```ts
export function getAllTopics(): Topic[];   // values of the TOPICS map

export function todayTopic(profile?: Profile, date = new Date()): Topic {
  return (
    selectDailyTopic({
      interests: profile?.interests ?? [],
      date,
      topics: getAllTopics(),
    }) ?? theNorthernLights            // guaranteed fallback; never undefined
  );
}
```

`getTopic(slug)` is unchanged.

### `app/app/index.tsx`

Move `const topic = todayTopic()` from the top of the component to **after** the
`loading` and `onboard` early returns, and pass the loaded profile:

```ts
const topic = todayTopic(profile);
```

Once the gate is `ready`, `profile` is present, and `topic` is only referenced below the
early returns (in `onExplore` and the hero card), so the move is safe. The topic stays
stable across re-renders within a day because `dayKey` collapses the timestamp to a day.

## New topics

Three new full-fidelity topics, each `status: 'published'`, in distinct categories so
interest-matching and day-to-day rotation are visible:

| Slug | Title | categorySlug | Accent lead |
|------|-------|--------------|-------------|
| `how-your-heart-beats` | How Your Heart Beats | `biology` | rose |
| `why-the-moon-has-phases` | Why the Moon Has Phases | `space` | indigo |
| `how-noise-cancelling-works` | How Noise-Cancelling Works | `how-things-work` | mustard |

Each conforms to `TopicSchema` bounds: 5 `scenesQuick`, 12 `scenesDeep`, exactly 3
`quizQuick`, 6 `quizDeep`, ≥1 `sources`, a distinct `publishedAt`, `ageBand: 'all'`.
They reuse the existing `scene()` helper, `ACCENT` palette, and `PLACEHOLDER_IMG`. All
four topics are registered in the `TOPICS` map; `getAllTopics()` returns them all.

## Testing (Vitest)

Existing include globs already cover `today/**/*.test.ts` and `data/**/*.test.ts` — no
config change.

**`app/today/selectTopic.test.ts`** — pure-function suite over synthetic topic sets:

- prefers interest-matching topics; never returns a non-match when matches exist
- falls back to the full published set when no interest matches
- ignores non-published topics
- returns `undefined` for an empty topic set
- deterministic within a day (same `(interests, date, topics)` → same topic)
- changes across days (exhibit two day keys that yield different picks)
- slug-sort stability: same pick regardless of input array order
- `dayKey` formats the local calendar day correctly (zero-padded `YYYY-MM-DD`)

**Catalog validity** (in `app/data/`, e.g. `topics.test.ts`) — assert every topic in
`getAllTopics()` parses against `TopicSchema`. Guards the three new topics and any
future additions.

## Out of scope

- Age-band filtering of candidates
- `defaultDepth` influencing selection
- Serendipity / occasional exploration beyond strict preference
- More than three new topics
- Completion/streak (#6), reflection persistence (#5), notification controls (#8)
