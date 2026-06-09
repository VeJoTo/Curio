# Global Error Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catch uncaught render errors anywhere in the app and show a friendly in-app recovery screen with two exits, instead of dropping the user to the native crash screen.

**Architecture:** A generic `ErrorBoundary` class component (render-prop fallback) wraps `<Stack>` in the root layout. A presentational `ErrorFallback` screen (Geometric Clay) provides "Try again" (reset) and "Back to today" (`router.replace('/')` + reset). New jsdom + react-native-web + Testing Library infra under the existing vitest setup makes the boundary and fallback testable.

**Tech Stack:** Expo Router 3.5 / React Native 0.74 / React 18, vitest 2.1, react-native-web, @testing-library/react, jsdom. Package manager: **pnpm** workspace (`@curio/app`).

---

## File Structure

- **Create** `app/vitest.setup.ts` — global test setup: mock `react-native-reanimated`, polyfill `window.matchMedia` for jsdom.
- **Modify** `app/vitest.config.ts` — alias `react-native` → `react-native-web`, include `components/**/*.test.tsx`, run those under jsdom, register the setup file.
- **Modify** `app/components/Text.tsx` — forward optional `accessibilityRole` / `accessibilityLiveRegion`.
- **Create** `app/components/Text.test.tsx` — verifies the accessibility pass-through (also validates the jsdom infra).
- **Create** `app/components/ErrorFallback.tsx` — the recovery screen.
- **Create** `app/components/ErrorFallback.test.tsx` — renders message + both actions; buttons fire callbacks.
- **Create** `app/components/ErrorBoundary.tsx` — the catching class component.
- **Create** `app/components/ErrorBoundary.test.tsx` — throwing child shows fallback; reset recovers.
- **Modify** `app/components/index.ts` — export the two new components.
- **Modify** `app/app/_layout.tsx` — wrap `<Stack>` with the boundary, wire the router-aware fallback.

All commands run from `~/Documents/Curio/app` unless stated otherwise.

---

## Task 1: Install component-test dependencies

**Files:** none (dependency change only)

- [ ] **Step 1: Install devDeps**

Run from `~/Documents/Curio/app`:

```bash
pnpm add -D jsdom @testing-library/react @testing-library/dom
```

- [ ] **Step 2: Verify they resolve**

Run:

```bash
ls node_modules/jsdom/package.json node_modules/@testing-library/react/package.json node_modules/@testing-library/dom/package.json
```

Expected: all three paths print (no "No such file").

- [ ] **Step 3: Commit**

```bash
git add package.json ../pnpm-lock.yaml
git commit -m "test(app): add jsdom + testing-library for component tests (#12)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Test infrastructure (setup file + vitest config)

**Files:**
- Create: `app/vitest.setup.ts`
- Modify: `app/vitest.config.ts`

- [ ] **Step 1: Create the setup file**

Create `app/vitest.setup.ts`:

```ts
import { vi } from 'vitest';

// Components pull in react-native-reanimated via ClayButton/usePressNudge.
// Mock the bits they use so they render under jsdom without the native runtime.
vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  const RNW = (await import('react-native-web')) as any;
  const View = RNW.View ?? RNW.default.View;
  return {
    default: { View: (props: any) => React.createElement(View, props) },
    useSharedValue: (value: any) => ({ value }),
    useAnimatedStyle: () => ({}),
    withSpring: (value: any) => value,
    withTiming: (value: any) => value,
    runOnJS: (fn: any) => fn,
  };
});

