import type { Question } from '@curio/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { AnswerChoice, ClayButton, IconButton, ProgressDots, Text } from '../../../components';
import type { AnswerState } from '../../../components/AnswerChoice';
import { getTopic } from '../../../data/topics';
import { Reveal } from '../../../motion';
import { theme } from '../../../theme';

export default function Quiz() {
  const router = useRouter();
  const { slug, depth } = useLocalSearchParams<{ slug: string; depth?: string }>();
  const topic = getTopic(slug ?? '');
  const isDeep = depth === 'deep';

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  if (!topic) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text variant="body">Topic not found.</Text>
      </SafeAreaView>
    );
  }

  const questions = isDeep ? topic.quizDeep : topic.quizQuick;
  const q: Question = questions[index];
  const isLast = index === questions.length - 1;
  const answered = picked !== null;

  const choose = (choiceIndex: number) => {
    if (answered) {
      return;
    }
    setPicked(choiceIndex);
    if (q.choices[choiceIndex].isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const stateFor = (choiceIndex: number): AnswerState => {
    if (!answered) {
      return 'idle';
    }
    const isCorrect = q.choices[choiceIndex].isCorrect;
    if (choiceIndex === picked) {
      return isCorrect ? 'correct' : 'wrong';
    }
    return isCorrect ? 'mutedCorrect' : 'dimmed';
  };

  const next = () => {
    if (isLast) {
      router.replace({
        pathname: '/topic/[slug]/result',
        params: {
          slug: topic.slug,
          depth: isDeep ? 'deep' : 'quick',
          score: String(score),
          total: String(questions.length),
        },
      });
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="✕" accessibilityLabel="Close" onPress={() => router.dismissAll()} />
        <ProgressDots count={questions.length} index={index} />
        <View style={styles.spacer} />
      </View>

      <View style={styles.body}>
        <Reveal key={index}>
          <Text variant="meta" color="inkSoft" style={styles.tag}>
            Question {index + 1} / {questions.length}
          </Text>
          <Text variant="title" color="ink" style={styles.prompt}>
            {q.prompt}
          </Text>
          {q.choices.map((choice, choiceIndex) => (
            <AnswerChoice
              key={choice.text}
              label={choice.text}
              state={stateFor(choiceIndex)}
              disabled={answered}
              onPress={() => choose(choiceIndex)}
            />
          ))}
        </Reveal>

        {answered ? (
          <Reveal style={styles.explWrap}>
            <View style={styles.expl}>
              <Text variant="body" color="ink" accessibilityLiveRegion="polite">
                {q.explanation}
              </Text>
            </View>
            <ClayButton
              label={isLast ? 'See your result →' : 'Next question →'}
              variant="coral"
              onPress={next}
              style={styles.cta}
            />
          </Reveal>
        ) : null}
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
  spacer: { width: 46 },
  body: { flex: 1, padding: theme.space.lg },
  tag: { marginBottom: theme.space.xs },
  prompt: { marginBottom: theme.space.md },
  explWrap: { marginTop: theme.space.sm },
  expl: {
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.peach,
    padding: theme.space.md,
  },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
