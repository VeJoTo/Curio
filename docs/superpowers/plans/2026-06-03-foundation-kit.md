# Foundation Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Curio's Geometric Clay design-system foundation — a typed theme, three fonts, ten reusable React Native components, and a dev gallery route — so every later screen is pure composition.

**Architecture:** A pure-TypeScript `theme/` module (palette, type scale, spacing, radii, shadows, motion) lives outside the Expo Router routes dir and is unit-tested with Vitest. `components/` builds presentational components on `theme` + `StyleSheet`, animated with Reanimated 3 and verified by running a `gallery` route rather than unit-tested. Fonts load in the root layout behind a splash gate.

**Tech Stack:** Expo SDK 51 · Expo Router · TypeScript · React Native StyleSheet · Reanimated 3 · Moti · expo-haptics · expo-font + @expo-google-fonts · Vitest (theme only) · Biome (lint/format).

**Spec reference:** `docs/superpowers/specs/2026-06-03-foundation-kit-design.md`

**Branch:** All tasks land on `feat/foundation-kit` (already created). Each task commits separately; PR opens after Task 12.

---

## File Structure

```
app/
├── babel.config.js               # NEW — adds Reanimated plugin
├── vitest.config.ts              # NEW — runs theme tests only
├── package.json                  # MODIFY — deps + test script
├── tsconfig.json                 # MODIFY — include theme/components/hooks
├── theme/
│   ├── tokens.ts                 # NEW — palette, space, radii, shadow, motion (pure data)
│   ├── typography.ts             # NEW — font families + type scale
│   ├── index.ts                  # NEW — composes `theme`
│   └── theme.test.ts             # NEW — Vitest: contrast, scale, completeness
├── hooks/
│   ├── useReducedMotion.ts       # NEW
│   └── usePressNudge.ts          # NEW — shared press animation + haptic
├── components/
│   ├── Text.tsx  ClayCard.tsx  ClayButton.tsx  IconButton.tsx
│   ├── Pill.tsx  SegmentedToggle.tsx  ProgressDots.tsx
│   ├── ScreenHeader.tsx  TextField.tsx  Avatar.tsx
│   └── index.ts                  # NEW — barrel
└── app/
    ├── _layout.tsx               # MODIFY — load fonts + splash gate
    ├── index.tsx                 # MODIFY — kit-powered landing → /gallery
    └── gallery.tsx               # NEW — dev showcase
```

**Boundary discipline:** `theme/` imports nothing from `react-native` at *value* level (type-only imports are fine) so it stays Vitest-importable in Node. Components are the only place `Platform`/`StyleSheet`/Reanimated are used. Nothing in `theme/` or `components/` imports from `app/app/` (routes depend on components, never the reverse).

---

## Pre-task: confirm branch

```bash
cd /Users/vera/Documents/Curio
git branch --show-current   # expect: feat/foundation-kit
```

If not on it: `git checkout feat/foundation-kit`.

---

### Task 1: Dependencies, Reanimated babel, Vitest, tsconfig

**Files:**
- Create: `app/babel.config.js`, `app/vitest.config.ts`
- Modify: `app/package.json`, `app/tsconfig.json`

- [ ] **Step 1: Install Expo-managed native deps (SDK-correct versions)**

```bash
cd /Users/vera/Documents/Curio
pnpm --filter @curio/app exec expo install expo-font expo-splash-screen expo-haptics react-native-reanimated @expo-google-fonts/fraunces @expo-google-fonts/manrope @expo-google-fonts/jetbrains-mono
```

Expected: `app/package.json` gains those dependencies at SDK-51-compatible versions; `pnpm-lock.yaml` updates.

- [ ] **Step 2: Install Vitest**

```bash
pnpm --filter @curio/app add -D vitest
```

> **Moti is intentionally not installed here.** The kit's only animation is the Reanimated press-nudge (Task 3). Moti (declarative entrance animations) composes on the Reanimated set up here and lands with the first screen plan that needs it — installing it now would be an unused dependency.

- [ ] **Step 3: Add the `test` script to `app/package.json`**

In the `"scripts"` block, add a `test` entry so it reads:

```json
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
```

- [ ] **Step 4: Create `app/babel.config.js`**

Reanimated requires its Babel plugin, and it must be listed **last**.

