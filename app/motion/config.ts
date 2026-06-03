// Moti spring transitions. Lower damping = more bounce (indie-game juice).
export const springs = {
  default: { type: 'spring', damping: 14, stiffness: 180, mass: 1 },
  bouncy: { type: 'spring', damping: 10, stiffness: 170, mass: 0.9 },
  soft: { type: 'spring', damping: 18, stiffness: 200, mass: 1 },
} as const;

// Reduced-motion fallback: quick, flat, no overshoot.
export const reducedTiming = { type: 'timing', duration: 120 } as const;
