import { StyleSheet, View } from 'react-native';
import { ClayButton, Pill, Text } from '../../components';
import { CATEGORIES } from '../../data/categories';
import { theme } from '../../theme';
import type { StepProps } from '../types';

const MIN = 3;
const MAX = 7;

export function InterestsStep({ draft, patch, next }: StepProps) {
  const selected = draft.interests;

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      patch({ interests: selected.filter((s) => s !== slug) });
    } else if (selected.length < MAX) {
      patch({ interests: [...selected, slug] });
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="title" color="ink">
        What are you into?
      </Text>
      <Text variant="meta" color="inkSoft">
        Pick {MIN}–{MAX} · {selected.length} chosen
      </Text>
      <View style={styles.row}>
        {CATEGORIES.map((c) => (
          <Pill
            key={c.slug}
            label={`${c.emoji} ${c.name}`}
            tint={theme.categoryColor[c.colorToken]}
            selected={selected.includes(c.slug)}
            onPress={() => toggle(c.slug)}
          />
        ))}
      </View>
      <ClayButton
        label="Next →"
        variant="coral"
        disabled={selected.length < MIN}
        onPress={next}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: theme.space.sm },
  cta: { alignSelf: 'stretch', marginTop: theme.space.md },
});
