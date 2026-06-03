import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function Pulse({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <>{children}</>;
  }
  return (
    <MotiView
      from={{ scale: 1 }}
      animate={{ scale: 1.04 }}
      transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
    >
      {children}
    </MotiView>
  );
}
