import { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Counts 0 → target over ~durationMs. Reduced motion jumps straight to target.
export function useCountUp(target: number, durationMs = 700): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced || target <= 0) {
      setValue(target);
      return;
    }
    setValue(0);
    const stepMs = Math.max(40, Math.round(durationMs / target));
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setValue(current);
      if (current >= target) {
        clearInterval(id);
      }
    }, stepMs);
    return () => clearInterval(id);
  }, [target, durationMs, reduced]);

  return value;
}
