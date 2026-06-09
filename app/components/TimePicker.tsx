import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { ClayButton } from './ClayButton';
import { IconButton } from './IconButton';
import { Pill } from './Pill';
import { Text } from './Text';

const PRESETS = [
  { label: '🌅 Morning · 8:00', value: '08:00' },
  { label: '☀️ Midday · 12:00', value: '12:00' },
  { label: '🌆 Evening · 18:00', value: '18:00' },
  { label: '🌙 Night · 21:00', value: '21:00' },
];

function hhmm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface TimePickerProps {
  value?: string;
  onChange: (hhmm: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [custom, setCustom] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  if (custom) {
    return (
      <View style={styles.wrap}>
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
            onPress={() => setMinute((m) => (m + 45) % 60)}
          />
          <Text variant="meta" color="inkSoft">
            minutes
          </Text>
          <IconButton
            icon="+"
            accessibilityLabel="Later minutes"
            onPress={() => setMinute((m) => (m + 15) % 60)}
          />
        </View>
        <Text variant="meta" color="inkSoft" style={styles.hint}>
          15-minute steps · 24-hour clock
        </Text>
        <ClayButton
          label="Set time →"
          variant="coral"
          onPress={() => onChange(hhmm(hour, minute))}
          style={styles.cta}
        />
        <ClayButton
          label="← Back to presets"
          variant="ghost"
          onPress={() => setCustom(false)}
          style={styles.cta}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {PRESETS.map((p) => (
          <Pill
            key={p.value}
            label={p.label}
            selected={value === p.value}
            onPress={() => onChange(p.value)}
          />
        ))}
      </View>
      <ClayButton
        label="Custom…"
        variant="ghost"
        onPress={() => {
          // Seed the stepper from the current value so editing an existing
          // time opens on that time (onboarding has no prior value → 08:00).
          const [h, m] = (value ?? '').split(':').map(Number);
          if (Number.isInteger(h) && Number.isInteger(m)) {
            setHour(h);
            setMinute(m);
          }
          setCustom(true);
        }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space.sm,
  },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
  hint: { textAlign: 'center', marginTop: theme.space.sm },
});
