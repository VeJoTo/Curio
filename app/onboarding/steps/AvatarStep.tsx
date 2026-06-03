import { Pressable, StyleSheet, View } from 'react-native';
import { AVATAR_KEYS, AVATAR_NAMES, Avatar, ClayButton, Text } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function AvatarStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        Pick a face
      </Text>
      <View style={styles.grid}>
        {AVATAR_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => patch({ avatarKey: key })}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Choose ${AVATAR_NAMES[key] ?? key}`}
            accessibilityState={{ selected: draft.avatarKey === key }}
            style={[styles.cell, draft.avatarKey === key ? styles.selected : null]}
          >
            <Avatar avatarKey={key} size="lg" />
          </Pressable>
        ))}
      </View>
      <ClayButton
        label="Next →"
        variant="coral"
        disabled={!draft.avatarKey}
        onPress={next}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, justifyContent: 'center' },
  cell: { borderRadius: theme.radius.md, padding: 4 },
  selected: { borderWidth: 2, borderColor: theme.color.indigo },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