// jsdom has no matchMedia; react-native-web's AccessibilityInfo needs it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as any;
}
```

- [ ] **Step 2: Update vitest config**

Replace the entire contents of `app/vitest.config.ts` with:

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
    ],
    environment: 'node',
    environmentMatchGlobs: [['components/**/*.test.tsx', 'jsdom']],
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 3: Verify existing logic tests still pass (no regression)**

Run:

```bash
pnpm test
```

Expected: PASS. All existing `.test.ts` suites pass exactly as before (no `components/**` tests exist yet, so the new glob matches nothing). The alias is inert for node tests because they don't import React Native at runtime.

- [ ] **Step 4: Commit**

```bash
git add vitest.setup.ts vitest.config.ts
git commit -m "test(app): jsdom env + rn-web alias + reanimated mock for component tests (#12)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Forward accessibility props on `Text`

`ErrorFallback` needs a heading role and a live-region message. Extend the shared `Text` to forward those two props. This first component test also validates the jsdom/RNW/RTL pipeline end-to-end.

**Files:**
- Modify: `app/components/Text.tsx`
- Test: `app/components/Text.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/components/Text.test.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Text } from './Text';

afterEach(cleanup);

describe('Text', () => {
  it('forwards accessibilityRole so a heading exposes the heading role', () => {
    render(
      <Text variant="title" accessibilityRole="header">
        Hello
      </Text>,
    );
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- components/Text.test.tsx
```

Expected: FAIL — `Text` does not accept `accessibilityRole` (TS error) and/or no element with role "heading" is found.

- [ ] **Step 3: Add the pass-through props**

Edit `app/components/Text.tsx`. Add the two optional props to the interface and forward them to `RNText`.

Change the interface:

```tsx
import type { AccessibilityRole } from 'react-native';

interface TextProps {
  variant?: TypeVariant;
  color?: ColorRole;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  children: ReactNode;
}
```

Change the component signature and the `RNText` element:

```tsx
export function Text({
  variant = 'body',
  color = 'ink',
  style,
  numberOfLines,
  accessibilityRole,
  accessibilityLiveRegion,
  children,
}: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      accessibilityRole={accessibilityRole}
      accessibilityLiveRegion={accessibilityLiveRegion}
      style={[theme.type[variant], { color: theme.color[color] }, style]}
    >
      {children}
    </RNText>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- components/Text.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/Text.tsx components/Text.test.tsx
git commit -m "feat(app): Text forwards accessibilityRole/liveRegion (#12)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `ErrorFallback` recovery screen

**Files:**
- Create: `app/components/ErrorFallback.tsx`
- Test: `app/components/ErrorFallback.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/components/ErrorFallback.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from './ErrorFallback';

afterEach(cleanup);

describe('ErrorFallback', () => {
  it('shows the recovery message and both actions', () => {
    render(<ErrorFallback onRetry={() => {}} onGoHome={() => {}} />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
    expect(screen.getByText('Back to today')).toBeTruthy();
  });

  it('fires onRetry and onGoHome when the buttons are pressed', () => {
    const onRetry = vi.fn();
    const onGoHome = vi.fn();
    render(<ErrorFallback onRetry={onRetry} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByText('Try again'));
    fireEvent.click(screen.getByText('Back to today'));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onGoHome).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- components/ErrorFallback.test.tsx
```

Expected: FAIL — `./ErrorFallback` cannot be resolved.

- [ ] **Step 3: Implement the component**

Create `app/components/ErrorFallback.tsx`:

```tsx
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { Text } from './Text';

interface ErrorFallbackProps {
  onRetry: () => void;
  onGoHome: () => void;
}

export function ErrorFallback({ onRetry, onGoHome }: ErrorFallbackProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text variant="title" accessibilityRole="header" style={styles.centered}>
          Something went wrong
        </Text>
        <Text
          variant="body"
          color="inkSoft"
          accessibilityLiveRegion="polite"
          style={styles.centered}
        >
          The app hit an unexpected snag. You can try again or head back to today.
        </Text>
        <View style={styles.actions}>
          <ClayButton label="Try again" variant="coral" onPress={onRetry} />
          <ClayButton label="Back to today" variant="ghost" onPress={onGoHome} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  centered: { textAlign: 'center' },
  actions: { gap: theme.space.sm, alignItems: 'center', marginTop: theme.space.sm },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- components/ErrorFallback.test.tsx
```

Expected: PASS (both cases).

- [ ] **Step 5: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ErrorFallback.tsx components/ErrorFallback.test.tsx
git commit -m "feat(app): ErrorFallback recovery screen (#12)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `ErrorBoundary` catching component

**Files:**
- Create: `app/components/ErrorBoundary.tsx`
- Test: `app/components/ErrorBoundary.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/components/ErrorBoundary.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

afterEach(cleanup);

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  it('renders the fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary renderFallback={() => <Text>Recovery screen</Text>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovery screen')).toBeTruthy();
    spy.mockRestore();
  });

  it('recovers when reset is called and the child no longer throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    function Child() {
      if (shouldThrow) {
        throw new Error('kaboom');
      }
      return <Text>Healthy</Text>;
    }
    render(
      <ErrorBoundary
        renderFallback={(reset) => (
          <Text
            onPress={() => {
              shouldThrow = false;
              reset();
            }}
          >
            Try again
          </Text>
        )}
      >
        <Child />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Healthy')).toBeTruthy();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- components/ErrorBoundary.test.tsx
```

Expected: FAIL — `./ErrorBoundary` cannot be resolved.

- [ ] **Step 3: Implement the component**

Create `app/components/ErrorBoundary.tsx`:

```tsx
import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  renderFallback: (reset: () => void, error: Error | null) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Uncaught render error:', error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.renderFallback(this.reset, this.state.error);
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- components/ErrorBoundary.test.tsx
```

Expected: PASS (both cases). React will print the caught error to stderr around the first case — that is expected; the `console.error` spy keeps output quiet and the assertions still pass.

- [ ] **Step 5: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ErrorBoundary.tsx components/ErrorBoundary.test.tsx
git commit -m "feat(app): ErrorBoundary catching component (#12)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Wire the boundary into the root layout

**Files:**
- Modify: `app/components/index.ts`
- Modify: `app/app/_layout.tsx`

- [ ] **Step 1: Export the new components**

Edit `app/components/index.ts`. Add these two lines (keep the list alphabetical-ish, near the other `Clay*`/`Error*` entries):

```ts
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorFallback } from './ErrorFallback';
```

- [ ] **Step 2: Wrap the Stack and wire the fallback**

Edit `app/app/_layout.tsx`.

Add to the imports (alongside the existing `expo-router` import and a new components import):

```tsx
import { Stack, useRouter } from 'expo-router';
import { ErrorBoundary, ErrorFallback } from '../components';
```

Add this function component above `RootLayout`:

```tsx
function RootErrorFallback({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <ErrorFallback
      onRetry={reset}
      onGoHome={() => {
        router.replace('/');
        reset();
      }}
    />
  );
}
```

Replace the returned tree's `<Stack ... />` so it is wrapped by the boundary:

```tsx
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary renderFallback={(reset) => <RootErrorFallback reset={reset} />}>
        <Stack screenOptions={{ headerShown: false }} />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
```

- [ ] **Step 3: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Run the full test suite**

Run:

```bash
pnpm test
```

Expected: PASS — all logic tests plus the three new component suites (`Text`, `ErrorFallback`, `ErrorBoundary`).

- [ ] **Step 5: Manual smoke check (optional but recommended)**

Temporarily add `throw new Error('boundary smoke test');` at the top of the `Today` component body in `app/app/index.tsx`, run `pnpm start`, open the app, and confirm the "Something went wrong" screen appears (not the native red box) with "Try again" / "Back to today". Then **remove the temporary throw** and confirm the app loads normally.

- [ ] **Step 6: Commit**

```bash
git add components/index.ts app/_layout.tsx
git commit -m "feat(app): wrap root navigator in a global error boundary (#12)

Closes #12

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Acceptance criteria mapping

- **AC1 — render error shows in-app recovery, not native crash:** Task 5 (`ErrorBoundary`) + Task 6 (wired around `<Stack>`); Task 6 Step 5 verifies in the running app.
- **AC2 — recovery screen offers a way back to a working state:** Task 4 (`ErrorFallback` "Try again" / "Back to today") + Task 6 (`router.replace('/')` + reset wiring).
- **AC3 — covered by a test that renders a throwing child and asserts the fallback appears:** Task 5 Step 1, first test case.

## Notes for the implementer

- Run every command from `~/Documents/Curio/app`.
- `pnpm test -- <path>` passes the path through to `vitest run`; the bare `pnpm test` runs everything.
- React intentionally logs caught errors to stderr in the `ErrorBoundary` throwing test — the `console.error` spy in that test silences it; this is not a failure.
- Do not add `expo-updates`, remote error reporting, or per-route boundaries — explicitly out of scope (see spec §"Out of scope").
