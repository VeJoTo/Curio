import { View } from 'react-native';
import { ClayButton, Text } from '../../components';
import type { StepProps } from '../types';

export function DoneStep({ finish }: StepProps) {
  return (
    <View style={{ gap: 16 }}>
      <Text variant="title">You're set</Text>
      <ClayButton label="Finish" variant="coral" onPress={finish} />
    </View>
  );
}
