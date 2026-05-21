import { Text, View } from 'react-native';
import { TopicSchema } from '@curio/shared';

export default function Index() {
  // Smoke check: shared schemas import correctly from the app workspace.
  const verify = typeof TopicSchema.parse === 'function' ? 'ok' : 'broken';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBF6EA' }}>
      <Text style={{ fontSize: 32, color: '#2C1B3C', fontWeight: '700' }}>Curio</Text>
      <Text style={{ marginTop: 8, color: '#5B4A6D' }}>shared schemas: {verify}</Text>
    </View>
  );
}
