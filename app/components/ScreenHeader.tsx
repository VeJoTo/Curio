import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface HeaderAction {
  icon: string;
  label: string;
  onPress: () => void;
}

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  actions?: HeaderAction[];
}

export function ScreenHeader({ title, onBack, actions = [] }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? <IconButton icon="←" accessibilityLabel="Go back" onPress={onBack} /> : null}
      </View>
      <Text variant={onBack ? 'heading' : 'title'} color="ink">
        {title}
      </Text>
      <View style={[styles.side, styles.sideEnd]}>
        {actions.map((action) => (
          <IconButton
            key={action.label}
            icon={action.icon}
            accessibilityLabel={action.label}
            onPress={action.onPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minWidth: 46,
  },
  sideEnd: { justifyContent: 'flex-end' },
});
