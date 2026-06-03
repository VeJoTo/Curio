import { StyleSheet, View } from 'react-native';
import { AvatarPicker, ClayButton, Text } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function AvatarStep({ draft, patch, next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        Pick a face
      </Text>
      <AvatarPicker value={draft.avatarKey} onChange={(key) => patch({ avatarKey: key })} />
      <ClayButton
        label="Next →"
        variant="coral"
        disabled={!draft.avatarKey}
        onPress={next}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.md },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
