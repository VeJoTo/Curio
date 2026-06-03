import type { Topic } from '@curio/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pulse } from '../motion';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { ClayCard } from './ClayCard';
import { Pill } from './Pill';
import { SegmentedToggle } from './SegmentedToggle';
import { Text } from './Text';

export type Depth = 'quick' | 'deep';

interface TopicHeroCardProps {
  topic: Topic;
  onExplore: (depth: Depth) => void;
  initialDepth?: Depth;
}

export function TopicHeroCard({ topic, onExplore, initialDepth = 'quick' }: TopicHeroCardProps) {
  const [depth, setDepth] = useState<Depth>(initialDepth);

  const sceneCount = depth === 'quick' ? topic.scenesQuick.length : topic.scenesDeep.length;
  const questionCount = depth === 'quick' ? topic.quizQuick.length : topic.quizDeep.length;
  const minutes = depth === 'quick' ? '~2 min' : '~12 min';

  return (
    <ClayCard surface="cream">
      <Pill label="🌍 Earth & Sky" tint={theme.color.teal} />
      <Text variant="display" color="ink" style={styles.title}>
        {topic.title}
      </Text>
      <View style={styles.hero}>
        <Text variant="display">🌌</Text>
      </View>
      <Text variant="body" color="ink" style={styles.deck}>
        {topic.deck}
      </Text>
      <View style={styles.toggle}>
        <SegmentedToggle
          options={['Quick', 'Deep']}
          value={depth === 'quick' ? 'Quick' : 'Deep'}
          onChange={(v) => setDepth(v === 'Quick' ? 'quick' : 'deep')}
        />
      </View>
      <Text variant="meta" color="inkSoft" style={styles.hint}>
        {minutes} · {sceneCount} scenes · {questionCount} questions
      </Text>
      <Pulse>
        <ClayButton
          label="Explore today →"
          variant="coral"
          onPress={() => onExplore(depth)}
          style={styles.cta}
        />
      </Pulse>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: theme.space.sm },
  hero: {
    height: 150,
    marginTop: theme.space.sm,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deck: { marginTop: theme.space.md, marginBottom: theme.space.md },
  toggle: { marginBottom: theme.space.xs },
  hint: { marginBottom: theme.space.md },
  cta: { alignSelf: 'stretch' },
});
