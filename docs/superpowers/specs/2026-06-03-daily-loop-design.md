# Curio — Daily Loop Design Spec

**Status:** Approved · ready for implementation planning
**Author:** vera@canuto.no
**Date:** 2026-06-03
**Parent spec:** `docs/superpowers/specs/2026-05-20-curio-design.md` (§2 daily core loop, §5 screens 2.1–2.4, §6 motion)
**Builds on:** `docs/superpowers/specs/2026-06-03-foundation-kit-design.md` (the Geometric Clay kit, merged)
**Repo:** https://github.com/VeJoTo/Curio

---

## 1. What this is

The daily core loop — the four screens that *are* Curio: **Today → Story → Quiz → Result/Reflect** — built by composing the Geometric Clay kit, plus a reusable **motion layer** that gives the app an indie-game feel. It runs on a mock `Topic` fixture (the API and content pipeline are later plans), so it is a complete, playable vertical slice without a backend.

**Why now:** it's the product's beating heart, best showcases the kit, and proves the components compose into real screens with real interaction and motion.

**Done when:** a user can open Today, pick Quick or Deep, read the illustrated story, take the quiz with immediate feedback, and land on a Result screen — entirely on-device against the fixture, with the indie-game motion throughout, on web + a simulator.

---

## 2. Scope

### In scope
1. **Four screens** — Today (home), Story scenes, Quiz, Result/Reflect.
2. **Two screen-owned components** the kit deferred: `SceneFrame` (flat clay scene panel) and `AnswerChoice` (quiz option with correct/incorrect states). Plus small compositions as needed (e.g. a `TopicHeroCard`, a `ScoreCard`).
3. **A mock Topic fixture** ("The Northern Lights") conforming to `@curio/shared`'s `TopicSchema`, with a tiny `getTopic(slug)` accessor.
4. **Navigation** — Expo Router stack: `index` (Today) → `topic/[slug]` (Story) → `topic/[slug]/quiz` → `topic/[slug]/result`. Depth is a route param; the quiz passes its score to Result via params.
5. **Quick & Deep** — the depth toggle on Today selects which scene/quiz arrays drive the loop.
6. **The `app/motion/` module** — reusable indie-game motion presets (entrance, stagger, pop, shake, count-up, pulse, burst, press), all reduced-motion aware.

### Out of scope (later plans / slices)
- Save-for-later, favorites, History, and reflection **persistence** (need storage — MMKV/SQLite).
- Real topic data, the API, push/deep-link registration, the content/authoring pipeline.
- Onboarding, Profile, Settings screens.
- Real illustrations (flat clay placeholders stand in; real WebP art drops into `SceneFrame` later).
- The header's History (📚) navigation (that screen doesn't exist — omitted, no dead buttons).

---

## 3. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | Expo Router stack + typed fixture module + per-screen local state (cross-screen via route params) | Idiomatic, deep-linkable (matches the spec's `curio://topic/<slug>` entry), avoids premature Zustand/storage. |
| Data | A `Topic` fixture typed by `@curio/shared`; `getTopic(slug)` returns it | No API yet; the fixture is the single source for the slice and validates against the same zod schema the server will. |
| State | Local `useState`/`useReducer` per screen | Quiz answers and depth are ephemeral UI state; nothing needs a store or persistence in this slice. |
| Illustrations | Flat clay `SceneFrame` (scene `accentColor` panel + emoji cue), `imageUrl` ignored | Real art is a later pipeline; the frame is the seam real WebP slots into. Fixture still carries valid `imageUrl`s to satisfy the schema. |
| Quiz feedback | Immediate per question (reveal correct/incorrect + explanation, then advance) | Teaches as you go; uses the schema's per-question `explanation`. |
| `index` route | Becomes the real **Today** home; `/gallery` stays as a dev route | The kit landing was always a placeholder. |
| Motion | Indie-game juice via a reusable `app/motion/` module; **Moti** for declarative entrance/loops, **Reanimated 3 + gesture-handler** for interactive/gesture | Delight is a product goal (§1 aesthetic). Centralizing keeps it DRY and consistently reduced-motion aware. |

---

## 4. Screens

Each screen composes kit components; layout values come from the approved mockups.

