import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

type Size = 'sm' | 'md' | 'lg';

interface AvatarProps {
  avatarKey: string;
  size?: Size;
}

// Placeholder mapping until the real illustrated avatar set ships.
const FACES: Record<string, { glyph: string; tint: string }> = {
  'avatar-fox': { glyph: '🦊', tint: theme.color.rose },
  'avatar-owl': { glyph: '🦉', tint: theme.color.teal },
  'avatar-bee': { glyph: '🐝', tint: theme.color.mustard },
  'avatar-cat': { glyph: '🐈', tint: theme.color.peach },
};

const DIM: Record<Size, number> = { sm: 36, md: 48, lg: 72 };

export function Avatar({ avatarKey, size = 'md' }: AvatarProps) {
  const face = FACES[avatarKey] ?? { glyph: '🙂', tint: theme.color.surface };
  const dim = DIM[size];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Avatar ${avatarKey}`}
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
