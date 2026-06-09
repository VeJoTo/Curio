import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ClayButton, ScoreCard, Text, TextField } from '../../../components';
import { Reveal } from '../../../motion';
import { getProfile } from '../../../storage/profile';
import { theme } from '../../../theme';

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

  useEffect(() => {
    let active = true;
    getProfile().then((p) => {
      if (active && p) {
        setAvatarKey(p.avatarKey);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const scoreNum = Number(score ?? '0');
  const totalNum = Number(total ?? '0');

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
          <ClayButton
            label="Done for today ✓"
            variant="coral"
            onPress={() => router.dismissAll()}
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
});
