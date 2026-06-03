import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { reducedTiming, springs } from './config';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function Reveal({ children, delay = 0, style }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <MotiView
      style={style}
      from={reduced ? { opacity: 0 } : { opacity: 0, translateY: 12, scale: 0.96 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, translateY: 0, scale: 1 }}
      transition={{ ...(reduced ? reducedTiming : springs.bouncy), delay }}
    >
      {children}
    </MotiView>
  );
}
