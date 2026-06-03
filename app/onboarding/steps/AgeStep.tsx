import { View } from 'react-native';
import { ClayButton, Text } from '../../components';
import type { StepProps } from '../types';

export function AgeStep({ next }: StepProps) {
  return (
    <View style={{ gap: 16 }}>
      <Text variant="title">Age</Text>
      <ClayButton label="Next →" variant="coral" onPress={next} />
    </View>
  );
}
