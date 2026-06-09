import { SafeAreaView, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { Text } from './Text';

interface ErrorFallbackProps {
  onRetry: () => void;
  onGoHome: () => void;
}

export function ErrorFallback({ onRetry, onGoHome }: ErrorFallbackProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text variant="title" accessibilityRole="header" style={styles.centered}>
          Something went wrong
        </Text>
        <Text
          variant="body"
          color="inkSoft"
          accessibilityLiveRegion="polite"
          style={styles.centered}
        >
          The app hit an unexpected snag. You can try again or head back to today.
        </Text>
        <View style={styles.actions}>
          <ClayButton label="Try again" variant="coral" onPress={onRetry} />
          <ClayButton label="Back to today" variant="ghost" onPress={onGoHome} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  centered: { textAlign: 'center' },
  actions: { gap: theme.space.sm, alignItems: 'center', marginTop: theme.space.sm },
});
