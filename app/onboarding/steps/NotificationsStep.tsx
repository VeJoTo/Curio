import * as Notifications from 'expo-notifications';
import { Platform, StyleSheet, View } from 'react-native';
import { ClayButton, Text } from '../../components';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { toPermission } from '../../notifications/permission';
import { theme } from '../../theme';
import type { StepProps } from '../types';

export function NotificationsStep({ patch, next }: StepProps) {
  const allow = async () => {
    if (Platform.OS === 'web') {
      patch({ notifPermission: 'undetermined' });
      next();
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    patch({ notifPermission: toPermission(status) });
    next();
  };
  const allowAction = useAsyncAction(allow);

  return (
    <View style={styles.wrap}>
      <Text variant="display" style={styles.hero}>
        🔔
      </Text>
      <Text variant="title" color="ink">
        One gentle nudge a day
      </Text>
      <Text variant="body" color="inkSoft">
        No spam — just your daily spark, at the time you picked.
      </Text>
      <ClayButton
        label="Allow notifications"
        variant="coral"
        loading={allowAction.pending}
        onPress={allowAction.run}
        style={styles.cta}
      />
      <ClayButton
        label="Maybe later"
        variant="ghost"
        disabled={allowAction.pending}
        onPress={() => {
          patch({ notifPermission: 'undetermined' });
          next();
        }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  hero: { fontSize: 48, lineHeight: 56 },
  cta: { alignSelf: 'stretch', marginTop: theme.space.xs },
});
