import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

interface TextFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  accessibilityLabel?: string;
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  accessibilityLabel,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="meta" color="inkSoft">
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={theme.color.inkSoft}
        accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
        style={[styles.input, focused ? styles.focused : null, error ? styles.errored : null]}
      />
      {error ? (
        <Text variant="meta" color="coral">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.xs, alignSelf: 'stretch' },
  input: {
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontFamily: theme.fontFamily.body,
    fontSize: 16,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
  },
  focused: {
    borderColor: theme.color.indigo,
  },
  errored: {
    borderColor: theme.color.coral,
  },
});
