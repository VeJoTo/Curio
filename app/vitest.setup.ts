import { vi } from 'vitest';

// Components pull in react-native-reanimated via ClayButton/usePressNudge.
// Mock the bits they use so they render under jsdom without the native runtime.
vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  const RNW = (await import('react-native-web')) as any;
  const View = RNW.View ?? RNW.default?.View;
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
