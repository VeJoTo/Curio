# Branding completion — design

**Issue:** #34 · **Date:** 2026-06-10

Finishes the Curio brand integration started under #22 (app icon, Android
adaptive icon, web favicon, and the wordmark on the onboarding Welcome screen).
Three pieces remain: a branded splash screen, the wordmark on a couple more
screens, and brand color tokens in the theme.

The in-app "Geometric Clay" category palette (`theme.color.*`) is intentional
and stays untouched — brand colors are added as a separate group and used only
for the brand mark itself, not to recolor the UI.

## 1. Splash screen

The app currently has no splash, so launch is unbranded. `expo-splash-screen`
is already a dependency; it just isn't configured.

- Add the config plugin to `app/app.json`:
  ```json
  ["expo-splash-screen", {
    "image": "./assets/splash-icon.png",
    "imageWidth": 200,
    "backgroundColor": "#AED6C6",
    "resizeMode": "contain"
  }]
  ```
  Mint `#AED6C6` matches the app-icon background so the launch reads continuous
  with the home-screen icon.
- New asset `app/assets/splash-icon.png`: the deep-teal "c" mark stacked above
  the "curio" wordmark, on a transparent background (the plugin paints the mint
  behind it). Generated from the existing source SVGs
  (`curio-app-icon.svg`, `curio-logo.svg`) by a new step in
  `app/assets/brand/generate.sh`, so it regenerates alongside the other assets.

## 2. Wordmark placements

- **Today header** (`app/app/index.tsx`): a small wordmark (~84px wide) sits
  top-left where the "Today" meta label is now; the greeting stays directly
  below it. "Today" is redundant with the greeting, so the wordmark replaces it.
- **Profile** (`app/app/profile.tsx`): the header row is already
  `[← back] [You] [spacer]`, so the wordmark goes as a quiet centered **footer**
  at the bottom of the scroll content (a brand signature) rather than crowding
  the header title.

Both render the existing `curio-wordmark.png` via `<Image>`, tinted (see below).

## 3. Brand tokens

- Add to `app/theme/tokens.ts`:
  ```ts
  export const brand = { teal: '#43897D', green: '#103F37' } as const;
  ```
  Exported through `theme` (`theme.brand`). `color.*` (Clay palette) is
  unchanged.
- **Usage:** every in-app wordmark `<Image>` (Welcome, Today, Profile) gets
  `tintColor: theme.brand.teal`, so the wordmark renders in exact brand teal
  regardless of the PNG's baked color. `brand.green` is defined and reserved for
  future dark accents. Mint `#AED6C6` stays a literal in the static `app.json`
  and `generate.sh` (JSON/shell can't reference the TS token).

## Testing & verification

- **Unit:** extend `app/theme/theme.test.ts` to assert the `brand` tokens exist
  and are valid hex — mirrors the existing palette assertions.
- **Presentational / native** (splash config, wordmark `<Image>` placement) is
  not unit-tested, consistent with the repo norm for native/presentational code
  (cf. `notifications/service.ts`, storage). The splash needs an **on-device
  check** since it can't be exercised in the test runner.
- Gates: `pnpm -r typecheck`, `pnpm lint`, `pnpm --filter app test` stay green.

## Out of scope

- Overwriting or recoloring the Geometric Clay category palette.
- Any new icon/adaptive-icon work (shipped under #22).
