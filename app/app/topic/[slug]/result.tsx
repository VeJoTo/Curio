import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ClayButton, ScoreCard, Text, TextField } from '../../../components';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { Reveal } from '../../../motion';
import { getDay, recordDay } from '../../../storage/journal';
import { getProfile } from '../../../storage/profile';
import { theme } from '../../../theme';
import { dayKey } from '../../../today/selectTopic';

export default function Result() {
  const router = useRouter();
  const { slug, depth, score, total } = useLocalSearchParams<{
    slug: string;
    depth?: string;
    score?: string;
    total?: string;
  }>();
  const [reflection, setReflection] = useState('');
  const [avatarKey, setAvatarKey] = useState('avatar-fox');

  const [saveError, setSaveError] = useState(false);
  const [todayKey] = useState(() => dayKey(new Date()));

  useEffect(() => {
    let active = true;
    getProfile().then((p) => {
      if (active && p) {
        setAvatarKey(p.avatarKey);
      }
    });
    getDay(todayKey).then((existing) => {
      if (active && existing) {
        setReflection(existing.reflection);
      }
    });
    return () => {
      active = false;
    };
  }, [todayKey]);

  const scoreNum = Number(score ?? '0');
  const totalNum = Number(total ?? '0');

  const onDone = async () => {
    setSaveError(false);
    try {
      await recordDay({
        date: todayKey,
        slug: slug ?? '',
        score: scoreNum,
        total: totalNum,
        reflection,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('record day failed', err);
      setSaveError(true);
      return;
    }
    router.dismissAll();
  };
  const done = useAsyncAction(onDone);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Reveal>
          <ScoreCard score={scoreNum} total={totalNum} avatarKey={avatarKey} />
        </Reveal>

        <Reveal delay={120} style={styles.reflectWrap}>
          <Text variant="meta" color="inkSoft" style={styles.tag}>
            Reflect
          </Text>
          <Text variant="title" color="ink" style={styles.prompt}>
            What's one thing that surprised you?
          </Text>
          <TextField
            value={reflection}
            onChangeText={setReflection}
            placeholder="It's not actually reflected light…"
            accessibilityLabel="Your reflection"
          />
        </Reveal>

        <Reveal delay={200} style={styles.actions}>
          {saveError ? (
            <View accessibilityLiveRegion="polite" style={styles.error}>
              <Text variant="meta" color="coral">
                Couldn't save your reflection. Please try again.
              </Text>
            </View>
          ) : null}
          <ClayButton
            label="Done for today ✓"
            variant="coral"
            loading={done.pending}
            onPress={done.run}
            style={styles.cta}
          />
          <ClayButton
            label="↺ Read it again"
            variant="ghost"
            onPress={() =>
              router.replace({
                pathname: '/topic/[slug]',
                params: { slug: slug ?? '', depth: depth ?? 'quick' },
              })
            }
            style={styles.cta}
          />
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  body: { flex: 1, padding: theme.space.lg, justifyContent: 'center' },
  reflectWrap: { marginTop: theme.space.xl },
  tag: { marginBottom: theme.space.xs },
  prompt: { marginBottom: theme.space.sm },
  actions: { marginTop: theme.space.xl, gap: theme.space.sm },
  cta: { alignSelf: 'stretch' },
  error: { marginBottom: theme.space.sm, alignItems: 'center' },
});
