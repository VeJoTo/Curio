import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { theme } from '../theme';
import type { ColorRole, TypeVariant } from '../theme';

interface TextProps {
  variant?: TypeVariant;
  color?: ColorRole;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  children: ReactNode;
}

export function Text({
  variant = 'body',
  color = 'ink',
  style,
  numberOfLines,
  children,
}: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[theme.type[variant], { color: theme.color[color] }, style]}
    >
      {children}
    </RNText>
  );
}
