# Global Error Boundary — Design

**Issue:** #12 — Add a global error boundary; an uncaught render error currently crashes to the native screen.
**Date:** 2026-06-09
**Severity:** 3 (major) — Nielsen heuristic #9 (recognize, diagnose, recover from errors).

## Problem

`app/app/_layout.tsx` is a bare `<Stack>` with no error boundary anywhere in the
tree. Any uncaught render exception — a malformed topic, a missing field, a bad
route param — drops the user to the raw native crash screen with no recovery.

## Goal

A single global safety net: catch uncaught render errors and show a friendly
in-app recovery screen with a way back to a working state, instead of the native
crash screen.

## Architecture

Two new components plus a wiring change in the root layout.

### 1. `app/components/ErrorBoundary.tsx`

A class component (the only way to catch render errors in React).

- State: `{ hasError: boolean; error: Error | null }`.
- `static getDerivedStateFromError(error)` → `{ hasError: true, error }`.
- `componentDidCatch(error, info)` → `console.error` for diagnostics.
- `reset()` → clears state back to healthy.
- Generic via a render prop: `renderFallback: (reset: () => void, error: Error | null) => ReactNode`.
- Renders `children` when healthy, `renderFallback(...)` when caught.

Keeping the boundary generic (render-prop, no router/navigation knowledge) makes
it independently testable and reusable.

### 2. `app/components/ErrorFallback.tsx`

The presentational recovery screen, in the Geometric Clay system.

- Layout: `SafeAreaView` on `theme.color.cream`, centered content.
- A Fraunces heading "Something went wrong" and a soft body line
  ("The app hit an unexpected snag. You can try again or head back to today.").
- Two `ClayButton`s:
  - **"Try again"** — `coral` — `onRetry`
  - **"Back to today"** — `ghost` — `onGoHome`
- Props: `{ onRetry: () => void; onGoHome: () => void }`.
- Accessibility: heading uses `accessibilityRole="header"`; the message has
  `accessibilityLiveRegion="polite"` so it is announced.

### 3. `app/app/_layout.tsx`

Wrap `<Stack>` with `<ErrorBoundary>`. Because the boundary sits above the
navigator's children, it catches render errors thrown by any route screen.

The fallback wiring needs `useRouter`, which a class component can't use, so the
fallback is built by a small functional helper rendered inside `renderFallback`.
Router context is provided by Expo Router *above* the root layout, so it remains
available inside the fallback even after a child render error.

```tsx
<ErrorBoundary
  renderFallback={(reset) => <RootErrorFallback reset={reset} />}
>
  <Stack screenOptions={{ headerShown: false }} />
</ErrorBoundary>
```

`RootErrorFallback` is a function component (in `_layout.tsx`) that calls
`useRouter()` and renders `<ErrorFallback>` with:

- **Try again** → `reset()` — re-attempt the current screen; recovers transient errors.
- **Back to today** → `router.replace('/')` then `reset()` — escapes a screen
  that is persistently broken, so a plain reset wouldn't loop.

## Error handling / recovery

- Any uncaught render error → in-app fallback instead of the native crash screen.
- Two exits ("Try again", "Back to today") — no dead-end.
- Error logged to console for diagnostics.

## Testing

New, project-wide component-test infrastructure (none exists today; all current
tests are pure-logic `.test.ts` under the `node` environment).

### Infra

- devDeps: `@testing-library/react`, `jsdom`.
- `vitest.setup.ts`: mock `react-native-reanimated` so `ClayButton`'s press
  animation works under jsdom.
- `vitest.config.ts`:
  - add alias `react-native` → `react-native-web`,
  - include `components/**/*.test.tsx`,
  - run component tests under the `jsdom` environment (logic tests stay `node`),
  - register the setup file.

### Tests

- `ErrorBoundary.test.tsx`
  - Renders a throwing child → the fallback appears. **(AC3)**
  - Recovery: a child that stops throwing → "Try again" → healthy content shows.
- `ErrorFallback.test.tsx`
  - Renders the heading, message, and both buttons.
  - Pressing each button fires its callback.

## Acceptance criteria

- [ ] A thrown render error shows an in-app recovery screen instead of the native crash screen.
- [ ] The recovery screen offers a way back to a working state (Try again / Back to today).
- [ ] Covered by a test that renders a throwing child and asserts the fallback appears.

## Out of scope (YAGNI)

- `expo-updates` hard reload.
- Remote error reporting (Sentry, etc.).
- Per-route / segment-level error boundaries.
