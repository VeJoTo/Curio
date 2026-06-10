import { SafeAreaView, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { Text } from './Text';

interface NotFoundProps {
  onGoHome: () => void;
  title?: string;
  message?: string;
}

export function NotFound({
  onGoHome,
  title = 'Nothing here',
  message = "We couldn't find what you were looking for. Let's head back to today's topic.",
}: NotFoundProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text variant="title" accessibilityRole="header" style={styles.centered}>
          {title}
        </Text>
        <Text variant="body" color="inkSoft" style={styles.centered}>
          {message}
        </Text>
        <View style={styles.actions}>
          <ClayButton label="Back to today" variant="coral" onPress={onGoHome} />
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
