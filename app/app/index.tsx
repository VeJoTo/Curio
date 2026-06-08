import type { Profile } from '@curio/shared';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Avatar, Text, TopicHeroCard } from '../components';
import type { Depth } from '../components/TopicHeroCard';
import { todayTopic } from '../data/topics';
import { Reveal } from '../motion';
import { getProfile } from '../storage/profile';
import { theme } from '../theme';
import { greetingLine } from '../today/greeting';

type GateState = 'loading' | 'onboard' | 'ready';

export default function Today() {
  const router = useRouter();
  const [gate, setGate] = useState<GateState>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);

  // Re-read the profile every time the screen regains focus (e.g. returning from
  // the profile editor) so interest edits change today's topic without a reload.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProfile().then((p) => {
        if (active) {
          setProfile(p);
          setGate(p ? 'ready' : 'onboard');
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

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

  const topic = todayTopic(profile ?? undefined);

  const onExplore = (depth: Depth) => {
    router.push({ pathname: '/topic/[slug]', params: { slug: topic.slug, depth } });
  };

  const greeting = profile ? greetingLine(profile.name) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="meta" color="inkSoft">
            Today
          </Text>
          {greeting ? (
            <Text variant="title" color="ink">
              {greeting}
            </Text>
          ) : null}
        </View>
        {profile ? (
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <Avatar avatarKey={profile.avatarKey} size="sm" />
          </Pressable>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal>
          <TopicHeroCard topic={topic} onExplore={onExplore} initialDepth={profile?.defaultDepth} />
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  center: { alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
  },
  body: { padding: theme.space.lg, justifyContent: 'center', flexGrow: 1 },
});
