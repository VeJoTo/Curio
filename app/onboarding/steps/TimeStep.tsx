import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ClayButton, IconButton, Pill, Text } from '../../components';
import { theme } from '../../theme';
import type { StepProps } from '../types';

const PRESETS = [
  { label: '🌅 Morning · 8:00', value: '08:00' },
  { label: '☀️ Midday · 12:00', value: '12:00' },
  { label: '🌆 Evening · 18:00', value: '18:00' },
  { label: '🌙 Night · 21:00', value: '21:00' },
];

function hhmm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function TimeStep({ draft, patch, next }: StepProps) {
  const [custom, setCustom] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  if (custom) {
    return (
      <View style={styles.wrap}>
        <Text variant="title" color="ink">
          Pick a time
        </Text>
        <View style={styles.stepper}>
          <IconButton
            icon="−"
            accessibilityLabel="Earlier hour"
            onPress={() => setHour((h) => (h + 23) % 24)}
          />
          <Text variant="display" color="ink">
            {hhmm(hour, minute)}
          </Text>
          <IconButton
            icon="+"
            accessibilityLabel="Later hour"
            onPress={() => setHour((h) => (h + 1) % 24)}
          />
        </View>
        <View style={styles.stepper}>
          <IconButton
            icon="−"
            accessibilityLabel="Earlier minutes"
            onPress={() => setMinute((m) => (m === 0 ? 30 : 0))}
          />
          <Text variant="meta" color="inkSoft">
            minutes
          </Text>
          <IconButton
            icon="+"
            accessibilityLabel="Later minutes"
            onPress={() => setMinute((m) => (m === 0 ? 30 : 0))}
          />
        </View>
        <ClayButton
          label="Set time →"
          variant="coral"
          onPress={() => {
            patch({ dailyTime: hhmm(hour, minute) });
            next();
          }}
          style={styles.cta}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        When should we nudge you?
      </Text>
      <View style={styles.row}>
        {PRESETS.map((p) => (
          <Pill
            key={p.value}
            label={p.label}
            selected={draft.dailyTime === p.value}
            onPress={() => {
              patch({ dailyTime: p.value });
              next();
            }}
          />
        ))}
      </View>
      <ClayButton
        label="Custom…"
        variant="ghost"
        onPress={() => setCustom(true)}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: theme.space.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space.sm,
  },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
