import type { TextStyle } from 'react-native';

// Font family keys match the faces loaded in app/app/_layout.tsx.
export const fontFamily = {
  display: 'Fraunces_900Black',
  displaySemi: 'Fraunces_600SemiBold',
  body: 'Manrope_400Regular',
  bodyBold: 'Manrope_700Bold',
  meta: 'JetBrainsMono_500Medium',
} as const;

export type TypeVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'meta';

// A required subset of TextStyle where fontSize and lineHeight are always present.
// This lets call-sites access .fontSize / .lineHeight without undefined checks.
export type TypeStyle = Omit<TextStyle, 'fontSize' | 'lineHeight'> & {
  fontSize: number;
  lineHeight: number;
};

export const typeScale: Record<TypeVariant, TypeStyle> = {
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
