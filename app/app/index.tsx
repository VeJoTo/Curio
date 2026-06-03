import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text, TopicHeroCard } from '../components';
import type { Depth } from '../components/TopicHeroCard';
import { todayTopic } from '../data/topics';
import { Reveal } from '../motion';
import { theme } from '../theme';

export default function Today() {
  const router = useRouter();
  const topic = todayTopic();

  const onExplore = (depth: Depth) => {
    router.push({ pathname: '/topic/[slug]', params: { slug: topic.slug, depth } });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text variant="meta" color="inkSoft">
          Today
        </Text>
        <IconButton icon="👤" accessibilityLabel="Profile" onPress={() => {}} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal>
          <TopicHeroCard topic={topic} onExplore={onExplore} />
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
  },
  body: { padding: theme.space.lg, justifyContent: 'center', flexGrow: 1 },
});
