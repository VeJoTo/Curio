import { StyleSheet, View } from 'react-native';
import { ClayButton, SegmentedToggle, Text } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function DepthStep({ draft, patch, next }: StepProps) {
  const value = draft.defaultDepth === 'deep' ? 'Deep' : 'Quick';
  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        Quick or deep?
      </Text>
      <Text variant="body" color="inkSoft">
        Your default each day — you can switch any time.
      </Text>
      <SegmentedToggle
        accessibilityLabel="Default reading depth"
        options={['Quick', 'Deep']}
        value={value}
        onChange={(v) => patch({ defaultDepth: v === 'Deep' ? 'deep' : 'quick' })}
      />
      <ClayButton
        label="Next →"
        variant="coral"
        onPress={() => {
          if (!draft.defaultDepth) {
            patch({ defaultDepth: 'quick' });
          }
          next();
        }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
