# Profile Screen — Design

Date: 2026-06-03
Status: Approved (brainstorming)

## Problem

Onboarding collects a full profile, and the Today header now shows the user's
avatar — but the avatar is inert and there is no way to see or change the
profile after onboarding. This adds an editable Profile screen reached from the
Today header.

## Scope

In scope:

- A new pushed route `app/app/profile.tsx` that displays and **edits** the
  profile (name, avatar, age band, interests, daily time, default depth).
- Make the Today header avatar tappable → navigates to `/profile`.
- Extract the two heavy onboarding inputs (avatar grid, time picker) into
  shared, CTA-free controls used by both onboarding and the editor.
- A single "Save changes" action with validation; "Start over" reset; read-only
  notification-status line.

Out of scope (deferred):

- Editing `notifPermission` / re-requesting OS notification permission (the
  screen shows status only; the onboarding `NotificationsStep` owns the prompt).
- Any change to onboarding behavior — it must remain identical after the control
  extraction.
- Editing `deviceId` (immutable; carried through on save).

## Architecture

### Route & navigation

- `app/app/profile.tsx`, a screen in the existing `Stack` (`headerShown: false`,
  consistent with all other routes in `app/app/_layout.tsx`).
- Reached from Today: wrap the header `<Avatar>` in `app/app/index.tsx` in a
  `Pressable` → `router.push('/profile')`, with `accessibilityRole="button"`
  and `accessibilityLabel="Profile"`. (The `Avatar` itself stays presentational;
  the Today screen owns the press.)
- The Profile screen has its own header row matching the onboarding/quiz pattern:
  a back `IconButton` (`←`, `accessibilityLabel="Back"`, `onPress={router.back}`)
  on the left and a `title` "You". A right-side spacer keeps the title balanced
  (same `side`/`spacer` pattern used in `onboarding.tsx` / `quiz.tsx`).

### Extracted shared controls (`app/components/`)

Both controls are pure controlled components: value in, change out, no
navigation, no draft/profile knowledge. Onboarding steps wrap them and keep
their own CTA/auto-advance so **onboarding behavior is unchanged**.

**`AvatarPicker`** — `{ value?: string; onChange: (key: string) => void }`.
Contains exactly the `Pressable` grid currently inside `AvatarStep` (the
`AVATAR_KEYS.map` with selected styling and accessibility state). After
extraction, `AvatarStep` renders:
`<AvatarPicker value={draft.avatarKey} onChange={(k) => patch({ avatarKey: k })} />`
followed by its existing disabled-until-set `Next →` CTA.

**`TimePicker`** — `{ value?: string; onChange: (hhmm: string) => void }`.
Owns the full time UI: presets, the "Custom…" toggle, the custom hour/minute
stepper with its internal `custom`/`hour`/`minute` `useState`, the `hhmm`
helper, the directional 15-min minute stepper, and the "Set time →" confirm
button. It emits `onChange(hhmm)` whenever a value is **committed** — i.e. a
preset is tapped, or the custom "Set time →" is pressed — and does **not**
navigate. It does NOT own the wizard `next()` advance.

`TimeStep` becomes a thin wrapper:
`<TimePicker value={draft.dailyTime} onChange={(t) => { patch({ dailyTime: t }); next(); }} />`.
Because onboarding currently advances on *any* time commit (both preset tap and
custom "Set time →" call `patch` + `next` today), routing the advance through
`onChange` reproduces the exact same behavior — the picker just stops owning the
navigation. The editor passes `onChange={(t) => setDraft({ ...draft, dailyTime: t })}`
(commit updates the draft, no advance).

`name` (`TextField`), `defaultDepth` (`SegmentedToggle`), `ageBand` and
`interests` (`Pill` lists) are light enough to build inline in the editor — no
extraction.

### Editor state & form

`profile.tsx`:

1. On mount, `getProfile()` → if null (shouldn't happen when navigated from a
   gated Today, but guard anyway), `Redirect` to `/onboarding`. Otherwise seed a
   local `draft` from the loaded profile and remember the original for
   dirty-checking. Use the same `mounted`-guard + loading `ActivityIndicator`
   pattern as `index.tsx`.
2. `draft` shape — the editable subset:

   ```ts
   type ProfileDraft = {
     name?: string;
     avatarKey: string;
     ageBand: Profile['ageBand'];
     interests: string[];
     dailyTime: string;
     defaultDepth: Profile['defaultDepth'];
   };
   ```

   `deviceId` and `notifPermission` are NOT in the draft — they are read from the
   loaded profile and carried through unchanged on save.
3. Render a scrollable form, fields grouped in `ClayCard`s:

   | Field | Control | Behavior |
   |---|---|---|
   | Avatar | `AvatarPicker` | `onChange` → `setDraft({...draft, avatarKey})` |
   | Name | `TextField` | empty string is normalized to `undefined` |
   | Age | `Pill` list (BANDS) | single-select, no auto-advance |
   | Interests | `Pill` list (CATEGORIES) | toggle; block adding beyond 7 |
   | Daily time | `TimePicker` | `onChange` → set `dailyTime` |
   | Default depth | `SegmentedToggle` | Quick/Deep |

   The `BANDS` list (age) currently lives in `AgeStep`. To avoid a third copy,
   move `BANDS` to a small shared module `app/data/ageBands.ts` and import it in
   both `AgeStep` and the editor. (`CATEGORIES` is already shared in
   `app/data/categories.ts`.)

