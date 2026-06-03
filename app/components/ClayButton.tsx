import { Platform, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressNudge } from '../hooks/usePressNudge';
import { theme } from '../theme';
import { Text } from './Text';

type Variant = 'coral' | 'indigo' | 'ghost';

interface ClayButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'leading' | 'trailing';
  style?: StyleProp<ViewStyle>;
}

const fill: Record<Variant, string> = {
  coral: theme.color.coral,
  indigo: theme.color.indigo,
  ghost: theme.color.surface,
};

export function ClayButton({
  label,
  onPress,
  variant = 'indigo',
  disabled = false,
  icon,
  iconPosition = 'trailing',
  style,
}: ClayButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressNudge();
  const textColor = variant === 'ghost' ? 'ink' : 'surface';
  const iconNode = icon ? (
    <Text variant="bodyStrong" color={textColor}>
      {icon}
    </Text>
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: fill[variant], opacity: disabled ? 0.4 : 1 },
          style,
          disabled ? null : animatedStyle,
        ]}
      >
        {icon && iconPosition === 'leading' ? iconNode : null}
        <Text variant="bodyStrong" color={textColor}>
          {label}
        </Text>
        {icon && iconPosition === 'trailing' ? iconNode : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    alignSelf: 'flex-start',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 22,
    minHeight: 44,
    ...Platform.select(theme.shadow.clay),
  },
});
