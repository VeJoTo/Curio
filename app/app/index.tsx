import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text, TopicHeroCard } from '../components';
import type { Depth } from '../components/TopicHeroCard';
import { todayTopic } from '../data/topics';
import { Reveal } from '../motion';
import { getProfile } from '../storage/profile';
import { theme } from '../theme';

type GateState = 'loading' | 'onboard' | 'ready';

export default function Today() {
  const router = useRouter();
  const topic = todayTopic();
  const [gate, setGate] = useState<GateState>('loading');

  useEffect(() => {
    let mounted = true;
    getProfile().then((profile) => {
      if (mounted) {
        setGate(profile ? 'ready' : 'onboard');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (gate === 'loading') {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.color.indigo} />
      </SafeAreaView>
    );
  }
  if (gate === 'onboard') {
    return <Redirect href="/onboarding" />;
  }

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
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
  },
  body: { padding: theme.space.lg, justifyContent: 'center', flexGrow: 1 },
});
