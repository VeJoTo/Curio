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
