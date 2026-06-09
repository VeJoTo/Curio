# Async Action Busy & Success States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the three async actions (profile save, onboarding finish, notification permission) a busy spinner + disabled state to prevent double-submit, and add a visible success signal on profile save.

**Architecture:** A shared `useAsyncAction` hook tracks in-flight state with a synchronous double-submit guard and unmount safety. `ClayButton` gains a `loading` prop (spinner replaces label, button inert). The three call sites wrap their action in the hook and pass `loading`. Profile save adds a success haptic + brief inline "Saved ✓" before navigating.

**Tech Stack:** React 18 / React Native 0.74 / Expo Router 3.5, vitest 2.1 + jsdom + react-native-web + @testing-library/react (incl. `renderHook`), expo-haptics. Package manager: **pnpm** workspace (`@curio/app`).

---

## File Structure

- **Modify** `app/vitest.config.ts` — add `hooks/**/*.test.tsx` to includes + jsdom glob.
- **Modify** `app/vitest.setup.ts` — extend expo-haptics mock with `notificationAsync` + `NotificationFeedbackType`.
- **Create** `app/hooks/useAsyncAction.ts` — the shared in-flight hook.
- **Create** `app/hooks/useAsyncAction.test.tsx` — hook tests (renderHook).
- **Modify** `app/components/ClayButton.tsx` — add `loading` prop.
- **Create** `app/components/ClayButton.test.tsx` — loading-state tests.
- **Modify** `app/app/profile.tsx` — wrap onSave, success haptic + inline "Saved ✓", button loading/disabled.
- **Modify** `app/onboarding/types.ts` — `StepProps.finish: () => Promise<void>`.
- **Modify** `app/onboarding/steps/DoneStep.tsx` — wrap finish with the hook + loading button.
- **Modify** `app/onboarding/steps/NotificationsStep.tsx` — wrap allow with the hook + loading button; disable "Maybe later" while pending.

All commands run from `~/Documents/Curio/app`. `pnpm test` runs the full vitest suite; `pnpm test -- <path>` runs one file; `pnpm typecheck` runs `tsc --noEmit`.

---

## Task 1: Test infra touch-ups

**Files:**
- Modify: `app/vitest.config.ts`
- Modify: `app/vitest.setup.ts`

- [ ] **Step 1: Add the hooks glob to vitest config**

