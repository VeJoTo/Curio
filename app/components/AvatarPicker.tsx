import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { AVATAR_KEYS, AVATAR_NAMES, Avatar } from './Avatar';

interface AvatarPickerProps {
  value?: string;
  onChange: (key: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <View style={styles.grid}>
      {AVATAR_KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Choose ${AVATAR_NAMES[key] ?? key}`}
          accessibilityState={{ selected: value === key }}
          style={[styles.cell, value === key ? styles.selected : null]}
        >
          <Avatar avatarKey={key} size="lg" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, justifyContent: 'center' },
  cell: { borderRadius: theme.radius.md, padding: 4 },
  selected: { borderWidth: 2, borderColor: theme.color.indigo },
});
