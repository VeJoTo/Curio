import { StyleSheet, View } from 'react-native';
import { ClayButton, Text, TimePicker } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function TimeStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        When should we nudge you?
      </Text>
      <TimePicker value={draft.dailyTime} onChange={(t) => patch({ dailyTime: t })} />
      <ClayButton
        label="Next →"
        variant="coral"
        disabled={!draft.dailyTime}
        onPress={next}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
