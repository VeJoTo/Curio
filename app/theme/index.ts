import { borderWidth, categoryColor, color, motion, radius, shadow, space } from './tokens';
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
export type { TypeVariant } from './typography';
