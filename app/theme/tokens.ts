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
export const shadow = {
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
} as const;

export const motion = {
  durEnter: 220,
  durExit: 150,
  spring: { damping: 14, stiffness: 180, mass: 1 },
  stagger: 40,
  reducedDur: 120,
} as const;
