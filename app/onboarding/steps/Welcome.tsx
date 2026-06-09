import { Image, StyleSheet, View } from 'react-native';
import { ClayButton, Text } from '../../components';
import { Pulse } from '../../motion';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function Welcome({ next }: StepProps) {
  return (
    <View style={styles.wrap}>
      <Image
        source={require('../../assets/curio-wordmark.png')}
        accessibilityLabel="Curio"
        resizeMode="contain"
        style={styles.logo}
      />
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
  logo: { width: 188, height: 81 },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
