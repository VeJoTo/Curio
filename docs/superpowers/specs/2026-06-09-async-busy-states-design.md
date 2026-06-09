# Async Action Busy & Success States — Design

**Issue:** #10 — Async actions lack in-progress/disabled state; double-submit risk and no status feedback.
**Date:** 2026-06-09
**Severity:** 3 (major) — Nielsen heuristic #1 (visibility of system status), #5 (error prevention).

## Problem

Several async actions keep their button enabled with no busy indicator while the
operation runs, so they give no feedback and can be fired twice:

- `app/app/profile.tsx` — `onSave`: `canSave` stays true during `saveProfile`; "Save changes"
  can be double-tapped, and there is no success confirmation (it just `router.back()`s).
- `app/app/onboarding.tsx` — `finish` (fired by `DoneStep`'s "Start exploring →"): stays
  enabled during `buildProfile`/`saveProfile`; a double-tap can write the profile twice.
- `app/onboarding/steps/NotificationsStep.tsx` — `allow`: stays enabled while the OS
  permission dialog is pending.

`app/components/ClayButton.tsx` has no `loading` state, so there is no shared way to show
in-progress.

## Goal

- A shared, documented `loading` state on `ClayButton` used by the three call sites.
- Each of the three actions is disabled and shows a busy spinner while its promise is in flight.
- Double-tapping cannot trigger a second save / second profile write.
- A successful profile save gives the user a visible, accessible success signal.

## Architecture

### 1. `app/hooks/useAsyncAction.ts` (new)

The shared core for in-flight tracking and double-submit prevention.

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsyncAction(action: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setPending(true);
    try {
      await action();
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) {
        setPending(false);
      }
    }
  }, [action]);

  return { pending, run };
}
```

- **Double-submit guard:** `pendingRef` is set synchronously, so a second `run()` before
  the first resolves is a no-op — independent of React's async state updates.
- **Unmount-safe:** all three actions navigate away on success; `mountedRef` skips the
  final `setPending(false)` after unmount.

### 2. `app/components/ClayButton.tsx` (modify)

Add an optional `loading?: boolean` prop.

- When `loading` is true the button is inert: no `onPress`, no press-nudge, no haptic
  (treated like `disabled` for interaction).
- The label/icon is replaced by a centered `ActivityIndicator`, keeping the button size
  stable. Spinner color: `theme.color.surface` for `coral`/`indigo`, `theme.color.ink`
  for `ghost`.
- Opacity stays 1 while loading (it is working, not disabled-looking); the existing 0.4
  dim applies only to the `disabled && !loading` case.
- `accessibilityState={{ disabled: disabled || loading, busy: loading }}`;
  `accessibilityLabel` stays the label.

Interaction gate: a derived `isInert = disabled || loading` drives the `Pressable`
`disabled` prop and the press handlers / animated style.

### 3. Call sites

**profile `onSave`** (`app/app/profile.tsx`):

- Import `expo-haptics`. Add a `saved` state and a `SAVE_CONFIRM_MS = 700` constant.
- `onSave` becomes: clear `saveError`; `await saveProfile(...)` inside try/catch (on
  failure, keep the existing `console.error` + `setSaveError(true)` and return). On
  success: fire a success haptic (`Haptics.notificationAsync(Success).catch(() => {})`),
  `setSaved(true)`, `await` a 700ms delay, then `router.back()`.
- Wrap with `const save = useAsyncAction(onSave)`.
- Button: `loading={save.pending && !saved}`, `disabled={!canSave || save.pending}`,
  `onPress={save.run}`.
- Inline success message mirrors the existing `saveError` block, shown when `saved`:
  a `View` with `accessibilityLiveRegion="polite"` containing
  `<Text variant="meta" color="teal">Saved ✓</Text>`. Render priority: `saved` →
  success message; else `saveError` → error message; else nothing.

State combinations:
- saving: `pending` true, `saved` false → button loading (spinner), inert.
- confirming: `pending` true, `saved` true → loading false (dimmed, disabled label) +
  inline "Saved ✓".
- then `router.back()`.

**onboarding `finish`**:

- `app/onboarding/types.ts`: change `StepProps.finish` from `() => void` to
  `() => Promise<void>` (the implementation in `onboarding.tsx` is already async).
- `app/onboarding/steps/DoneStep.tsx`: `const action = useAsyncAction(finish)`; the
  "Start exploring →" button gets `loading={action.pending}` and `onPress={action.run}`.
  Navigates away on success (unmount guard handles cleanup). On internal failure `finish`
  resolves (it logs), so `pending` resets and the button re-enables. (Surfacing that
  error is issue #11 — out of scope here.)

**`NotificationsStep` `allow`**:

- `const allowAction = useAsyncAction(allow)`. "Allow notifications" gets
  `loading={allowAction.pending}` and `onPress={allowAction.run}`. "Maybe later" gets
  `disabled={allowAction.pending}` so the two can't race.

### 4. Test infrastructure

- `app/vitest.config.ts`: add `hooks/**/*.test.tsx` to the `include` list and to the
  `environmentMatchGlobs` jsdom entry (the hook test uses `renderHook`).
- `app/vitest.setup.ts`: extend the existing `expo-haptics` mock with
  `notificationAsync: () => Promise.resolve()` and
  `NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' }`.

## Testing

- `app/hooks/useAsyncAction.test.tsx` (renderHook):
  - `pending` is false initially, true while the action runs, false after it resolves.
  - A second `run()` while pending does not invoke the action again (double-submit guard).
  - Calling `run()` after unmount does not throw / does not set state (unmount safety).
- `app/components/ClayButton.test.tsx` (render):
  - Not loading: label renders; pressing fires `onPress`.
  - Loading: the label text is absent (replaced by spinner); pressing does NOT fire
    `onPress`; `accessibilityState.busy` is true.

The profile, onboarding, and notifications screens are verified by `pnpm typecheck` and a
manual smoke check — per decision, no full-screen render tests (they would require mocking
storage + expo-router). The double-submit guarantee is covered at the hook level and the
spinner behavior at the ClayButton level.

## Acceptance criteria

- [ ] Each of the three buttons is disabled and shows a busy state while saving.
- [ ] Double-tapping cannot trigger a second save / second profile write.
- [ ] Saving the profile gives the user a visible success signal.
- [ ] `ClayButton` exposes a documented loading state used by these call sites.

## Out of scope (YAGNI)

- A third "success" visual baked into `ClayButton` (the inline message covers it).
- A toast/snackbar system or any global async-state manager.
- Surfacing onboarding-finish / start-over errors (that is issue #11).
- Full-screen render tests for profile/onboarding/notifications.
