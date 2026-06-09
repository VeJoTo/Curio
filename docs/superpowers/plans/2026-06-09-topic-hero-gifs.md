# Per-Topic Hero GIFs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a curated, relevant animated GIF per topic on the Today hero panel, sourced from Giphy's public CDN by ID, with the #9 emoji as placeholder/fallback.

**Architecture:** A pure `giphyGifUrl(id)` builds a keyless Giphy CDN URL. `TopicHeroCard` renders that GIF with `expo-image` over the category-coloured panel, falling back to the `heroEmoji` while loading, on error, offline, or when reduced-motion is on. GIF ids are hand-curated per topic (content safety) and stored as an optional `heroGifId` on the topic.

**Tech Stack:** TypeScript, Expo/React Native, `expo-image`, Zod (`@curio/shared`), Vitest, pnpm.

**Branch:** `feat/topic-hero-gifs` (already checked out; spec already committed).

**Commands:**
- App tests: `pnpm --filter @curio/app test [path]`
- Shared tests: `pnpm --filter @curio/shared test`
- Typecheck: `pnpm -r typecheck`
- Lint: `pnpm lint` (run `pnpm lint:fix` to auto-format)

---

## File Structure

- **Modify** `shared/src/schemas/topic.ts` — add optional `heroGifId` to `TopicSchema`.
- **Create** `app/data/gif.ts` — pure `giphyGifUrl(id)` CDN URL builder.
- **Create** `app/data/gif.test.ts` — unit tests for it.
- **Modify** `app/package.json` — add `expo-image` (via `expo install`).
- **Modify** `app/components/TopicHeroCard.tsx` — render the GIF with fallback + reduced-motion + attribution.
- **Modify** `app/data/topics.ts` — set curated `heroGifId` on the 4 fixtures.
- **Modify** `app/data/topics.test.ts` — assert every topic has a `heroGifId`.

---

## Task 1: Add `heroGifId` to the Topic schema

Additive optional field — no behaviour change; existing fixtures keep parsing.

**Files:**
- Modify: `shared/src/schemas/topic.ts`

- [ ] **Step 1: Add the field**

