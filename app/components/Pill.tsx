import { Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Background when unselected (e.g. a category color). Defaults to surface. */
  tint?: string;
}

export function Pill({ label, selected = false, onPress, tint }: PillProps) {
  const backgroundColor = selected ? theme.color.indigo : (tint ?? theme.color.surface);
  const textColor = selected ? 'surface' : 'ink';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={6}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      style={[styles.pill, { backgroundColor }]}
    >
      <Text variant="bodyStrong" color={textColor}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
});
