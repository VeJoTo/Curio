import { View } from 'react-native';
import { ClayButton, Text } from '../../components';
import type { StepProps } from '../types';

export function NotificationsStep({ next }: StepProps) {
  return (
    <View style={{ gap: 16 }}>
      <Text variant="title">Notifications</Text>
      <ClayButton label="Next →" variant="coral" onPress={next} />
    </View>
  );
}