```js
module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 5: Create `app/vitest.config.ts`**

Scope Vitest to the pure-TS theme tests only — component files import React Native and must not be collected.

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['theme/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 6: Update `app/tsconfig.json` to include the new dirs**

Replace the file with:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@curio/shared": ["../shared/src/index.ts"],
      "@curio/shared/*": ["../shared/src/*"]
    }
  },
  "include": [
    "app/**/*",
    "theme/**/*",
    "components/**/*",
    "hooks/**/*",
    "index.ts",
    "expo-env.d.ts",
    ".expo/types/**/*.ts"
  ]
}
```

> Keep `expo-env.d.ts` (Expo global types) and `.expo/types/**/*.ts` (generated `typedRoutes` augmentation) in `include` — dropping them silently disables typed-route checking, so `router.push('/gallery')` would accept any string.

- [ ] **Step 7: Verify install + typecheck**

```bash
pnpm --filter @curio/app typecheck
```

Expected: no output, exit 0. (No source uses the new deps yet — this just confirms the toolchain is intact.)

- [ ] **Step 8: Commit**

```bash
git add app/package.json app/babel.config.js app/vitest.config.ts app/tsconfig.json pnpm-lock.yaml
git commit -m "chore(app): add design-system deps, reanimated babel, vitest"
```

---

### Task 2: Theme module (TDD)

**Files:**
- Create: `app/theme/tokens.ts`, `app/theme/typography.ts`, `app/theme/index.ts`, `app/theme/theme.test.ts`

- [ ] **Step 1: Write the failing test**

`app/theme/theme.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { theme } from './index';

// WCAG 2.1 relative luminance + contrast ratio, computed from a #rrggbb string.
function luminance(hex: string): number {
  const v = hex.replace('#', '');
  const channel = (h: string) => {
    const s = Number.parseInt(h, 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(v.slice(0, 2));
  const g = channel(v.slice(2, 4));
  const b = channel(v.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('palette contrast', () => {
  it('ink on cream is AAA body (>= 11:1)', () => {
    expect(contrast(theme.color.ink, theme.color.cream)).toBeGreaterThanOrEqual(11);
  });

  it('inkSoft on cream is AA (>= 4.5:1)', () => {
    expect(contrast(theme.color.inkSoft, theme.color.cream)).toBeGreaterThanOrEqual(4.5);
  });

  it('white on indigo is AA for the primary button (>= 4.5:1)', () => {
    expect(contrast('#FFFFFF', theme.color.indigo)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('type scale', () => {
  it('body is at least 16px with line-height >= 1.5', () => {
    expect(theme.type.body.fontSize).toBeGreaterThanOrEqual(16);
    expect(theme.type.body.lineHeight / theme.type.body.fontSize).toBeGreaterThanOrEqual(1.5);
  });

  it('sizes step down display > title > heading > body', () => {
    expect(theme.type.display.fontSize).toBeGreaterThan(theme.type.title.fontSize);
    expect(theme.type.title.fontSize).toBeGreaterThan(theme.type.heading.fontSize);
    expect(theme.type.heading.fontSize).toBeGreaterThan(theme.type.body.fontSize);
  });

  it('bodyStrong matches body size; meta is smaller', () => {
    expect(theme.type.bodyStrong.fontSize).toBe(theme.type.body.fontSize);
    expect(theme.type.meta.fontSize).toBeLessThan(theme.type.body.fontSize);
  });
});

describe('token completeness', () => {
  it('every category color token maps to a hex', () => {
    for (const token of ['rose', 'teal', 'mustard', 'indigo', 'coral'] as const) {
      expect(theme.categoryColor[token]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('exposes the core palette roles', () => {
    for (const role of ['cream', 'peach', 'surface', 'ink', 'inkSoft', 'coral', 'indigo'] as const) {
      expect(theme.color[role]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
```

- [ ] **Step 2: Run the test (expect failure — no module yet)**

```bash
pnpm --filter @curio/app test
```

Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Write `app/theme/tokens.ts`** (pure data — no value import of `react-native`)

