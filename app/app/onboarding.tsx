import { useRouter } from 'expo-router';
import { useReducer } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, ProgressDots } from '../components';
import { Reveal } from '../motion';
import { buildProfile } from '../onboarding/buildProfile';
import { AgeStep } from '../onboarding/steps/AgeStep';
import { AvatarStep } from '../onboarding/steps/AvatarStep';
import { DepthStep } from '../onboarding/steps/DepthStep';
import { DoneStep } from '../onboarding/steps/DoneStep';
import { InterestsStep } from '../onboarding/steps/InterestsStep';
import { NameStep } from '../onboarding/steps/NameStep';
import { NotificationsStep } from '../onboarding/steps/NotificationsStep';
import { TimeStep } from '../onboarding/steps/TimeStep';
import { Welcome } from '../onboarding/steps/Welcome';
import type { OnboardingDraft, StepProps } from '../onboarding/types';
import { getDeviceId, saveProfile } from '../storage/profile';
import { theme } from '../theme';

const STEP_COUNT = 9;

type State = { step: number; draft: OnboardingDraft };
type Action =
  | { type: 'patch'; patch: Partial<OnboardingDraft> }
  | { type: 'next' }
  | { type: 'back' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'patch':
      return { ...state, draft: { ...state.draft, ...action.patch } };
    case 'next':
      return { ...state, step: Math.min(state.step + 1, STEP_COUNT - 1) };
    case 'back':
      return { ...state, step: Math.max(state.step - 1, 0) };
  }
}

export default function Onboarding() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, { step: 0, draft: { interests: [] } });

  const stepProps: StepProps = {
    draft: state.draft,
    patch: (patch) => dispatch({ type: 'patch', patch }),
    next: () => dispatch({ type: 'next' }),
    finish: async () => {
      // Let failures propagate so DoneStep can surface an error and let the user
      // retry; the draft lives in this reducer's state, so it survives a retry.
      const deviceId = await getDeviceId();
      await saveProfile(buildProfile(state.draft, deviceId));
      router.replace('/');
    },
  };

  const steps = [
    Welcome,
    NameStep,
    AvatarStep,
    AgeStep,
    InterestsStep,
    TimeStep,
    DepthStep,
    NotificationsStep,
    DoneStep,
  ];
  const Step = steps[state.step];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.side}>
          {state.step > 0 ? (
            <IconButton
              icon="←"
              accessibilityLabel="Back"
              onPress={() => dispatch({ type: 'back' })}
            />
          ) : null}
        </View>
        <ProgressDots count={STEP_COUNT} index={state.step} />
        <View style={styles.side} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal key={state.step}>
          <Step {...stepProps} />
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
  side: { width: 46 },
  body: { padding: theme.space.lg, flexGrow: 1, justifyContent: 'center' },
});
