import { MotiView } from 'moti';
import { Pressable, StyleSheet } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { springs } from '../motion';
import { theme } from '../theme';
import { Text } from './Text';

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'mutedCorrect' | 'dimmed';

interface AnswerChoiceProps {
  label: string;
  state: AnswerState;
  onPress: () => void;
  disabled?: boolean;
}

const BG: Record<AnswerState, string> = {
  idle: theme.color.surface,
  correct: theme.color.teal,
  wrong: theme.color.rose,
  mutedCorrect: theme.color.teal,
  dimmed: theme.color.surface,
};

const MARK: Record<AnswerState, string> = {
  idle: '',
  correct: '✓',
  wrong: '✗',
  mutedCorrect: '✓',
  dimmed: '',
};

// Correctness conveyed visually by colour + glyph; spell it out for assistive
// tech so the announced label carries the same meaning.
const HINT: Record<AnswerState, string> = {
  idle: '',
  correct: ', correct',
  wrong: ', incorrect',
  mutedCorrect: ', correct answer',
  dimmed: '',
};

export function AnswerChoice({ label, state, onPress, disabled = false }: AnswerChoiceProps) {
  const reduced = useReducedMotion();
  const picked = state === 'correct' || state === 'wrong';

  // Pop on correct, shake on wrong (transform-only; off under reduced motion).
  const animate =
    reduced || state === 'idle' || state === 'dimmed' || state === 'mutedCorrect'
      ? { scale: 1, translateX: 0 }
      : state === 'correct'
        ? { scale: [1, 1.06, 1], translateX: 0 }
        : { scale: 1, translateX: [0, -5, 5, -4, 3, 0] };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}${HINT[state]}`}
      accessibilityState={{ disabled, selected: picked }}
    >
      <MotiView
        style={[styles.row, { backgroundColor: BG[state], opacity: state === 'dimmed' ? 0.5 : 1 }]}
        animate={animate}
        transition={springs.bouncy}
      >
        <Text variant="bodyStrong" color="ink">
          {label}
        </Text>
        {MARK[state] ? (
          <Text variant="bodyStrong" color="ink" style={styles.mark}>
            {MARK[state]}
          </Text>
        ) : null}
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: theme.borderWidth,
    borderColor: theme.color.ink,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 15,
    minHeight: 52,
    marginBottom: theme.space.xs,
  },
  mark: { marginLeft: 'auto' },
});