```ts
import type { ViewStyle } from 'react-native';

// Geometric Clay tokens — transcribed from the design spec §6.
export const color = {
  cream: '#FBF6EA',
  peach: '#FFE9D6',
  rose: '#F6A6B2',
  teal: '#A8DBC6',
  mustard: '#F2C14E',
  indigo: '#6E4FE8',
  coral: '#F26B5E',
  ink: '#2C1B3C',
  inkSoft: '#5B4A6D',
  surface: '#FFFCF5',
} as const;

// Category tokens mirror the `ColorToken` enum in @curio/shared.
export const categoryColor = {
  rose: color.rose,
  teal: color.teal,
  mustard: color.mustard,
  indigo: color.indigo,
  coral: color.coral,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const radius = {
  sm: 10,
  md: 18,
  lg: 28,
  pill: 999,
} as const;

export const borderWidth = 1.5;

// Clay surface shadow. RN cannot do inset shadows natively, so the inner
// highlight is approximated by the 1.5px ink border + light card surface;
// this is the outer drop. Applied per-platform by components via Platform.select.
// Typed as ViewStyle (not `as const`) so the two differently-shaped platform
// values unify to a single `T` and `Platform.select(shadow.clay)` resolves.
type ShadowSpec = { ios: ViewStyle; android: ViewStyle };

export const shadow: { clay: ShadowSpec; pressed: ShadowSpec } = {
  clay: {
    ios: {
      shadowColor: color.ink,
      shadowOpacity: 0.18,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 4 },
  },
  pressed: {
    ios: {
      shadowColor: color.ink,
      shadowOpacity: 0.14,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 2 },
  },
};

export const motion = {
  durEnter: 220,
  durExit: 150,
  spring: { damping: 14, stiffness: 180, mass: 1 },
  stagger: 40,
  reducedDur: 120,
} as const;
```

- [ ] **Step 4: Write `app/theme/typography.ts`**

```ts
import type { TextStyle } from 'react-native';

// Font family keys match the faces loaded in app/app/_layout.tsx.
export const fontFamily = {
  display: 'Fraunces_900Black',
  displaySemi: 'Fraunces_600SemiBold',
  body: 'Manrope_400Regular',
  bodyBold: 'Manrope_700Bold',
  bodyMedium: 'Manrope_500Medium',
  meta: 'JetBrainsMono_500Medium',
} as const;

export type TypeVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'meta';

export const typeScale: Record<TypeVariant, TextStyle> = {
  display: { fontFamily: fontFamily.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
  title: { fontFamily: fontFamily.displaySemi, fontSize: 28, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: fontFamily.bodyBold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fontFamily.bodyBold, fontSize: 16, lineHeight: 24 },
  meta: {
    fontFamily: fontFamily.meta,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
};
```

- [ ] **Step 5: Write `app/theme/index.ts`**

```ts
import {
  borderWidth,
  categoryColor,
  color,
  motion,
  radius,
  shadow,
  space,
} from './tokens';
import { fontFamily, typeScale } from './typography';

export const theme = {
  color,
  categoryColor,
  space,
  radius,
  borderWidth,
  shadow,
  motion,
  fontFamily,
  type: typeScale,
} as const;

export type Theme = typeof theme;
export type ColorRole = keyof typeof color;
export { type TypeVariant } from './typography';
```

- [ ] **Step 6: Run the tests — expect pass**

```bash
pnpm --filter @curio/app test
```

Expected: PASS — all 8 tests green.

- [ ] **Step 7: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add app/theme/
git commit -m "feat(app): geometric clay theme tokens + typography (tested)"
```

---

### Task 3: Motion hooks + Text component

**Files:**
- Create: `app/hooks/useReducedMotion.ts`, `app/hooks/usePressNudge.ts`, `app/components/Text.tsx`

> Components are verified by the gallery (Task 11–12). Per-task verification here is typecheck + lint.

- [ ] **Step 1: Write `app/hooks/useReducedMotion.ts`**

```ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) {
        setReduced(value);
      }
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
```

- [ ] **Step 2: Write `app/hooks/usePressNudge.ts`**

```ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { theme } from '../theme';
import { useReducedMotion } from './useReducedMotion';

// Shared press behaviour: nudge the surface down by `distance`px and fire a
// light haptic on press-in. Honours reduced-motion (linear, no spring).
export function usePressNudge(distance = 2) {
  const y = useSharedValue(0);
  const reduced = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  const onPressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    y.value = reduced
      ? withTiming(distance, { duration: theme.motion.reducedDur })
      : withSpring(distance, theme.motion.spring);
  };

  const onPressOut = () => {
    y.value = reduced
      ? withTiming(0, { duration: theme.motion.reducedDur })
      : withSpring(0, theme.motion.spring);
  };

  return { animatedStyle, onPressIn, onPressOut };
}
```

- [ ] **Step 3: Write `app/components/Text.tsx`**

```tsx
import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { theme } from '../theme';
import type { ColorRole, TypeVariant } from '../theme';

