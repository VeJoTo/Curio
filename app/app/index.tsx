import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ClayButton, ClayCard, Text } from '../components';
import { theme } from '../theme';

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <ClayCard surface="cream">
          <Text variant="meta" color="inkSoft">
            Curio · design system
          </Text>
          <Text variant="display" color="ink" style={styles.title}>
            Geometric Clay
          </Text>
          <Text variant="body" color="inkSoft" style={styles.deck}>
            The component foundation every Curio screen is built from.
          </Text>
          <ClayButton
            label="Open the gallery →"
            variant="coral"
            onPress={() => router.push('/gallery')}
          />
        </ClayCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  body: { flex: 1, justifyContent: 'center', padding: theme.space.lg },
  title: { marginTop: theme.space.xs },
  deck: { marginTop: theme.space.sm, marginBottom: theme.space.lg },
});