In `shared/src/schemas/topic.ts`, directly after the `heroEmoji` line (added in #9), add:

```ts
  /** Giphy GIF id for the Today hero panel (keyless CDN render). */
  heroGifId: z.string().min(1).optional(),
```

- [ ] **Step 2: Verify shared still green**

Run: `pnpm --filter @curio/shared test && pnpm --filter @curio/shared typecheck`
Expected: tests pass (20), typecheck clean. (Optional field can't break existing parses.)

- [ ] **Step 3: Commit**

```bash
git add shared/src/schemas/topic.ts
git commit -m "feat(shared): optional heroGifId on TopicSchema (#19)"
```

---

## Task 2: `giphyGifUrl` helper (TDD)

**Files:**
- Create: `app/data/gif.ts`
- Test: `app/data/gif.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/data/gif.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { giphyGifUrl } from './gif';

describe('giphyGifUrl', () => {
  it('builds the public Giphy CDN webp URL for an id', () => {
    expect(giphyGifUrl('lp8JOW74nExzvnPdjV')).toBe(
      'https://media.giphy.com/media/lp8JOW74nExzvnPdjV/giphy.webp',
    );
  });

  it('uses the exact id without encoding (Giphy ids are url-safe)', () => {
    expect(giphyGifUrl('abc123')).toBe('https://media.giphy.com/media/abc123/giphy.webp');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @curio/app test data/gif.test.ts`
Expected: FAIL — cannot resolve `./gif`.

- [ ] **Step 3: Implement**

Create `app/data/gif.ts`:

```ts
/** Public Giphy CDN URL for the animated WebP rendition of a GIF id. No API key needed. */
export function giphyGifUrl(id: string): string {
  return `https://media.giphy.com/media/${id}/giphy.webp`;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm --filter @curio/app test data/gif.test.ts`
Expected: PASS (2).

- [ ] **Step 5: Commit**

```bash
git add app/data/gif.ts app/data/gif.test.ts
git commit -m "feat(app): giphyGifUrl CDN helper (#19)"
```

---

## Task 3: Add the `expo-image` dependency

**Files:**
- Modify: `app/package.json` (+ lockfile)

- [ ] **Step 1: Install the SDK-matched version**

Run: `pnpm --filter @curio/app exec expo install expo-image`
Expected: `expo-image` added to `app/package.json` dependencies at the version Expo SDK 51 pins.

- [ ] **Step 2: Verify it resolves**

Run: `pnpm --filter @curio/app typecheck`
Expected: clean (no missing-module error for `expo-image`).

- [ ] **Step 3: Commit**

```bash
git add app/package.json pnpm-lock.yaml
git commit -m "build(app): add expo-image for animated hero GIFs (#19)"
```

Note: the running web dev server must be restarted to pick up the new dependency.

---

## Task 4: Render the GIF in `TopicHeroCard` (fallback + reduced-motion + attribution)

No unit test (the repo has no RN render harness); verified by typecheck, lint, and manual reload. At this point no topic has a `heroGifId`, so the card still shows the emoji — nothing visible changes yet, which is the safe intermediate state.

**Files:**
- Modify: `app/components/TopicHeroCard.tsx`

- [ ] **Step 1: Add imports**

At the top of `app/components/TopicHeroCard.tsx`, add these imports (alongside the existing ones):

```ts
import { Image as ExpoImage } from 'expo-image';
import { giphyGifUrl } from '../data/gif';
import { useReducedMotion } from '../hooks/useReducedMotion';
```

- [ ] **Step 2: Compute GIF display state**

Inside the component, just after the existing `const heroGlyph = ...` line, add:

```ts
  const reduced = useReducedMotion();
  const [gifError, setGifError] = useState(false);
  const showGif = !reduced && !gifError && Boolean(topic.heroGifId);
```

(`useState` is already imported in this file.)

- [ ] **Step 3: Render GIF-or-emoji in the hero panel**

Replace the existing hero `View` block:

```tsx
      <View style={[styles.hero, { backgroundColor: accent }]}>
        <Text variant="display">{heroGlyph}</Text>
      </View>
```

with:

```tsx
      <View style={[styles.hero, { backgroundColor: accent }]}>
        {showGif ? (
          <ExpoImage
            source={{ uri: giphyGifUrl(topic.heroGifId as string) }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            onError={() => setGifError(true)}
            accessibilityLabel={`${topic.title} animation`}
          />
        ) : (
          <Text variant="display">{heroGlyph}</Text>
        )}
      </View>
      {showGif ? (
        <Text variant="meta" color="inkSoft" style={styles.attribution}>
          via GIPHY
        </Text>
      ) : null}
```

- [ ] **Step 4: Add styles**

In the `StyleSheet.create({ ... })` at the bottom, add `overflow: 'hidden'` to the existing `hero` style, and add two new entries:

Change the `hero` style object to include:
```ts
    overflow: 'hidden',
```
Add:
```ts
  heroImage: { width: '100%', height: '100%' },
  attribution: { marginTop: theme.space.xs, alignSelf: 'flex-end' },
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm --filter @curio/app typecheck && pnpm lint`
Expected: clean. (If lint reformats, run `pnpm lint:fix` and re-stage.)

- [ ] **Step 6: Commit**

```bash
git add app/components/TopicHeroCard.tsx
git commit -m "feat(app): render per-topic hero GIF with emoji fallback (#19)"
```

---

## Task 5: Curate GIF ids and wire them to the topics

This task has a human approval gate: the operator surfaces candidate GIFs and the user picks the safe, on-topic one per topic before any id is hardcoded. GIF content for a young audience must be eyeballed, not chosen blind.

**Files:**
- Modify: `app/data/topics.ts`
- Test: `app/data/topics.test.ts`

- [ ] **Step 1: Write the failing catalog test**

In `app/data/topics.test.ts`, inside the `describe('topic catalog', ...)` block, add:

```ts
  it('every catalog topic has a heroGifId', () => {
    for (const topic of getAllTopics()) {
      expect(topic.heroGifId, `${topic.slug} missing heroGifId`).toBeTruthy();
    }
  });
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @curio/app test data/topics.test.ts`
Expected: FAIL — topics have no `heroGifId` yet.

- [ ] **Step 3: Gather candidates per topic**

For each topic subject — aurora/northern lights, a beating heart, moon phases, headphones/noise-cancelling — run `WebSearch` with `allowed_domains: ["giphy.com"]`. From each result URL of the form `https://giphy.com/gifs/<slug>-<ID>` (or `https://giphy.com/gifs/<ID>`), the GIF id is the final dash-delimited token. Prefer authoritative/clearly-safe sources (e.g. NASA for aurora/moon).

- [ ] **Step 4: Verify each candidate renders on the CDN**

For every candidate id, run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://media.giphy.com/media/<ID>/giphy.webp"
```
Keep only ids that return `200`. (If a strong candidate lacks a webp rendition — 404 — discard it and pick another; the helper renders webp.)

- [ ] **Step 5: Get user approval**

Present the surviving candidates per topic as `giphy.com` links and let the user pick one each (content-safety gate). Do not proceed with unapproved ids.

- [ ] **Step 6: Set the approved ids**

In `app/data/topics.ts`, add `heroGifId: '<APPROVED_ID>',` immediately after the `heroEmoji:` line of each of the four topic constants (`theNorthernLights`, `howYourHeartBeats`, `whyTheMoonHasPhases`, `howNoiseCancellingWorks`).

- [ ] **Step 7: Run the catalog + full suite**

Run: `pnpm --filter @curio/app test`
Expected: PASS, including the new `every catalog topic has a heroGifId` assertion.

- [ ] **Step 8: Typecheck + lint**

Run: `pnpm -r typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add app/data/topics.ts app/data/topics.test.ts
git commit -m "feat(app): curated hero GIFs for the four topics (#19)"
```

---

## Manual verification (after Task 5)

Restart the web dev server (Task 3 added a dependency), reload, and for each interest (Earth & Sky, Biology, Space, How Things Work) confirm the Today hero panel shows the topic's animated GIF over its category colour, with a small "via GIPHY" mark — and that it falls back to the emoji with the OS "reduce motion" setting on.

## Done criteria

- `heroGifId` is an optional schema field; `giphyGifUrl` is pure and unit-tested.
- The four topics have curated, user-approved, CDN-verified GIF ids.
- The hero panel renders the GIF via `expo-image` over the category colour, with the emoji as placeholder/fallback (loading, error, offline, reduced-motion).
- A discreet "via GIPHY" attribution shows when a GIF is displayed.
- `pnpm --filter @curio/app test`, `pnpm --filter @curio/shared test`, `pnpm -r typecheck`, and `pnpm lint` all pass.