interface TextProps {
  variant?: TypeVariant;
  color?: ColorRole;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  children: ReactNode;
}

export function Text({
  variant = 'body',
  color = 'ink',
  style,
  numberOfLines,
  children,
}: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[theme.type[variant], { color: theme.color[color] }, style]}
    >
      {children}
    </RNText>
  );
}
```

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/hooks/ app/components/Text.tsx
git commit -m "feat(app): motion hooks + Text component"
```

---

### Task 4: ClayCard

**Files:**
- Create: `app/components/ClayCard.tsx`

- [ ] **Step 1: Write `app/components/ClayCard.tsx`**

```tsx
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressNudge } from '../hooks/usePressNudge';
import { theme } from '../theme';

interface ClayCardProps {
  children: ReactNode;
  onPress?: () => void;
  surface?: 'cream' | 'surface' | 'peach';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ClayCard({
  children,
  onPress,
  surface = 'surface',
  style,
  accessibilityLabel,
}: ClayCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressNudge();
  const base = [styles.card, { backgroundColor: theme.color[surface] }, style];

  if (!onPress) {
    return <View style={base}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[base, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    ...Platform.select(theme.shadow.clay),
  },
});
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/ClayCard.tsx
git commit -m "feat(app): ClayCard surface component"
```

---

### Task 5: ClayButton + IconButton

**Files:**
- Create: `app/components/ClayButton.tsx`, `app/components/IconButton.tsx`

- [ ] **Step 1: Write `app/components/ClayButton.tsx`**

```tsx
import { Platform, Pressable, StyleSheet } from 'react-native';
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

- [ ] **Step 2: Write `app/components/IconButton.tsx`**

```tsx
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressNudge } from '../hooks/usePressNudge';
import { theme } from '../theme';
import { Text } from './Text';

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function IconButton({ icon, onPress, accessibilityLabel, disabled = false }: IconButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressNudge();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Animated.View style={[styles.ib, { opacity: disabled ? 0.4 : 1 }, disabled ? null : animatedStyle]}>
        <Text variant="heading" color="ink">
          {icon}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ib: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select(theme.shadow.clay),
  },
});
```

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/ClayButton.tsx app/components/IconButton.tsx
git commit -m "feat(app): ClayButton + IconButton"
```

---

### Task 6: Pill + SegmentedToggle

**Files:**
- Create: `app/components/Pill.tsx`, `app/components/SegmentedToggle.tsx`

- [ ] **Step 1: Write `app/components/Pill.tsx`**

```tsx
import { Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Background when unselected (e.g. a category color). Defaults to surface. */
  tint?: string;
}

export function Pill({ label, selected = false, onPress, tint }: PillProps) {
  const backgroundColor = selected ? theme.color.indigo : (tint ?? theme.color.surface);
  const textColor = selected ? 'surface' : 'ink';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={6}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      style={[styles.pill, { backgroundColor }]}
    >
      <Text variant="bodyStrong" color={textColor}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Write `app/components/SegmentedToggle.tsx`**

```tsx
import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

interface SegmentedToggleProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedToggle({ options, value, onChange }: SegmentedToggleProps) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active ? styles.segmentActive : null]}
          >
            <Text variant="bodyStrong" color={active ? 'surface' : 'ink'}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  segment: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: theme.color.indigo,
  },
});
```

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/Pill.tsx app/components/SegmentedToggle.tsx
git commit -m "feat(app): Pill + SegmentedToggle"
```

---

### Task 7: ProgressDots

**Files:**
- Create: `app/components/ProgressDots.tsx`

- [ ] **Step 1: Write `app/components/ProgressDots.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';

interface ProgressDotsProps {
  count: number;
  index: number;
}

export function ProgressDots({ count, index }: ProgressDotsProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: count, now: index + 1 }}
    >
      {Array.from({ length: count }, (_, i) => {
        const active = i === index;
        const done = i < index;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional and never reorder
          <View
            key={i}
            style={[
              styles.dot,
              active ? styles.active : null,
              done ? styles.done : null,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    backgroundColor: 'transparent',
  },
  active: {
    width: 26,
    backgroundColor: theme.color.coral,
    borderColor: theme.color.coral,
  },
  done: {
    backgroundColor: theme.color.indigo,
    borderColor: theme.color.indigo,
  },
});
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/ProgressDots.tsx
git commit -m "feat(app): ProgressDots"
```

