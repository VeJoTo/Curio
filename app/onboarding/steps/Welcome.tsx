import { StyleSheet, View } from 'react-native';
import { ClayButton, Text, Wordmark } from '../../components';
import { Pulse } from '../../motion';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function Welcome({ next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Wordmark width={188} />
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
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
