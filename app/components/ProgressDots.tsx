import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';

interface ProgressDotsProps {
  count: number;
  index: number;
}

export function ProgressDots({ count, index }: ProgressDotsProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: count, now: index + 1 }}
    >
      {Array.from({ length: count }, (_, i) => {
        const active = i === index;
        const done = i < index;
        return (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional and never reorder
            key={i}
            style={[styles.dot, active ? styles.active : null, done ? styles.done : null]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    backgroundColor: 'transparent',
  },
  active: {
    width: 26,
    backgroundColor: theme.color.coral,
    borderColor: theme.color.coral,
  },
  done: {
    backgroundColor: theme.color.indigo,
    borderColor: theme.color.indigo,
  },
});