---

### Task 8: ScreenHeader

**Files:**
- Create: `app/components/ScreenHeader.tsx`

- [ ] **Step 1: Write `app/components/ScreenHeader.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface HeaderAction {
  icon: string;
  label: string;
  onPress: () => void;
}

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  actions?: HeaderAction[];
}

export function ScreenHeader({ title, onBack, actions = [] }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? <IconButton icon="←" accessibilityLabel="Go back" onPress={onBack} /> : null}
      </View>
      <Text variant={onBack ? 'heading' : 'title'} color="ink">
        {title}
      </Text>
      <View style={[styles.side, styles.sideEnd]}>
        {actions.map((action) => (
          <IconButton
            key={action.label}
            icon={action.icon}
            accessibilityLabel={action.label}
            onPress={action.onPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minWidth: 46,
  },
  sideEnd: { justifyContent: 'flex-end' },
});
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/ScreenHeader.tsx
git commit -m "feat(app): ScreenHeader"
```

---

### Task 9: TextField

**Files:**
- Create: `app/components/TextField.tsx`

- [ ] **Step 1: Write `app/components/TextField.tsx`**

```tsx
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

interface TextFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  accessibilityLabel?: string;
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  accessibilityLabel,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="meta" color="inkSoft">
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={theme.color.inkSoft}
        accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
        style={[
          styles.input,
          focused ? styles.focused : null,
          error ? styles.errored : null,
        ]}
      />
      {error ? (
        <Text variant="meta" color="coral">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.xs, alignSelf: 'stretch' },
  input: {
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontFamily: theme.fontFamily.body,
    fontSize: 16,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
  },
  focused: {
    borderColor: theme.color.indigo,
  },
  errored: {
    borderColor: theme.color.coral,
  },
});
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/TextField.tsx
git commit -m "feat(app): TextField"
```

---

### Task 10: Avatar

**Files:**
- Create: `app/components/Avatar.tsx`

> v1 renders an emoji placeholder per `avatarKey` on a tinted clay square. Real avatar art lands with onboarding.

- [ ] **Step 1: Write `app/components/Avatar.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

type Size = 'sm' | 'md' | 'lg';

interface AvatarProps {
  avatarKey: string;
  size?: Size;
}

// Placeholder mapping until the real illustrated avatar set ships.
const FACES: Record<string, { glyph: string; tint: string }> = {
  'avatar-fox': { glyph: '🦊', tint: theme.color.rose },
  'avatar-owl': { glyph: '🦉', tint: theme.color.teal },
  'avatar-bee': { glyph: '🐝', tint: theme.color.mustard },
  'avatar-cat': { glyph: '🐈', tint: theme.color.peach },
};

const DIM: Record<Size, number> = { sm: 36, md: 48, lg: 72 };

export function Avatar({ avatarKey, size = 'md' }: AvatarProps) {
  const face = FACES[avatarKey] ?? { glyph: '🙂', tint: theme.color.surface };
  const dim = DIM[size];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Avatar ${avatarKey}`}
      style={[styles.box, { width: dim, height: dim, backgroundColor: face.tint }]}
    >
      <Text variant={size === 'lg' ? 'display' : 'heading'} color="ink">
        {face.glyph}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/Avatar.tsx
