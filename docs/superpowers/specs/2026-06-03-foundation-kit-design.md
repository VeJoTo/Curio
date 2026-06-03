# Curio — Foundation Kit Design Spec

**Status:** Approved · ready for implementation planning
**Author:** vera@canuto.no
**Date:** 2026-06-03
**Parent spec:** `docs/superpowers/specs/2026-05-20-curio-design.md` (§5 Screen map, §6 Design system)
**Repo:** https://github.com/VeJoTo/Curio

---

## 1. What this is

The parent spec's "Plan 5" was *all 14 screens plus the entire Geometric Clay design system* — too large for one implementation plan. This spec carves out the **foundation kit**: the design tokens, fonts, and reusable component library that every screen sits on, viewable in a dev gallery route. No user-facing screens are built here; they become later plans (onboarding, daily loop, around-the-loop), each composing this kit.

**Why this slice first:** every screen depends on the kit, it's the highest-leverage design work, and it can be built and verified in isolation without any data, navigation, or storage decisions.

**Done when:** the gallery route renders every component in every state on a device/simulator, token unit tests pass, and lint + typecheck are green.

---

## 2. Scope

### In scope
1. **Theme module** — typed tokens: palette, spacing, radii, shadows, motion durations, type scale.
2. **Fonts** — Fraunces (display), Manrope (body), JetBrains Mono (meta), loaded with a splash gate.
3. **Component library** (10 components, listed in §5).
4. **Gallery route** — a dev route rendering every component in all states; the living showcase and verification artifact.
5. **Minimal landing** — refactor the existing `app/app/index.tsx` smoke screen into a small kit-powered landing that links to the gallery.
6. **Token unit tests** (Vitest) + a documented manual gallery checklist.

### Out of scope (later plans)
- Any user-facing screen (Today, Story, Quiz, Result, onboarding, history, profile, settings).
- Navigation beyond the gallery + landing (the real header→History/Profile wiring ships with those screens).
- Screen-owned compositions: `AnswerChoice` (Quiz), `SceneFrame` (Story), `TopicGridCell` (History) — thin compositions of kit primitives, built with the screens that own them.
- Any data fetching, client state (Zustand/TanStack Query), or storage (MMKV/SQLite).
- Dark mode / theming beyond the single v1 light theme.

---

## 3. Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Styling foundation | Typed TS theme object + React Native `StyleSheet` | Exact control over bespoke clay surfaces; zero new build deps; tokens importable + unit-testable. (NativeWind/Unistyles considered and rejected — clay's custom shadows/borders erode utility-class velocity.) |
| Fonts | `@expo-google-fonts/{fraunces,manrope,jetbrains-mono}` + `expo-font`, gated by `expo-splash-screen` | Standard Expo font loading. |
| Fraunces optical sizing | Static weights (400 / 600 / 900) in v1 | The variable `opsz` axis is later polish; static weights cover the type scale. |
| Motion | Reanimated 3 + Moti, introduced here | Motion presets are part of the design system; the foundation is their natural home. Accepts one-time Reanimated babel-plugin setup. |
| Press interaction | Reanimated spring nudge (2px Y) + `expo-haptics` light impact | Matches §6 "Press = 2px Y nudge + softened shadow + iOS light haptic." |
| Reduced motion | `useReducedMotion` hook over `AccessibilityInfo`; springs → 120ms linear, no decorative motion | §6 non-negotiable. |
| Token tests | Vitest on pure-TS theme files | Cheap, high-value (contrast, scale, completeness). |
| Component tests | Verification-by-running via gallery | RN component unit tests are high-setup/low-value for presentational components; we don't pretend otherwise. |

---

## 4. Theme module

Lives at `app/theme/` (outside the `app/app/` routes dir so Expo Router ignores it).

**`tokens.ts`** — values transcribed from parent spec §6:
- `color` — `cream #FBF6EA`, `peach #FFE9D6`, `rose #F6A6B2`, `teal #A8DBC6`, `mustard #F2C14E`, `indigo #6E4FE8`, `coral #F26B5E`, `ink #2C1B3C`, `inkSoft #5B4A6D`, `surface #FFFCF5`.
- `categoryColor` — maps the shared `ColorToken` enum (`rose|teal|mustard|indigo|coral`) → hex, kept in sync with `@curio/shared`.
- `space` — 4 / 8 base rhythm; section scale 16 / 24 / 40 / 64.
- `radius` — `sm 10`, `md 18`, `lg 28`, `pill 999`.
- `border` — 1.5px ink.
- `shadow` — clay double shadow (outer drop + inner highlight), expressed per-platform (RN `shadow*` on iOS, `elevation` + an inner-highlight view/border on Android).
- `motion` — durations (enter 150–250, exit ~70% of enter), spring config (damping ~14), stagger 40ms, reduced-motion fallback (120ms linear).

