# Curio — Onboarding + Profile Store Design Spec

**Status:** Approved · ready for implementation planning
**Author:** vera@canuto.no
**Date:** 2026-06-03
**Parent spec:** `docs/superpowers/specs/2026-05-20-curio-design.md` (§2 onboarding, §5 screens 1.1–1.9, §7 Profile, §9 notifications)
**Builds on:** the Geometric Clay kit and the daily-loop slice (both merged)
**Repo:** https://github.com/VeJoTo/Curio

---

## 1. What this is

The app's front door: a nine-step onboarding wizard that builds a device-local profile, plus the **profile storage layer** it persists to and a **first-run gate** that routes new users into onboarding and returning users into Today. The profile shape is exactly `@curio/shared`'s `ProfileSchema`, validated on save. It's a complete, runnable slice: a fresh install lands in onboarding, completes a profile in ≤90 seconds, and arrives at the daily loop.

**Done when:** a first launch shows onboarding; finishing it persists a schema-valid profile and lands on Today; relaunching skips straight to Today; on web + simulator the whole flow plays with the kit's motion.

---

## 2. Scope

### In scope
1. **Profile storage** — `app/storage/profile.ts`: `getProfile`, `saveProfile`, `clearProfile`, `getDeviceId`. Persists the `Profile` as JSON; validates with `ProfileSchema` on save.
2. **A categories fixture** — `app/data/categories.ts`: 8 interest categories (slug, name, colorToken, emoji), each parsing `@curio/shared`'s `CategorySchema`.
3. **An avatar set** — an ordered list of 6 selectable avatar keys, with the kit `Avatar` extended to render each.
4. **The onboarding wizard** — one route, an internal step machine, nine steps: Welcome · Name · Avatar · Age band · Interests · Daily time · Default depth · Notifications · You're set.
5. **First-run gate** — Today redirects to `/onboarding` when no profile exists; onboarding's final step persists and routes to Today.
6. **Notification permission** — value-prop screen then the OS prompt (`expo-notifications`); store the result in the profile.

### Out of scope (deferred)
- The SQLite layer (history / saved / catalog cache) — serves save/favorites/History, later slices.
- Server `POST /devices` registration and local-notification scheduling — need the API (Plan 4); this slice stores `notifPermission` + a `deviceId` locally only.
- Editing the profile after onboarding (Profile/Settings screens) — later slice.
- MMKV (see §3).

---

## 3. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Persistence backend | **AsyncStorage** (`@react-native-async-storage/async-storage`) behind the `profile.ts` seam | Works in Expo Go, on web, and in dev builds — everywhere we verify. The parent spec's MMKV needs a custom dev build and lacks smooth web support; it can swap in later behind the same interface. |
| Wizard architecture | Single `onboarding` route + `useReducer` draft + per-step components | One place holds the half-built profile; no threading state across nine routes; a linear first-run flow needs no per-step deep-linking. |
| Daily-time input | Preset chips (Morning 08:00 / Midday 12:00 / Evening 18:00 / Night 21:00) + a "Custom…" inline hour/minute stepper | One-tap for most; ≤90s goal; on-brand (clay), no native picker dependency. |
| Interests | Multi-select category Pills; **require 3–7** | Honors the `ProfileSchema` comment ("UI enforces 3–7"); 8 categories make 3 comfortable. |
| Name | Optional, skippable | `ProfileSchema.name` is optional. |
| Step advancement | Single-choice steps (Age, Daily time, Depth) auto-advance on tap; multi-select (Interests) needs Next | Speed without losing the multi-select case. |
| deviceId | `expo-crypto` `randomUUID()`, generated once, stored | Satisfies `ProfileSchema.deviceId` (uuid); no PII. |
| First-run gate | `app/app/index.tsx` (Today) loads the profile; renders a splash while loading, `<Redirect href="/onboarding" />` if none | AsyncStorage is async, so the gate handles a brief load; onboarding `router.replace('/')` on finish. |

---

## 4. Profile storage (`app/storage/`)

- **`app/storage/profile.ts`**
  - `getDeviceId(): Promise<string>` — reads a stored uuid; generates + persists one (`expo-crypto` `randomUUID()`) on first call.
  - `getProfile(): Promise<Profile | null>` — reads the JSON blob, `ProfileSchema.safeParse`s it; returns the profile or `null` (also `null` on parse failure, treated as "no profile").
  - `saveProfile(profile: Profile): Promise<void>` — `ProfileSchema.parse(profile)` then writes JSON. Throwing on invalid input is intentional (programmer error).
  - `clearProfile(): Promise<void>` — removes the profile (keeps `deviceId`). For dev/testing and a future "delete my data".
  - Keys namespaced (`curio.profile`, `curio.deviceId`).
- **`app/onboarding/buildProfile.ts`** (pure, unit-tested) — `buildProfile(draft: OnboardingDraft, deviceId: string): Profile` assembles + returns a `ProfileSchema`-valid object (omitting `name` when blank). This is the testable core; the AsyncStorage I/O is verified by running.

