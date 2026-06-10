import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, ClayButton, Text } from '../../components';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { Burst } from '../../motion';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function DoneStep({ draft, finish }: StepProps) {
  const name = draft.name?.trim();
  const [failed, setFailed] = useState(false);
  const action = useAsyncAction(async () => {
    setFailed(false);
    try {
      await finish();
    } catch (err) {
      console.error('onboarding finish failed', err);
      setFailed(true);
    }
  });
  return (
    <View style={styles.wrap}>
      <Burst active />
      <View style={styles.avatar}>
        <Avatar avatarKey={draft.avatarKey ?? 'avatar-fox'} size="lg" />
      </View>
      <Text variant="display" color="ink">
        {name ? `You're all set, ${name}!` : "You're all set!"}
      </Text>
      <Text variant="body" color="inkSoft">
        Your first topic is waiting.
      </Text>
      {failed ? (
        <View accessibilityLiveRegion="polite" style={styles.error}>
          <Text variant="meta" color="coral">
            Couldn't finish setting up. Please try again.
          </Text>
        </View>
      ) : null}
      <ClayButton
        label={failed ? 'Try again →' : 'Start exploring →'}
        variant="coral"
        loading={action.pending}
        onPress={action.run}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm, alignItems: 'center' },
  avatar: { marginBottom: theme.space.sm },
  error: { alignItems: 'center' },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
