import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

type Size = 'sm' | 'md' | 'lg';

interface AvatarProps {
  avatarKey: string;
  size?: Size;
}

// Placeholder mapping until the real illustrated avatar set ships.
const FACES: Record<string, { glyph: string; tint: string; name: string }> = {
  'avatar-fox': { glyph: '🦊', tint: theme.color.rose, name: 'Fox' },
  'avatar-owl': { glyph: '🦉', tint: theme.color.teal, name: 'Owl' },
  'avatar-bee': { glyph: '🐝', tint: theme.color.mustard, name: 'Bee' },
  'avatar-cat': { glyph: '🐈', tint: theme.color.peach, name: 'Cat' },
  'avatar-frog': { glyph: '🐸', tint: theme.color.teal, name: 'Frog' },
  'avatar-butterfly': { glyph: '🦋', tint: theme.color.rose, name: 'Butterfly' },
};

// Ordered list of selectable avatar keys (for the onboarding picker).
export const AVATAR_KEYS = Object.keys(FACES);

const DIM: Record<Size, number> = { sm: 36, md: 48, lg: 72 };

export function Avatar({ avatarKey, size = 'md' }: AvatarProps) {
  const face = FACES[avatarKey] ?? { glyph: '🙂', tint: theme.color.surface, name: 'Placeholder' };
  const dim = DIM[size];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${face.name} avatar`}
      style={[styles.box, { width: dim, height: dim, backgroundColor: face.tint }]}
    >
      <Text variant={size === 'lg' ? 'display' : 'heading'} color="ink">
        {face.glyph}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
