import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { ClayButton, IconButton, NotFound, ProgressDots, SceneFrame } from '../../../components';
import { getTopic } from '../../../data/topics';
import { Reveal } from '../../../motion';
import { theme } from '../../../theme';

export default function Story() {
  const router = useRouter();
  const { slug, depth } = useLocalSearchParams<{ slug: string; depth?: string }>();
  const topic = getTopic(slug ?? '');
  const isDeep = depth === 'deep';
  const [index, setIndex] = useState(0);

  if (!topic) {
    return (
      <NotFound
        title="Topic not found"
        message="We couldn't find that topic. Let's head back to today's story."
        onGoHome={() => router.dismissAll()}
      />
    );
  }

  const scenes = isDeep ? topic.scenesDeep : topic.scenesQuick;
  const isLast = index === scenes.length - 1;

  const go = (next: number) => {
    if (next >= 0 && next < scenes.length) {
      setIndex(next);
    }
  };
  const toQuiz = () => {
    router.push({
      pathname: '/topic/[slug]/quiz',
      params: { slug: topic.slug, depth: isDeep ? 'deep' : 'quick' },
    });
  };

  const swipe = Gesture.Pan().onEnd((e) => {
    'worklet';
    if (e.translationX < -40) {
      runOnJS(go)(index + 1);
    } else if (e.translationX > 40) {
      runOnJS(go)(index - 1);
    }
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <IconButton
          icon="←"
          accessibilityLabel="Previous scene"
          disabled={index === 0}
          onPress={() => go(index - 1)}
        />
        <ProgressDots count={scenes.length} index={index} />
        <IconButton icon="✕" accessibilityLabel="Close" onPress={() => router.dismissAll()} />
      </View>

      <GestureDetector gesture={swipe}>
        <View style={styles.stage}>
          <Reveal key={index}>
            <SceneFrame scene={scenes[index]} sceneIndex={index} sceneCount={scenes.length} />
          </Reveal>
        </View>
      </GestureDetector>

      <View style={styles.nav}>
        {index > 0 ? (
          <ClayButton label="← Back" variant="ghost" onPress={() => go(index - 1)} />
        ) : (
          <View />
        )}
        {isLast ? (
          <ClayButton label="Take the quiz →" variant="coral" onPress={toQuiz} />
        ) : (
          <ClayButton label="Next →" variant="indigo" onPress={() => go(index + 1)} />
        )}
      </View>
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
  stage: { flex: 1, padding: theme.space.lg, justifyContent: 'center' },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.space.lg,
  },
});
