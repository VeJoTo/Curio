import { StyleSheet, View } from 'react-native';
import { Avatar, ClayButton, Text } from '../../components';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { Burst } from '../../motion';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function DoneStep({ draft, finish }: StepProps) {
  const name = draft.name?.trim();
  const action = useAsyncAction(finish);
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
      <ClayButton
        label="Start exploring →"
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
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
