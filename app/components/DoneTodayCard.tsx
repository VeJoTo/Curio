import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { ClayCard } from './ClayCard';
import { Text } from './Text';

interface DoneTodayCardProps {
  streak: number;
  onReadAgain: () => void;
}

export function DoneTodayCard({ streak, onReadAgain }: DoneTodayCardProps) {
  const streakLine = streak <= 1 ? 'Day 1 — nice start' : `🔥 ${streak}-day streak`;
  return (
    <ClayCard surface="cream">
      <Text variant="meta" color="inkSoft" accessibilityLiveRegion="polite">
        {streakLine}
      </Text>
      <Text variant="display" color="ink" style={styles.title}>
        Done for today ✨
      </Text>
      <Text variant="body" color="inkSoft" style={styles.body}>
        Come back tomorrow for a fresh topic.
      </Text>
      <ClayButton label="Read it again" variant="ghost" onPress={onReadAgain} style={styles.cta} />
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: theme.space.sm },
  body: { marginTop: theme.space.xs },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
