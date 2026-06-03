import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressNudge } from '../hooks/usePressNudge';
import { theme } from '../theme';

interface ClayCardProps {
  children: ReactNode;
  onPress?: () => void;
  surface?: 'cream' | 'surface' | 'peach';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ClayCard({
  children,
  onPress,
  surface = 'surface',
  style,
  accessibilityLabel,
}: ClayCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressNudge();
  const base = [styles.card, { backgroundColor: theme.color[surface] }, style];

  if (!onPress) {
    return <View style={base}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[base, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    ...Platform.select(theme.shadow.clay),
  },
});
