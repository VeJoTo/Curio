import { StyleSheet, View } from 'react-native';
import { ClayButton, Text, TextField } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function NameStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        What should we call you?
      </Text>
      <TextField
        value={draft.name ?? ''}
        onChangeText={(name) => patch({ name })}
        placeholder="Your name"
        accessibilityLabel="Your name"
      />
      <ClayButton label="Next →" variant="coral" onPress={next} style={styles.cta} />
      <ClayButton
        label="Skip"
        variant="ghost"
        onPress={() => {
          patch({ name: undefined });
          next();
        }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.xs },
});