Replace the ENTIRE contents of `app/vitest.config.ts` with:

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@curio/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      'react-native': 'react-native-web',
    },
  },
  test: {
    include: [
      'theme/**/*.test.ts',
      'data/**/*.test.ts',
      'onboarding/**/*.test.ts',
      'today/**/*.test.ts',
      'profile/**/*.test.ts',
      'components/**/*.test.tsx',
      'hooks/**/*.test.tsx',
    ],
    environment: 'node',
    environmentMatchGlobs: [
      ['components/**/*.test.tsx', 'jsdom'],
      ['hooks/**/*.test.tsx', 'jsdom'],
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 2: Extend the expo-haptics mock**

In `app/vitest.setup.ts`, replace this block:

```ts
vi.mock('expo-haptics', () => ({
  impactAsync: () => Promise.resolve(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));
```

with:

```ts
vi.mock('expo-haptics', () => ({
  impactAsync: () => Promise.resolve(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  notificationAsync: () => Promise.resolve(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
```

- [ ] **Step 3: Verify no regression**

Run:

```bash
pnpm test
```

Expected: PASS. Same test count as before this task (the new globs match no files yet).

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts vitest.setup.ts
git commit -m "test(app): hooks test glob + extend haptics mock (#10)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `useAsyncAction` hook

**Files:**
- Create: `app/hooks/useAsyncAction.ts`
- Test: `app/hooks/useAsyncAction.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/hooks/useAsyncAction.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsyncAction } from './useAsyncAction';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useAsyncAction', () => {
  it('toggles pending around the action', async () => {
    const d = deferred();
    const action = vi.fn(() => d.promise);
    const { result } = renderHook(() => useAsyncAction(action));

    expect(result.current.pending).toBe(false);

    act(() => {
      void result.current.run();
    });
    await waitFor(() => expect(result.current.pending).toBe(true));

    await act(async () => {
      d.resolve();
      await d.promise;
    });
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('ignores a second run while one is in flight (double-submit guard)', async () => {
    const d = deferred();
    const action = vi.fn(() => d.promise);
    const { result } = renderHook(() => useAsyncAction(action));

    act(() => {
      void result.current.run();
      void result.current.run();
    });

    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
      await d.promise;
    });
  });

  it('does not throw when run resolves after unmount', async () => {
    const d = deferred();
    const action = vi.fn(() => d.promise);
    const { result, unmount } = renderHook(() => useAsyncAction(action));

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.run();
    });
    unmount();
    await act(async () => {
      d.resolve();
      await runPromise;
    });
    // No "set state after unmount" warning / no throw means success.
    expect(action).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- hooks/useAsyncAction.test.tsx
```

Expected: FAIL — `./useAsyncAction` cannot be resolved.

- [ ] **Step 3: Implement the hook**

Create `app/hooks/useAsyncAction.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

// Tracks an async action's in-flight state. `run` is a no-op if the action is
// already running (synchronous double-submit guard) and skips the final state
// update if the component unmounted mid-flight (these actions navigate away on
// success).
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

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- hooks/useAsyncAction.test.tsx
```

Expected: PASS (all three cases).

- [ ] **Step 5: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add hooks/useAsyncAction.ts hooks/useAsyncAction.test.tsx
git commit -m "feat(app): useAsyncAction hook with double-submit guard (#10)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `ClayButton` loading prop

**Files:**
- Modify: `app/components/ClayButton.tsx`
- Test: `app/components/ClayButton.test.tsx`

The current full contents of `app/components/ClayButton.tsx` are:

```tsx
import { Platform, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressNudge } from '../hooks/usePressNudge';
import { theme } from '../theme';
import { Text } from './Text';

type Variant = 'coral' | 'indigo' | 'ghost';

interface ClayButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'leading' | 'trailing';
  style?: StyleProp<ViewStyle>;
}

const fill: Record<Variant, string> = {
  coral: theme.color.coral,
  indigo: theme.color.indigo,
  ghost: theme.color.surface,
};

export function ClayButton({
  label,
  onPress,
  variant = 'indigo',
  disabled = false,
  icon,
  iconPosition = 'trailing',
  style,
}: ClayButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressNudge();
  const textColor = variant === 'ghost' ? 'ink' : 'surface';
  const iconNode = icon ? (
    <Text variant="bodyStrong" color={textColor}>
      {icon}
    </Text>
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: fill[variant], opacity: disabled ? 0.4 : 1 },
          style,
          disabled ? null : animatedStyle,
        ]}
      >
        {icon && iconPosition === 'leading' ? iconNode : null}
        <Text variant="bodyStrong" color={textColor}>
          {label}
        </Text>
        {icon && iconPosition === 'trailing' ? iconNode : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    alignSelf: 'flex-start',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 22,
    minHeight: 44,
    ...Platform.select(theme.shadow.clay),
  },
});
```

- [ ] **Step 1: Write the failing test**

Create `app/components/ClayButton.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClayButton } from './ClayButton';

afterEach(cleanup);

describe('ClayButton', () => {
  it('renders the label and fires onPress when not loading', () => {
    const onPress = vi.fn();
    render(<ClayButton label="Save changes" onPress={onPress} />);
    fireEvent.click(screen.getByText('Save changes'));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('hides the label and does not fire onPress while loading', () => {
    const onPress = vi.fn();
    render(<ClayButton label="Save changes" loading onPress={onPress} />);
    expect(screen.queryByText('Save changes')).toBeNull();
    // The accessible button is still present (label preserved for screen readers).
    const button = screen.getByRole('button', { name: 'Save changes' });
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- components/ClayButton.test.tsx
```

Expected: FAIL — `loading` is not a valid prop (TS error) and/or the label is still rendered while loading.

- [ ] **Step 3: Implement the loading prop**

Replace the ENTIRE contents of `app/components/ClayButton.tsx` with:

```tsx
import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressNudge } from '../hooks/usePressNudge';
import { theme } from '../theme';
import { Text } from './Text';

type Variant = 'coral' | 'indigo' | 'ghost';

interface ClayButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  /** When true, shows a spinner in place of the label and makes the button inert. */
  loading?: boolean;
  icon?: string;
  iconPosition?: 'leading' | 'trailing';
  style?: StyleProp<ViewStyle>;
}

const fill: Record<Variant, string> = {
  coral: theme.color.coral,
  indigo: theme.color.indigo,
  ghost: theme.color.surface,
};

export function ClayButton({
  label,
  onPress,
  variant = 'indigo',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'trailing',
  style,
}: ClayButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressNudge();
  const textColor = variant === 'ghost' ? 'ink' : 'surface';
  const spinnerColor = variant === 'ghost' ? theme.color.ink : theme.color.surface;
  const isInert = disabled || loading;
  const iconNode = icon ? (
    <Text variant="bodyStrong" color={textColor}>
      {icon}
    </Text>
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={isInert ? undefined : onPressIn}
      onPressOut={isInert ? undefined : onPressOut}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInert, busy: loading }}
    >
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: fill[variant], opacity: disabled && !loading ? 0.4 : 1 },
          style,
          isInert ? null : animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <>
            {icon && iconPosition === 'leading' ? iconNode : null}
            <Text variant="bodyStrong" color={textColor}>
              {label}
            </Text>
            {icon && iconPosition === 'trailing' ? iconNode : null}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xs,
    alignSelf: 'flex-start',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 22,
    minHeight: 44,
    ...Platform.select(theme.shadow.clay),
  },
});
```

Note: `justifyContent: 'center'` is added so the spinner sits centered when it replaces the label.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- components/ClayButton.test.tsx
```

Expected: PASS (both cases).

- [ ] **Step 5: Run the full suite + typecheck**

Run:

```bash
pnpm test
pnpm typecheck
```

Expected: all pass; no type errors. (Existing ClayButton call sites still typecheck — `loading` is optional.)

- [ ] **Step 6: Commit**

```bash
git add components/ClayButton.tsx components/ClayButton.test.tsx
git commit -m "feat(app): ClayButton loading state (spinner, inert) (#10)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Wire profile save (busy + success signal)

**Files:**
- Modify: `app/app/profile.tsx`

No new test (per design decision — covered by the hook + ClayButton tests + typecheck + manual smoke). This task is verified by typecheck and the full suite still passing.

- [ ] **Step 1: Add imports and the hook**

In `app/app/profile.tsx`:

Add an import for haptics near the top (after the existing React Native import line):

```tsx
import * as Haptics from 'expo-haptics';
```

Add the hook import to the `../hooks` area — there is no existing hooks import, so add this line alongside the other relative imports (e.g. right after the `../data/interests` import):

```tsx
import { useAsyncAction } from '../hooks/useAsyncAction';
```

- [ ] **Step 2: Add the success constant and state**

Just below `const [saveError, setSaveError] = useState(false);` add:

```tsx
  const [saved, setSaved] = useState(false);
```

And add this module-level constant just above `export default function ProfileScreen() {`:

```tsx
const SAVE_CONFIRM_MS = 700;
```

- [ ] **Step 3: Rework `onSave` and wrap it**

Replace the existing `onSave` definition:

```tsx
  const onSave = async () => {
    try {
      setSaveError(false);
      await saveProfile(toProfile(draft, profile));
      router.back();
    } catch (err) {
      console.error('profile save failed', err);
      setSaveError(true);
    }
  };
```

with:

```tsx
  const onSave = async () => {
    setSaveError(false);
    try {
      await saveProfile(toProfile(draft, profile));
    } catch (err) {
      console.error('profile save failed', err);
      setSaveError(true);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved(true);
    await new Promise((resolve) => setTimeout(resolve, SAVE_CONFIRM_MS));
    router.back();
  };
  const save = useAsyncAction(onSave);
```

- [ ] **Step 4: Update the success/error inline block and the Save button**

Replace the existing `saveError` inline block:

```tsx
          {saveError ? (
            <View accessibilityLiveRegion="polite" style={styles.error}>
              <Text variant="meta" color="coral">
                Couldn't save. Please try again.
              </Text>
            </View>
          ) : null}
```

with:

```tsx
          {saved ? (
            <View accessibilityLiveRegion="polite" style={styles.error}>
              <Text variant="meta" color="teal">
                Saved ✓
              </Text>
            </View>
          ) : saveError ? (
            <View accessibilityLiveRegion="polite" style={styles.error}>
              <Text variant="meta" color="coral">
                Couldn't save. Please try again.
              </Text>
            </View>
          ) : null}
```

Replace the Save button:

```tsx
          <ClayButton
            label="Save changes"
            variant="coral"
            disabled={!canSave}
            onPress={onSave}
            style={styles.save}
          />
```

with:

```tsx
          <ClayButton
            label="Save changes"
            variant="coral"
            disabled={!canSave || save.pending}
            loading={save.pending && !saved}
            onPress={save.run}
            style={styles.save}
          />
```

- [ ] **Step 5: Typecheck + full suite**

Run:

```bash
pnpm typecheck
pnpm test
```

Expected: no type errors; all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/profile.tsx
git commit -m "feat(app): profile save busy state + 'Saved' confirmation (#10)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Wire onboarding finish

**Files:**
- Modify: `app/onboarding/types.ts`
- Modify: `app/onboarding/steps/DoneStep.tsx`

- [ ] **Step 1: Retype `finish`**

In `app/onboarding/types.ts`, change the `StepProps` interface's `finish` line from:

```tsx
  finish: () => void;
```

to:

```tsx
  finish: () => Promise<void>;
```

- [ ] **Step 2: Wrap finish in DoneStep**

Replace the ENTIRE contents of `app/onboarding/steps/DoneStep.tsx` with:

```tsx
import { StyleSheet, View } from 'react-native';
import { Avatar, ClayButton, Text } from '../../components';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { Burst } from '../../motion';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function DoneStep({ draft, finish }: StepProps) {
  const name = draft.name?.trim();
  const action = useAsyncAction(finish);
  return (
    <View style={styles.wrap}>
      <Burst active />
      <View style={styles.avatar}>
        <Avatar avatarKey={draft.avatarKey ?? 'avatar-fox'} size="lg" />
      </View>
      <Text variant="display" color="ink">
        {name ? `You're all set, ${name}!` : "You're all set!"}
      </Text>
      <Text variant="body" color="inkSoft">
        Your first topic is waiting.
      </Text>
      <ClayButton
        label="Start exploring →"
        variant="coral"
        loading={action.pending}
        onPress={action.run}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm, alignItems: 'center' },
  avatar: { marginBottom: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
```

- [ ] **Step 3: Typecheck + full suite**

Run:

```bash
pnpm typecheck
pnpm test
```

Expected: no type errors (the `onboarding.tsx` `finish` implementation is already async, so it satisfies the new `() => Promise<void>` type); all tests pass.

- [ ] **Step 4: Commit**

```bash
git add onboarding/types.ts onboarding/steps/DoneStep.tsx
git commit -m "feat(app): onboarding finish busy state (#10)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Wire NotificationsStep allow

**Files:**
- Modify: `app/onboarding/steps/NotificationsStep.tsx`

- [ ] **Step 1: Wrap allow in the hook and update buttons**

Replace the ENTIRE contents of `app/onboarding/steps/NotificationsStep.tsx` with:

```tsx
import * as Notifications from 'expo-notifications';
import { Platform, StyleSheet, View } from 'react-native';
import { ClayButton, Text } from '../../components';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { theme } from '../../theme';
import type { NotifPermission, StepProps } from '../types';

function toPermission(status: string): NotifPermission {
  if (status === 'granted') {
    return 'granted';
  }
  if (status === 'denied') {
    return 'denied';
  }
  return 'undetermined';
}

export function NotificationsStep({ patch, next }: StepProps) {
  const allow = async () => {
    if (Platform.OS === 'web') {
      patch({ notifPermission: 'undetermined' });
      next();
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    patch({ notifPermission: toPermission(status) });
    next();
  };
  const allowAction = useAsyncAction(allow);

  return (
    <View style={styles.wrap}>
      <Text variant="display" style={styles.hero}>
        🔔
      </Text>
      <Text variant="title" color="ink">
        One gentle nudge a day
      </Text>
      <Text variant="body" color="inkSoft">
        No spam — just your daily spark, at the time you picked.
      </Text>
      <ClayButton
        label="Allow notifications"
        variant="coral"
        loading={allowAction.pending}
        onPress={allowAction.run}
        style={styles.cta}
      />
      <ClayButton
        label="Maybe later"
        variant="ghost"
        disabled={allowAction.pending}
        onPress={() => {
          patch({ notifPermission: 'undetermined' });
          next();
        }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  hero: { fontSize: 48, lineHeight: 56 },
  cta: { alignSelf: 'stretch', marginTop: theme.space.xs },
});
```

- [ ] **Step 2: Typecheck + full suite**

Run:

```bash
pnpm typecheck
pnpm test
```

Expected: no type errors; all tests pass.

- [ ] **Step 3: Manual smoke check (optional but recommended)**

Run `pnpm start`, then in the app:
- Profile → change a field → "Save changes": the button shows a spinner, then "Saved ✓" appears briefly before returning. Rapidly double-tapping does not save twice.
- Onboarding → reach the Done step → "Start exploring →": spinner shows; double-tap does not write the profile twice.
- Onboarding → Notifications → "Allow notifications": button shows busy while the OS dialog is up.

- [ ] **Step 4: Commit**

```bash
git add onboarding/steps/NotificationsStep.tsx
git commit -m "feat(app): notification permission busy state (#10)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Acceptance criteria mapping

- **AC1 — each of the three buttons disabled + busy while saving:** Task 4 (profile), Task 5 (onboarding finish), Task 6 (notifications allow), all via `ClayButton loading` (Task 3) + `useAsyncAction` (Task 2).
- **AC2 — double-tap cannot trigger a second save / profile write:** Task 2 `useAsyncAction` synchronous `pendingRef` guard (tested) + `disabled` while pending at each call site.
- **AC3 — profile save gives a visible success signal:** Task 4 (success haptic + inline "Saved ✓" live region before navigating).
- **AC4 — ClayButton exposes a documented loading state used by the call sites:** Task 3 (documented `loading` prop) used in Tasks 4–6.

## Notes for the implementer

- Run everything from `~/Documents/Curio/app`.
- The hook test runs under jsdom because of the `hooks/**/*.test.tsx` glob added in Task 1 — do Task 1 before Task 2.
- Do not add full-screen render tests for profile/onboarding/notifications (out of scope per the spec).
- `color="teal"` is a valid `Text` color role (`theme.color.teal` exists).
