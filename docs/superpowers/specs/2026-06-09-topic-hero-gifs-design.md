# Animated per-topic GIFs on the Today hero panel

**Issue:** VeJoTo/Curio #19
**Date:** 2026-06-09
**Builds on:** #9 (per-topic `heroEmoji` + category-themed hero panel)

## Goal

Replace the static hero emoji on the Today card with a relevant animated GIF per
topic, sourced from a GIF library (Giphy). The emoji from #9 becomes the GIF's
placeholder and fallback, so the card always renders something meaningful even when
the GIF is loading, fails, the device is offline, or the user prefers reduced motion.

## Decisions (from brainstorming)

- **Curated per topic, not live search.** Curio's audience is young people; live GIF
  search returns unpredictable, potentially age-inappropriate results even with rating
  filters. Each topic stores one hand-picked Giphy GIF ID.
- **Giphy CDN by ID, no API key.** The app loads the GIF directly from Giphy's public
  media CDN. No runtime API call, no key in the client or a backend.
- **Emoji fallback** (from #9) for loading / error / offline / reduced-motion.
- **`expo-image`** for reliable animated GIF/WebP playback (iOS especially), caching,
  and a fade-in.
- **Discreet GIPHY attribution**, per Giphy's terms.

## Scope

In scope: the Today card's hero panel only — one GIF per topic.
Out of scope: story scenes, the result screen, live search, user-supplied GIFs, and
fetching through the `@curio/api` Worker.

## Architecture

### Data model — `shared/src/schemas/topic.ts`

Add an optional field next to `heroEmoji`:

```ts
/** Giphy GIF id for the Today hero panel. */
heroGifId: z.string().min(1).optional(),
```

Optional so topics without a curated GIF simply fall back to `heroEmoji`.

### URL helper — `app/data/gif.ts` (new, pure)

```ts
/** Public Giphy CDN URL for an animated WebP rendition of a GIF id. */
export function giphyGifUrl(id: string): string {
  return `https://media.giphy.com/media/${id}/giphy.webp`;
}
```

WebP is the animated, lighter rendition. Pure and unit-testable; isolates the one
Giphy-specific detail so a provider change touches a single function.

### Render — `app/components/TopicHeroCard.tsx`

The category-coloured panel (`accent` background, from #9) stays as the backdrop. The
content on top is chosen in priority order:

1. **Reduced motion on** → static `heroEmoji` (Text). GIFs can't be paused with
   `expo-image`; this honours the app's existing reduced-motion pattern (`Pulse` etc.).
2. **`heroGifId` set** → `expo-image` `<Image>` of `giphyGifUrl(heroGifId)`:
   - `contentFit="cover"`, fills the 150px panel, rounded to match.
   - `placeholder`/`onError` → keep showing the `heroEmoji` until the GIF loads, and
     revert to it permanently if the load fails. (Track an `errored` state.)
   - `accessibilityLabel` derived from the topic (e.g. `"${topic.title} animation"`).
3. **Otherwise** → `heroEmoji`.

A discreet "GIPHY" attribution mark (small `meta` text, low-emphasis) sits under the
panel, shown only when a GIF is actually displayed.

Reduced motion is read via the app's existing motion hook (the same one `Pulse`/`Reveal`
use); if no public hook exists, add a small `useReducedMotion()` wrapper in `app/motion`.

### Curation (authoring)

For each of the four topics, query the Giphy API with `rating=g`, hand-pick one GIF
that is on-topic, calm (no harsh strobing/seizure risk), and clearly appropriate, and
record its ID in the fixture. Topics:

- The Northern Lights → aurora
- How Your Heart Beats → a beating/anatomical heart
- Why the Moon Has Phases → moon phases / orbit
- How Noise-Cancelling Works → headphones / sound waves

If a suitable safe GIF can't be found for a topic, leave `heroGifId` unset (emoji shows).

## Dependencies

Add `expo-image` to `app/package.json` (Expo-managed, works on web for current testing;
native needs a dev-client rebuild later).

## Error handling & degradation

- No `heroGifId` → emoji (no network use).
- Load error / offline → `onError` reverts to emoji.
- Reduced motion → emoji, GIF never requested.
- Bad/removed Giphy ID → load error path → emoji.

## Testing

- `app/data/gif.test.ts` — `giphyGifUrl` builds the expected CDN URL; handles a sample id.
- `shared` schema test — a topic with `heroGifId` parses; the field is optional.
- `app/data/topics.test.ts` — assert the four catalog topics each have a `heroGifId`.
- Component rendering (GIF vs emoji, reduced-motion, error) verified manually on web
  (no RN render harness in the repo).

## Out of scope / future

- Story-scene and result-screen GIFs.
- Live search / personalised GIFs.
- Worker-proxied fetching with a server-side key (revisit if Giphy CDN-by-id proves
  unreliable or attribution/TOS needs the official API).
- Pausing/replaying controls.