### 4.1 Today (`app/app/index.tsx`)
The singular home. Header: a meta date label + an inert 👤 placeholder (History 📚 omitted this slice). Body: a `TopicHeroCard` (composition of `ClayCard` + `Pill` + `Text` + `SceneFrame` hero + `SegmentedToggle` + `ClayButton`):
- Category `Pill` (tinted by the topic's category color), Fraunces `display` title, a flat clay hero panel, Manrope `body` deck.
- `SegmentedToggle` **Quick | Deep**; a JetBrains-Mono hint reflects the selected depth: Quick → `~2 min · {scenesQuick.length} scenes · 3 questions`; Deep → `~12 min · {scenesDeep.length} scenes · {quizDeep.length} questions`.
- Coral `ClayButton` "Explore today →" → navigates to `topic/[slug]?depth={quick|deep}`.

### 4.2 Story (`app/app/topic/[slug]/index.tsx`)
One scene at a time from the depth-selected array. Header: back `IconButton` (←), `ProgressDots` (scene position), close `IconButton` (✕ → Today). Body: `SceneFrame` (the scene's `accentColor`, an emoji cue, the Fraunces caption). Footer: "← Back" (hidden on first scene) and an indigo "Next →" that becomes a coral "Take the quiz →" on the last scene → `topic/[slug]/quiz?depth=…`. Advance by button **or horizontal swipe** (`Gesture.Pan`). Scene change = crossfade + 6px upward drift + scale-in.

### 4.3 Quiz (`app/app/topic/[slug]/quiz.tsx`)
The depth-selected question array, one at a time. Header: close (✕), `ProgressDots` (question position). Body: question meta ("Question n / N"), Fraunces prompt, a list of `AnswerChoice` rows. State machine per question: `unanswered` → tap → `revealed`:
- Selected-correct → teal + ✓ (pop); selected-wrong → rose + ✗ **and** the correct row reveals teal; other rows dim.
- A dashed-peach explanation panel slides in.
- CTA advances; on the last question it reads "See your result →" → `topic/[slug]/result?score={n}&total={N}&depth=…`.
Score is the count of correct first-answers, tallied locally with a `useReducer`.

### 4.4 Result / Reflect (`app/app/topic/[slug]/result.tsx`)
Reads `score`/`total` from params. A `ScoreCard`: the profile `Avatar` (placeholder key), a Fraunces count-up `{score} / {total}`, and an encouraging line keyed to the ratio (`= total` → "Aurora expert! 🌟"; `≥ ⅔` → "you've got the gist"; else → "worth another look ↺"). A "Reflect" `TextField` (one line; **local only**, not persisted this slice). Coral "Done for today ✓" → Today; ghost "↺ Read it again" → Story scene 1. A perfect score triggers the confetti burst + avatar bounce.

---

## 5. Screen-owned components

In `app/components/` (composing the kit), each a focused file:
- **`SceneFrame`** — props `{ scene: Scene, sceneIndex, sceneCount }`. Renders a clay panel filled with `scene.accentColor` (fallback to a category color), an emoji cue, and the caption. `imageUrl` is accepted but not rendered yet (the seam for real art). Plays the scene-change motion.
- **`AnswerChoice`** — props `{ label, state: 'idle'|'correct'|'wrong'|'mutedCorrect'|'dimmed', onPress }`. Clay row; colors and ✓/✗ per state; plays pop (correct) / shake (wrong).
- **`TopicHeroCard`**, **`ScoreCard`** — thin compositions used by Today / Result; kept as components so the screens stay declarative.

---

## 6. Data

`app/data/topics.ts`:
- Exports `theNorthernLights: Topic` — a full `TopicSchema`-valid fixture: 5 `scenesQuick`, 12 `scenesDeep`, 3 `quizQuick`, 6 `quizDeep`, each scene carrying an `accentColor` (a palette hex) and a placeholder `imageUrl`; sources present.
- Exports `getTopic(slug: string): Topic | undefined` and `todayTopic(): Topic` (returns the fixture).
- A unit test (`app/data/topics.test.ts`, Vitest) asserts the fixture **parses** under `TopicSchema.safeParse` — proving the mock matches the real contract.

---

## 7. Navigation & routes

Expo Router file routes under `app/app/`:
```
index.tsx                       Today
topic/[slug]/index.tsx          Story
topic/[slug]/quiz.tsx           Quiz
topic/[slug]/result.tsx         Result
gallery.tsx                     (kit gallery — dev, unchanged)
```
All three loop screens share the `topic/[slug]/` folder so the dynamic segment is unambiguous.
`depth` (`'quick'|'deep'`) flows as a search param from Today onward; `score`/`total` flow into Result. The root `Stack` keeps `headerShown:false` (screens draw their own headers). Stack screen transition uses the spec's crossfade + upward drift.

---

## 8. Motion & delight (`app/motion/`)

The signature layer. **Principles (indie-game juice):** bouncy overshoot springs (celebratory beats use lower damping); squash & stretch on press; anticipation & follow-through on entrances (0.85 → 1.04 → 1) with quicker exits; characterful spring/back easing (nothing linear); a reactive character (the avatar bounces/wiggles/tilts at start, correct answer, and result); material wobble (clay surfaces jelly-settle on appear).

**Hard constraints (from react-native-skills):**
- Animate **only `transform` and `opacity`** — never `width`/`height`/`margin`/layout props. (E.g. `ProgressDots`' active dot animates via a sliding/`scaleX` coral indicator, not animated width.)
- `GestureDetector` + `Gesture.Tap` worklets for press feedback (UI-thread, no JS round-trip); `Gesture.Pan` for scene swipe.
- `useDerivedValue` for derived motion; `useAnimatedReaction` only for side effects (haptics via `runOnJS`).
- **Reduced motion** (the kit's `useReducedMotion`): decorative loops (pulse, wobble, burst, idle character motion) switch off; transitions collapse to ≤120ms linear fades; no overshoot.

**The module** exports small, composable helpers/presets (built on Moti + Reanimated), each reduced-motion aware:
| Preset | Use | Technique |
|---|---|---|
| `Entrance` / `Stagger` | screen mount: cards rise + fade, 40ms stagger, overshoot settle | Moti `from`/`animate`, delay by index |
| `usePressJuice` | press: nudge + squash & stretch + light haptic | Reanimated + `Gesture.Tap` (supersedes the kit's `usePressNudge` for screens; kit hook stays for simple cases) |
| `Pop` | correct answer / score / check-in | `withSpring` overshoot on scale |
| `Shake` | wrong answer | `withSequence` translateX ±5px |
| `useCountUp` | Result score 0→n | `useSharedValue` + `useDerivedValue` + `runOnJS` to a `Text` |
| `Pulse` | idle CTA breath | Moti loop (off on reduced-motion) |
| `Burst` | perfect score | a few palette shapes translate+fade outward |
| `Character` | avatar reactions (bounce/wiggle/tilt) | `withSpring` sequences |
| scene transition | crossfade + 6px drift + scale-in | Reanimated shared progress |

Haptics (expo-haptics, already a dep): light on press, success on correct, warning on wrong, success on a perfect score. Guarded off web.

---

## 9. Dependencies added

To `app/`: **`moti`** (declarative animation), **`react-native-gesture-handler`** (GestureDetector / Pan / Tap — installed via `expo install` for the SDK-correct version; requires `GestureHandlerRootView` wrapping the app in `_layout`). Reanimated 3 and expo-haptics are already present from the kit.

---

## 10. Verification

1. **Fixture test** — `pnpm --filter @curio/app test`: the fixture parses under `TopicSchema`, plus the existing theme tests stay green.
2. **Typecheck + lint** — green across the monorepo (incl. the new routes against typed-routes).
3. **Run on web + simulator** — the full loop is playable: Today → (Quick and Deep) → Story (swipe + buttons) → Quiz (correct/wrong/explanation) → Result (count-up, perfect-score burst) → back to Today. Motion reads as indie-game juicy.
4. **Reduced-motion pass** — with Reduce Motion on, decorative loops stop, transitions become quick linear, the loop is still fully usable. VoiceOver: scenes, choices (with state), score, and progress announce sensibly.

---

## 11. Success criteria

- The daily loop is playable end-to-end on the fixture, both depths, on web + a simulator.
- Motion uses only transform/opacity, holds ~60fps, and fully degrades under reduced motion.
- The fixture validates against `@curio/shared`'s `TopicSchema` (mock matches the real contract).
- No dead buttons: anything not built this slice is omitted or visibly deferred.
- Lint + typecheck + tests green; CI passes.

## 12. Done when
- The branch is open, CI is green, and a human has reviewed and merged.
