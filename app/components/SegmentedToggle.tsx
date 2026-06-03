import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

interface SegmentedToggleProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedToggle({ options, value, onChange }: SegmentedToggleProps) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active ? styles.segmentActive : null]}
          >
            <Text variant="bodyStrong" color={active ? 'surface' : 'ink'}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  segment: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: theme.color.indigo,
  },
});
