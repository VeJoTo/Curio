import { StyleSheet, View } from 'react-native';
import { ClayButton, Text } from '../../components';
import { Pulse } from '../../motion';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function Welcome({ next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="display" style={styles.hero}>
        🦉✨
      </Text>
      <Text variant="display" color="ink">
        Stay curious.
      </Text>
      <Text variant="body" color="inkSoft">
        One surprising thing a day. Two minutes, or a deep dive.
      </Text>
      <Pulse>
        <ClayButton label="Get started →" variant="coral" onPress={next} style={styles.cta} />
      </Pulse>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.md },
  hero: { fontSize: 56, lineHeight: 64 },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