The `OnboardingDraft` type holds the in-progress selections: `name?`, `avatarKey?`, `ageBand?`, `interests: string[]`, `dailyTime?`, `defaultDepth?`, `notifPermission?` (all optional except `interests` which starts `[]`).

---

## 5. Categories fixture (`app/data/categories.ts`)

Exports `CATEGORIES`: 8 entries, each `{ slug, name, colorToken, emoji }` where `{slug,name,colorToken}` parse `CategorySchema` (emoji is an app-side display extension). Example set: Earth & Sky (teal), Biology (rose), How Things Work (mustard), History (indigo), Space (coral), Art (rose), Mind & Brain (teal), Food & Cooking (mustard). A unit test asserts every category's `{slug,name,colorToken}` passes `CategorySchema.safeParse`. The Interests step renders these as selectable Pills tinted by `theme.categoryColor[colorToken]`; selection stores `slug`s into `draft.interests`.

---

## 6. Avatar set

The kit `Avatar` currently maps four keys. Extend its `FACES` map to 6 (`avatar-fox/owl/bee/cat/frog/butterfly`) and export an ordered `AVATAR_KEYS: string[]`. The Avatar step renders the set in a grid of pressable `Avatar`s; the selected key gets a ring; stores into `draft.avatarKey`.

---

## 7. The onboarding wizard (`app/app/onboarding.tsx`)

One route, a `useReducer` over `OnboardingDraft` + a `step` index (0–8). Renders `<ProgressDots count={9} index={step} />`, the current step component, and Back/Next. Step components live in `app/onboarding/steps/` (one focused file each): `Welcome`, `NameStep`, `AvatarStep`, `AgeStep`, `InterestsStep`, `TimeStep`, `DepthStep`, `NotificationsStep`, `DoneStep`. Each receives the draft slice it needs + a `dispatch`/callback. Behaviour:

- **Welcome** — Fraunces hero + "Get started →" (Next). No Back.
- **Name** — `TextField`; "Next →" and "Skip" (both advance; Skip leaves `name` unset).
- **Avatar** — grid of the avatar set; tap selects; "Next →".
- **Age band** — seven Pills (the `ageBand` enum); tap selects and **auto-advances**.
- **Interests** — category Pills, multi-select; Next enabled at **3–7** selected (cap at 7).
- **Daily time** — preset chips (auto-advance) + "Custom…" → inline hour/minute stepper writing `HH:mm`.
- **Default depth** — `SegmentedToggle` Quick/Deep with a one-line description each; "Next →".
- **Notifications** — value-prop ("One gentle nudge a day"); "Allow notifications" calls `expo-notifications` `requestPermissionsAsync()` and stores the granted/denied result; "Maybe later" stores `'undetermined'`. Either advances.
- **You're set** — celebratory (avatar + confetti `Burst`); "Start exploring →" calls `saveProfile(buildProfile(draft, deviceId))` then `router.replace('/')`.

Back is available on every step except Welcome (decrements `step`; never loses earlier selections). Validation gates Next per step (e.g. Interests needs ≥3). Motion: each step wrapped in the kit's `Reveal`; ProgressDots animate; the Done step fires the `Burst`.

---

## 8. First-run gate

`app/app/index.tsx` (Today) becomes profile-aware: it loads the profile on mount (`getProfile()`), renders a minimal clay splash while loading, and `<Redirect href="/onboarding" />` when the result is `null`. With a profile present it renders Today as today. `app/app/onboarding.tsx` is a sibling route in the same `Stack`. After onboarding persists, `router.replace('/')` lands on Today, which now finds the profile and renders.

---

## 9. Dependencies added

To `app/`: `@react-native-async-storage/async-storage` (via `expo install`), `expo-crypto` (uuid; via `expo install`), `expo-notifications` (via `expo install`). Reanimated/Moti/gesture-handler and the kit are already present.

---

## 10. Verification

1. **Unit tests** — `buildProfile` produces a `ProfileSchema`-valid object across cases (with/without name; interests at the 3 and 7 bounds); the categories fixture parses `CategorySchema`. `pnpm --filter @curio/app test` green (plus existing theme + topic tests).
2. **Typecheck + lint** — green across the monorepo (new route typed).
3. **Run on web + simulator** — a fresh start (clear storage) lands in onboarding; complete all nine steps; confirm it persists and lands on Today; relaunch → straight to Today. The notification step shows the value-prop then the OS prompt (native).
4. **Reduced-motion + a11y pass** — step entrances degrade; Pills/toggles/inputs announce; progress announces step n of 9.

---

## 11. Success criteria

- A fresh install completes onboarding in ≤90s (median) and the persisted profile parses `ProfileSchema`.
- Relaunch skips onboarding (gate reads the stored profile).
- No dead ends: Back works throughout; Skip only on Name; Next gated where required.
- Persistence works in Expo Go, on web, and in a dev build (AsyncStorage).
- Lint + typecheck + tests green; CI passes.

## 12. Done when
- The branch is open, CI is green, and a human has reviewed and merged.