### Interaction model — single Save

- A bottom **"Save changes"** `ClayButton`, **disabled unless the draft is both
  dirty and valid.**
  - **Dirty** = draft differs from the originally-loaded editable fields
    (shallow compare, with interests compared as sets/sorted arrays).
  - **Valid** = `avatarKey` set, `ageBand` set, `dailyTime` set, and
    `interests.length` between 3 and 7 inclusive. (Name is optional.)
- On Save:
  1. Build the next `Profile` = `{ ...loadedProfile, ...draft, name: draft.name?.trim() || undefined }`
     — `deviceId` and `notifPermission` come from `loadedProfile` and are
     untouched.
  2. `saveProfile(next)` (which re-validates via `ProfileSchema.parse`).
  3. On success, `router.back()`. On failure, log and surface a non-blocking
     error message (no crash; Save stays available).
- No autosave, no partial writes: leaving via back discards edits.

### Secondary actions (low emphasis, below Save)

- **Notifications**: a read-only `Text` line showing the current
  `notifPermission` (e.g. "Notifications: granted"). No control.
- **"Start over"** (`ghost` `ClayButton`): confirm via `Alert.alert` ("Start
  over? This clears your profile and restarts onboarding."), then
  `clearProfile()` → `router.replace('/onboarding')`.

## Validation extraction (testable unit)

The dirty/valid logic is the only real branching logic, so extract it as pure,
node-testable helpers in `app/today/`-style module `app/profile/draft.ts`:

- `isValidDraft(draft: ProfileDraft): boolean` — the validity rule above.
- `isDirty(draft: ProfileDraft, original: ProfileDraft): boolean` — the
  dirty rule above (interests compared order-insensitively).
- `toProfile(draft: ProfileDraft, base: Profile): Profile` — merge that
  preserves `deviceId`/`notifPermission` and normalizes `name`.

`profile.tsx` composes these; the JSX stays declarative. Add
`profile/**/*.test.ts` to `app/vitest.config.ts`.

## Data flow

```
Today avatar (Pressable) ──push──▶ /profile
  getProfile() ─▶ loadedProfile ─▶ draft (editable subset) + original
       │                               │
       │                        field controls edit draft
       │                               │
       └─ deviceId, notifPermission ───┤  (carried through, not edited)
                                       ▼
        Save enabled when isDirty && isValidDraft
                                       ▼
        toProfile(draft, loadedProfile) ─▶ saveProfile (ProfileSchema.parse) ─▶ router.back()
```

## Error / edge handling

- **No stored profile on mount:** `Redirect` to `/onboarding` (defensive; the
  Today gate makes this unreachable in normal flow).
- **`getProfile` read failure:** already returns `null` (never rejects) → treated
  as the no-profile case above.
- **Interests at bounds:** the toggle prevents exceeding 7; Save is disabled
  below 3, so an out-of-range array can never reach `saveProfile`.
- **Empty name:** normalized to `undefined` (schema allows optional; min length
  1 means an empty string would otherwise fail validation).
- **`saveProfile` rejects** (schema/storage): caught; show an inline error,
  leave the draft intact so the user can retry. No navigation on failure.
- **Onboarding regression risk:** mitigated by keeping `AvatarStep`/`TimeStep`
  CTA/advance behavior in the steps; the extracted controls are drop-in for the
  input portion only.

## Testing

Pure-logic tests (node env, matching repo convention — no component rendering):

- `app/profile/draft.test.ts`:
  - `isValidDraft`: true for a complete draft; false when avatar/age/time missing
    or interests <3 or >7; name optional doesn't affect validity.
  - `isDirty`: false for an unchanged copy; true when any field changes; interests
    reordered but same set → not dirty.
  - `toProfile`: preserves `deviceId` and `notifPermission` from base; applies
    draft edits; empty/whitespace name → `undefined`; result passes
    `ProfileSchema.safeParse`.

Manual (web + simulator):

- Tap Today avatar → Profile opens with current values pre-filled.
- Edit each field; Save disabled until a change is made and the draft is valid;
  reducing interests below 3 disables Save.
- Save → returns to Today; reopen Profile → changes persisted; Today greeting/
  avatar/hero depth reflect edits.
- Onboarding still walks exactly as before (avatar select + time presets/custom).
- "Start over" confirms, clears, and lands on onboarding.

## Files

Create:
- `app/app/profile.tsx` — the editor screen.
- `app/components/AvatarPicker.tsx` — extracted avatar grid control.
- `app/components/TimePicker.tsx` — extracted time control.
- `app/profile/draft.ts` — `ProfileDraft` type + `isValidDraft`/`isDirty`/`toProfile`.
- `app/profile/draft.test.ts` — pure-logic tests.
- `app/data/ageBands.ts` — shared `BANDS` list.

Modify:
- `app/app/index.tsx` — make the header avatar a `Pressable` → `/profile`.
- `app/onboarding/steps/AvatarStep.tsx` — consume `AvatarPicker`.
- `app/onboarding/steps/TimeStep.tsx` — consume `TimePicker`.
- `app/onboarding/steps/AgeStep.tsx` — import `BANDS` from `app/data/ageBands.ts`.
- `app/components/index.ts` — export `AvatarPicker`, `TimePicker`.
- `app/vitest.config.ts` — add `profile/**/*.test.ts` to `include`.
