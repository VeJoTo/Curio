import { MotiView } from 'moti';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { theme } from '../theme';

const PIECES = [
  { x: -36, y: -28, color: theme.color.coral },
  { x: 32, y: -32, color: theme.color.teal },
  { x: -30, y: 26, color: theme.color.mustard },
  { x: 34, y: 24, color: theme.color.indigo },
  { x: 0, y: -42, color: theme.color.rose },
];

export function Burst({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  if (reduced || !active) {
    return null;
  }
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {PIECES.map((p) => (
        <MotiView
          key={`${p.x}:${p.y}`}
          style={[styles.piece, { backgroundColor: p.color }]}
          from={{ opacity: 0, translateX: 0, translateY: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 0],
            translateX: [0, p.x, p.x * 1.3],
            translateY: [0, p.y, p.y * 1.3],
            scale: [0.4, 1, 0.8],
          }}
          transition={{ type: 'timing', duration: 900, delay: 80 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  piece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: theme.color.ink,
  },
});
