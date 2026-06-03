import { StyleSheet, View } from 'react-native';
import { Pill, Text } from '../../components';
import { theme } from '../../theme';
import type { AgeBand, StepProps } from '../types';

const BANDS: { value: AgeBand; label: string }[] = [
  { value: 'under-13', label: 'Under 13' },
  { value: '13-17', label: '13–17' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+', label: '55+' },
];

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
        {BANDS.map((b) => (
          <Pill
            key={b.value}
            label={b.label}
            selected={draft.ageBand === b.value}
            onPress={() => {
              patch({ ageBand: b.value });
              next();
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: theme.space.sm },
});
