import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

type MatchMedia = (query: string) => { matches: boolean };

// `null` = not yet known. On web the OS setting is readable synchronously via
// matchMedia, so we start with the real value and avoid a first-frame flash.
// Native only has an async API, so we start unknown and let consumers treat
// `null` as "reduce motion" until it resolves — e.g. the hero GIF mounts only
// once we positively know motion is allowed (`reduced === false`).
export function initialReducedMotion(
  os: typeof Platform.OS = Platform.OS,
  matchMedia: MatchMedia | undefined = typeof window !== 'undefined'
    ? (window.matchMedia as MatchMedia | undefined)
    : undefined,
): boolean | null {
  if (os === 'web' && matchMedia) {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return null;
}

export function useReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(initialReducedMotion);

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
