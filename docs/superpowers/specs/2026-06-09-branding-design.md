# Curio branding: app icon + wordmark on Welcome

**Issue:** VeJoTo/Curio #22
**Date:** 2026-06-09

## Goal

Apply Curio's official brand assets — the two-eyed "c" monogram and the "curio"
wordmark — to the app: set the icon (iOS / Android / web favicon) and replace the
`🦉✨` placeholder on the onboarding Welcome screen with the wordmark.

## Brand assets

Provided as SVGs (on the Desktop; to be copied into the repo):
- App icon: a rounded teal "c" with two eyes in the bowl (a friendly face). viewBox 167×259.
- Logo: the "curio" wordmark led by that same two-eyed "c". viewBox 206×89.
- Colors: fill `#43897D` (deep teal), outline `#103F37` (dark forest green).

## Decisions (from brainstorming)

- **App icon treatment:** background-fill — brand teal `#43897D` background with a **cream
  `#FBF6EA` "c"** centered (option C). Bold, pops on a home screen, keeps the eyes visible.
- **Logo rendering:** a PNG export of the wordmark rendered with React Native's built-in
  `Image` — no new dependency, crisp at the fixed Welcome size.
- **Welcome composition:** the wordmark replaces only the emoji; "Stay curious.", the
  value-prop line, and the CTA stay.
- **Palette:** the icon/logo keep the brand's deeper teal `#43897D`; the app's theme
  tokens (`color.teal #A8DBC6`) are **not** changed here (separate concern). See
  [[project_curio_branding]].

## Architecture / files

### Assets — `app/assets/`

Source SVGs are copied to `app/assets/brand/` (versioned). A committed
`app/assets/brand/generate.sh` documents and reproduces every PNG via `rsvg-convert`
+ ImageMagick, so the binaries can be regenerated from source:

- `app/assets/icon.png` — 1024×1024. Teal `#43897D` canvas, cream "c" centered at
  ~60% height. Source: `brand/curio-app-icon.svg` with `fill` recolored to cream.
- `app/assets/adaptive-icon.png` — 1024×1024, **transparent**. Cream "c" centered within
  Android's safe zone (~your logo occupies the inner ~66%). Paired with a config
  `backgroundColor: "#43897D"`.
- `app/assets/favicon.png` — 48×48, same composition as `icon.png` scaled down.
- `app/assets/curio-wordmark.png` — the teal wordmark (its native `#43897D`), transparent
  background, exported at 3× (≈ 618×267) for crispness.

`generate.sh` (committed) contains, in essence:

```sh
# from app/assets/brand
sed 's/#43897D/#FBF6EA/g' curio-app-icon.svg > /tmp/c-cream.svg
rsvg-convert -h 600 /tmp/c-cream.svg -o /tmp/c-cream.png
magick -size 1024x1024 xc:'#43897D' /tmp/c-cream.png -gravity center -composite ../icon.png
magick -size 1024x1024 xc:none      /tmp/c-cream.png -gravity center -resize 1024x1024 \
  -background none -extent 1024x1024 ../adaptive-icon.png   # cream c, transparent, safe-zone padded
magick ../icon.png -resize 48x48 ../favicon.png
rsvg-convert -w 618 curio-logo.svg -o ../curio-wordmark.png
```

(The exact safe-zone padding for `adaptive-icon.png` is tuned so the "c" sits inside
Android's masked circle; the script is the source of truth.)

### Config — `app/app.json`

Add to the `expo` block:
- `"icon": "./assets/icon.png"`
- inside `"android"`: `"adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#43897D" }`
- `"web": { "favicon": "./assets/favicon.png" }`

Splash screen is intentionally not configured in this pass.

### Welcome — `app/onboarding/steps/Welcome.tsx`

Replace the `🦉✨` `Text` hero with:

```tsx
<Image
  source={require('../../assets/curio-wordmark.png')}
  accessibilityLabel="Curio"
  resizeMode="contain"
  style={styles.logo}
/>
```

`styles.logo = { width: 188, height: 81 }` (the 206:89 aspect ratio). `Image` is imported
from `react-native`. The rest of the screen (tagline, value prop, `Pulse` CTA) is unchanged.

## Error handling / edge cases

- A bundled `require`'d PNG always resolves; no runtime fetch, no error state.
- The wordmark is decorative-but-meaningful → `accessibilityLabel="Curio"` so screen
  readers announce the brand name rather than skipping an unlabeled image.

## Testing

No meaningful unit tests (assets + static config). Verification:
- `app.json` parses (Expo config valid) — `pnpm --filter @curio/app exec expo config` (or typecheck of the app, which doesn't read app.json — so a config sanity check).
- `pnpm --filter @curio/app typecheck` and `pnpm lint` clean.
- The web bundle builds.
- Visual: a fresh static render of the Welcome screen shows the wordmark; the generated
  icon PNGs are inspected (eyes visible, padding correct).

## Out of scope

- Splash screen artwork.
- Reconciling the app's theme teal toward the brand `#43897D`.
- Using the "c" mark elsewhere (Today header, etc.) — possible future once `react-native-svg`
  or the mark PNG is available.
