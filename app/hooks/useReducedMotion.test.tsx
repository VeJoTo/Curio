import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialReducedMotion, useReducedMotion } from './useReducedMotion';

describe('initialReducedMotion', () => {
  it('reads the synchronous matchMedia value on web (no flash)', () => {
    expect(initialReducedMotion('web', () => ({ matches: true }))).toBe(true);
    expect(initialReducedMotion('web', () => ({ matches: false }))).toBe(false);
  });

  it('is null (not yet known) on native, where only an async API exists', () => {
    expect(initialReducedMotion('ios', () => ({ matches: true }))).toBeNull();
    expect(initialReducedMotion('android', undefined)).toBeNull();
  });

  it('is null on web when matchMedia is unavailable', () => {
    const saved = window.matchMedia;
    // Simulate an environment without matchMedia so the default arg resolves
    // to undefined.
    (window as { matchMedia?: typeof window.matchMedia }).matchMedia = undefined;
    try {
      expect(initialReducedMotion('web')).toBeNull();
    } finally {
      window.matchMedia = saved;
    }
  });
});

describe('useReducedMotion', () => {
  const realMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = realMatchMedia;
    vi.restoreAllMocks();
  });

  it('starts at the synchronous web value rather than a default of false', () => {
    // jsdom runs as Platform.OS === 'web'; report reduced motion ON.
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());
    // No flash: the very first value already reflects the OS setting.
    expect(result.current).toBe(true);
  });
});
