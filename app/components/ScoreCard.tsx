import { StyleSheet, View } from 'react-native';
import { Burst, useCountUp } from '../motion';
import { theme } from '../theme';
import { Avatar } from './Avatar';
import { Text } from './Text';

interface ScoreCardProps {
  score: number;
  total: number;
  avatarKey: string;
}

function message(score: number, total: number): string {
  if (total > 0 && score === total) {
    return 'Top marks! 🌟';
  }
  if (score / total >= 2 / 3) {
    return "Nice — you've got the gist! ✨";
  }
  return 'Worth another look ↺';
}

export function ScoreCard({ score, total, avatarKey }: ScoreCardProps) {
  const shown = useCountUp(score);
  const perfect = total > 0 && score === total;

  return (
    <View style={styles.card}>
      <Burst active={perfect} />
      <View style={styles.avatar}>
        <Avatar avatarKey={avatarKey} size="lg" />
      </View>
      <Text
        variant="display"
        color="ink"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`You scored ${score} out of ${total}. ${message(score, total)}`}
      >
        {shown} / {total}
      </Text>
      <Text variant="bodyStrong" color="ink" style={styles.msg}>
        {message(score, total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    padding: theme.space.lg,
    alignItems: 'center',
  },
  avatar: { marginBottom: theme.space.sm },
  msg: { marginTop: theme.space.xs },
});