git commit -m "feat(app): Avatar (placeholder set)"
```

---

### Task 11: Barrel, fonts in layout, landing, gallery route

**Files:**
- Create: `app/components/index.ts`, `app/app/gallery.tsx`
- Modify: `app/app/_layout.tsx`, `app/app/index.tsx`

- [ ] **Step 1: Write `app/components/index.ts`**

```ts
export { Avatar } from './Avatar';
export { ClayButton } from './ClayButton';
export { ClayCard } from './ClayCard';
export { IconButton } from './IconButton';
export { Pill } from './Pill';
export { ProgressDots } from './ProgressDots';
export { ScreenHeader } from './ScreenHeader';
export { SegmentedToggle } from './SegmentedToggle';
export { Text } from './Text';
export { TextField } from './TextField';
```

- [ ] **Step 2: Rewrite `app/app/_layout.tsx` to load fonts behind a splash gate**

```tsx
import {
  Fraunces_600SemiBold,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_900Black,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Rewrite `app/app/index.tsx` as a kit-powered landing**

```tsx
import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ClayButton, ClayCard, Text } from '../components';
import { theme } from '../theme';

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <ClayCard surface="cream">
          <Text variant="meta" color="inkSoft">
            Curio · design system
          </Text>
          <Text variant="display" color="ink" style={styles.title}>
            Geometric Clay
          </Text>
          <Text variant="body" color="inkSoft" style={styles.deck}>
            The component foundation every Curio screen is built from.
          </Text>
          <ClayButton
            label="Open the gallery →"
            variant="coral"
            onPress={() => router.push('/gallery')}
          />
        </ClayCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  body: { flex: 1, justifyContent: 'center', padding: theme.space.lg },
  title: { marginTop: theme.space.xs },
  deck: { marginTop: theme.space.sm, marginBottom: theme.space.lg },
});
```

> Note: navigation goes through `useRouter().push('/gallery')` rather than `<Link asChild>`, because `ClayButton` doesn't forward arbitrary props to its inner `Pressable`, so `asChild` wouldn't wire the press.

- [ ] **Step 4: Write `app/app/gallery.tsx`** (the showcase)

```tsx
import type { ReactNode } from 'react';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  ClayButton,
  ClayCard,
  IconButton,
  Pill,
  ProgressDots,
  ScreenHeader,
  SegmentedToggle,
  Text,
  TextField,
} from '../components';
import { theme } from '../theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="meta" color="inkSoft">
        {title}
      </Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

export default function Gallery() {
  const [name, setName] = useState('');
  const [depth, setDepth] = useState('Quick');
  const [interest, setInterest] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="Gallery" />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Type">
          <View>
            <Text variant="display">Display</Text>
            <Text variant="title">Title</Text>
            <Text variant="heading">Heading</Text>
            <Text variant="body">Body — 16px Manrope at 1.5 line-height.</Text>
            <Text variant="bodyStrong">Body strong</Text>
            <Text variant="meta" color="inkSoft">
              Meta label
            </Text>
          </View>
        </Section>

        <Section title="ClayButton">
          <ClayButton label="Explore today" variant="coral" icon="→" onPress={() => {}} />
          <ClayButton label="Deep dive" variant="indigo" onPress={() => {}} />
          <ClayButton label="Save" variant="ghost" icon="♡" iconPosition="leading" onPress={() => {}} />
          <ClayButton label="Disabled" variant="indigo" disabled onPress={() => {}} />
        </Section>

        <Section title="IconButton">
          <IconButton icon="←" accessibilityLabel="Back" onPress={() => {}} />
          <IconButton icon="♡" accessibilityLabel="Save" onPress={() => {}} />
          <IconButton icon="★" accessibilityLabel="Favorite" onPress={() => {}} />
          <IconButton icon="📚" accessibilityLabel="History" onPress={() => {}} />
          <IconButton icon="👤" accessibilityLabel="Profile" onPress={() => {}} />
        </Section>

        <Section title="ClayCard">
          <ClayCard surface="cream" onPress={() => {}} accessibilityLabel="Sample topic">
            <Text variant="meta" color="inkSoft">
              Earth & Sky
            </Text>
            <Text variant="title">The Northern Lights</Text>
          </ClayCard>
        </Section>

        <Section title="Pill">
          <Pill label="Earth & Sky" tint={theme.categoryColor.teal} />
          <Pill label="Biology" selected={interest} onPress={() => setInterest((v) => !v)} />
          <Pill label="Saved" />
        </Section>

        <Section title="SegmentedToggle">
          <SegmentedToggle options={['Quick', 'Deep']} value={depth} onChange={setDepth} />
        </Section>

        <Section title="ProgressDots">
          <ProgressDots count={5} index={1} />
          <ProgressDots count={9} index={3} />
        </Section>

        <Section title="TextField">
          <TextField label="Your name" value={name} onChangeText={setName} placeholder="Vera" />
        </Section>

        <Section title="Avatar">
          <Avatar avatarKey="avatar-fox" />
          <Avatar avatarKey="avatar-owl" />
          <Avatar avatarKey="avatar-bee" size="lg" />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  content: { padding: theme.space.lg, gap: theme.space.xl },
  section: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space.sm },
});
```

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm --filter @curio/app typecheck && pnpm lint
```

Expected: both exit 0. (If lint flags formatting, run `pnpm lint:fix` and re-check.)

- [ ] **Step 6: Commit**

```bash
git add app/components/index.ts app/app/_layout.tsx app/app/index.tsx app/app/gallery.tsx
git commit -m "feat(app): font loading, kit landing, and component gallery route"
```

---

### Task 12: Verification run + accessibility pass + PR

> Verification-by-running. This is the smoke test for every component.

- [ ] **Step 1: Run the theme tests once more**

```bash
pnpm --filter @curio/app test
```

Expected: PASS — 8 tests.

- [ ] **Step 2: Boot the app on web**

```bash
pnpm --filter @curio/app start
```

Press `w`. In the browser:
- Landing renders the "Geometric Clay" card with Fraunces display + coral CTA.
- Click "Open the gallery →" → `/gallery` renders.
- Confirm each section renders: type scale, both buttons + ghost + disabled, icon buttons, a pressable card, pills (toggle "Biology"), the Quick/Deep toggle, both progress rows, the name field (focus turns the border indigo), and three avatars.

- [ ] **Step 3: Boot on a simulator (press behaviour + haptics)**

With Expo still running, press `i` (iOS) or `a` (Android). Confirm:
- Pressing a button/card nudges it down ~2px and springs back.
- On a physical iOS device a light haptic fires on press-in (simulators don't vibrate — visual nudge is enough there).

- [ ] **Step 4: Accessibility pass**

- Enable Reduce Motion (simulator: Settings → Accessibility → Motion). Re-press buttons — the nudge becomes a quick linear move, no spring overshoot.
- Turn on VoiceOver/TalkBack briefly on the gallery: buttons announce their labels, the toggle announces selection, progress dots announce "n of m". Reading order follows visual order.

Stop Expo with Ctrl-C.

- [ ] **Step 5: Final monorepo check**

```bash
cd /Users/vera/Documents/Curio
pnpm lint && pnpm typecheck && pnpm test
```

Expected: all green (shared 20, api 2, authoring 3, app 8 theme tests).

- [ ] **Step 6: Push and open PR**

```bash
git push -u origin feat/foundation-kit
gh pr create \
  --title "Foundation kit: Geometric Clay theme + component library + gallery" \
  --body "$(cat <<'EOF'
## Summary
- Typed Geometric Clay theme (palette, type scale, spacing, radii, shadow, motion), unit-tested for contrast/scale/completeness
- Fonts: Fraunces / Manrope / JetBrains Mono, loaded behind a splash gate
- 10 components: Text, ClayCard, ClayButton, IconButton, Pill, SegmentedToggle, ProgressDots, ScreenHeader, TextField, Avatar
- Reanimated press-nudge + haptics, reduced-motion aware
- Dev `/gallery` route showcasing every component in every state

## Test plan
- [ ] `pnpm --filter @curio/app test` — theme tests green
- [ ] `pnpm lint && pnpm typecheck && pnpm test` — monorepo green
- [ ] Gallery renders all components on web + simulator; press nudge fires; reduced-motion + VoiceOver pass

## Spec
docs/superpowers/specs/2026-06-03-foundation-kit-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 7: Watch CI**

```bash
gh pr checks --watch
```

Expected: `verify` job green (it runs lint + typecheck + test; the app's theme tests now run under `pnpm test`). If it fails, fix on the branch and push again.

- [ ] **Step 8: Stop — hand back for human review and merge.**

---

## Self-review checklist (run before handoff)

| Spec section | Plan task |
|---|---|
| §3 Typed theme + StyleSheet | Tasks 2–10 |
| §3 Fonts via expo-google-fonts + splash gate | Task 11 |
| §3 Reanimated + haptics, reduced-motion (Moti deferred to first screen plan) | Tasks 1, 3 |
| §4 Theme module + token tests (contrast/scale/completeness) | Task 2 |
| §5 All 10 components | Tasks 3–10 |
| §6 Routes (_layout fonts, landing, gallery) | Task 11 |
| §7 Dependencies | Task 1 |
| §8 Verification (tests, gallery run, a11y) | Task 12 |

**Out of scope (later plans):** real screens, navigation beyond gallery, AnswerChoice/SceneFrame/TopicGridCell, data/state/storage.

## Done when
- PR `feat/foundation-kit` is open, CI green, and a human has reviewed and merged.
