import { StyleSheet, View } from 'react-native';
import { ClayButton, Pill, Text } from '../../components';
import { AGE_BANDS } from '../../data/ageBands';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function AgeStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        How old are you?
      </Text>
      <Text variant="body" color="inkSoft">
        Tunes how content is pitched.
      </Text>
      <View style={styles.row}>
        {AGE_BANDS.map((b) => (
          <Pill
            key={b.value}
            label={b.label}
            selected={draft.ageBand === b.value}
            onPress={() => patch({ ageBand: b.value })}
          />
        ))}
      </View>
      <ClayButton
        label="Next →"
        variant="coral"
        disabled={!draft.ageBand}
        onPress={next}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