**`typography.ts`** — font family constants + a type scale with named variants: `display`, `title`, `heading`, `body`, `bodyStrong`, `meta`. Each variant specifies family, size, lineHeight, weight, letterSpacing. Body ≥16px / lineHeight 1.5 (§6 a11y).

**`index.ts`** — exports a single `theme` object composing the above.

**`theme.test.ts`** (Vitest):
- Contrast (computed WCAG ratios): `ink`-on-`cream` ≥ 11:1 (AAA body); `inkSoft`-on-`cream` ≥ 4.5:1 (AA secondary); white-on-`indigo` ≥ 4.5:1 (AA primary button). Coral is a CTA *fill* with a white bold label and is always paired with an icon/label (never the sole indicator), so its ~3:1 white-on-fill ratio is checked visually in the gallery rather than asserted as body-text contrast.
- Type scale: `body` fontSize ≥ 16 and lineHeight ÷ fontSize ≥ 1.5; sizes decreasing display > title > heading > body; `bodyStrong` same size as `body`; `meta` < `body`.
- Token completeness: every category `ColorToken` (`rose|teal|mustard|indigo|coral`) has a `categoryColor` entry; all palette roles present.

---

## 5. Component library

All in `app/components/`, each a focused file, re-exported from `index.ts`. Built on `theme` + `StyleSheet`. Every component: typed props, accessible (role/label, ≥44pt targets, `hitSlop` where visually smaller), reduced-motion aware.

| Component | Variants / states | Notes |
|---|---|---|
| `Text` | `variant`: display / title / heading / body / bodyStrong / meta; `color` token | The only Text used app-wide; applies the right font + scale. |
| `ClayCard` | static · pressable | Surface primitive (border + double shadow + radius + padding). Pressable adds nudge + haptic. |
| `ClayButton` | `coral` (sole CTA) / `indigo` (primary) / `ghost`; default / pressed / disabled; optional leading/trailing icon | Coral never the sole indicator — always paired with label/icon (§6). One coral per screen is a usage rule, not enforced by the component. |
| `IconButton` | circular clay; default / pressed / disabled | Back, heart, star, close, history, profile. ≥44pt. |
| `Pill` | static · selectable (selected/unselected); category-colored | Interests picker + History filters. |
| `ProgressDots` | `count`, `index`; active dot widens to coral | Onboarding steps + story scenes. |
| `ScreenHeader` | home (title + up to 2 trailing icon actions) · back variant | No bottom tabs. Wired into real routes later. |
| `TextField` | empty / filled / focused; optional error | Name + reflection input. Focus ring = indigo. |
| `SegmentedToggle` | 2+ segments, one active | Quick/Deep depth + settings toggles. |
| `Avatar` | renders an `avatarKey`; sizes sm/md/lg | Placeholder avatar set (emoji/initial) until the real avatar art lands. |

`hooks/useReducedMotion.ts` — wraps `AccessibilityInfo.isReduceMotionEnabled` + change subscription; consumed by animated components.

---

## 6. Routes touched

- `app/app/_layout.tsx` — load the three fonts via `useFonts`, hold the splash screen until ready, then render the `Stack` (headerShown false).
- `app/app/index.tsx` — replace the schema smoke screen with a minimal kit-powered landing (a `ClayCard` + `Text` + a `ClayButton` linking to `/gallery`).
- `app/app/gallery.tsx` — the showcase: every component in §5 rendered in all states, grouped, on a `cream` background. Includes a reduced-motion toggle note and serves as the manual a11y walkthrough surface.

---

## 7. Dependencies added

To `app/package.json`: `expo-font`, `expo-splash-screen`, `expo-haptics`, `react-native-reanimated`, `moti`, `@expo-google-fonts/fraunces`, `@expo-google-fonts/manrope`, `@expo-google-fonts/jetbrains-mono`. Reanimated requires the babel plugin in `babel.config.js`. Vitest added to the `app` workspace, scoped to `theme/**` tests (pure TS, no RN runtime).

---

## 8. Verification

1. **Token tests** — `pnpm --filter @curio/app test` green (contrast, scale, completeness).
2. **Typecheck + lint** — `pnpm typecheck` and `pnpm lint` green across the monorepo.
3. **Gallery run** — `pnpm --filter @curio/app start`, open the gallery route on web + a simulator; confirm every component renders in every state, the clay surfaces match the approved direction, fonts load, press nudge + haptic fire.
4. **Accessibility pass** — reduced-motion on → decorative motion stops; VoiceOver walkthrough of the gallery has sensible labels and reading order; touch targets ≥44pt.

---

## 9. Success criteria

- Gallery renders all 10 components in every state on web + simulator.
- Token unit tests pass; contrast meets the §6 AA/AAA targets.
- A later screen can be assembled purely by composing kit components — no ad-hoc styling needed.
- Lint + typecheck green; CI passes.
