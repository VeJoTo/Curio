import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressNudge } from '../hooks/usePressNudge';
import { theme } from '../theme';
import { Text } from './Text';

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
}: IconButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressNudge();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[styles.ib, { opacity: disabled ? 0.4 : 1 }, disabled ? null : animatedStyle]}
      >
        <Text variant="heading" color="ink">
          {icon}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ib: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select(theme.shadow.clay),
  },
});
