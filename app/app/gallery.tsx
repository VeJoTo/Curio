import type { ReactNode } from 'react';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  ClayButton,
  ClayCard,
  IconButton,
  Pill,
  ProgressDots,
  ScreenHeader,
  SegmentedToggle,
  Text,
  TextField,
} from '../components';
import { theme } from '../theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="meta" color="inkSoft">
        {title}
      </Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

export default function Gallery() {
  const [name, setName] = useState('');
  const [depth, setDepth] = useState('Quick');
  const [interest, setInterest] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="Gallery" />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Type">
          <View>
            <Text variant="display">Display</Text>
            <Text variant="title">Title</Text>
            <Text variant="heading">Heading</Text>
            <Text variant="body">Body — 16px Manrope at 1.5 line-height.</Text>
            <Text variant="bodyStrong">Body strong</Text>
            <Text variant="meta" color="inkSoft">
              Meta label
            </Text>
          </View>
        </Section>

        <Section title="ClayButton">
          <ClayButton label="Explore today" variant="coral" icon="→" onPress={() => {}} />
          <ClayButton label="Deep dive" variant="indigo" onPress={() => {}} />
          <ClayButton
            label="Save"
            variant="ghost"
            icon="♡"
            iconPosition="leading"
            onPress={() => {}}
          />
          <ClayButton label="Disabled" variant="indigo" disabled onPress={() => {}} />
        </Section>

        <Section title="IconButton">
          <IconButton icon="←" accessibilityLabel="Back" onPress={() => {}} />
          <IconButton icon="♡" accessibilityLabel="Save" onPress={() => {}} />
          <IconButton icon="★" accessibilityLabel="Favorite" onPress={() => {}} />
          <IconButton icon="📚" accessibilityLabel="History" onPress={() => {}} />
          <IconButton icon="👤" accessibilityLabel="Profile" onPress={() => {}} />
        </Section>

        <Section title="ClayCard">
          <ClayCard surface="cream" onPress={() => {}} accessibilityLabel="Sample topic">
            <Text variant="meta" color="inkSoft">
              Earth & Sky
            </Text>
            <Text variant="title">The Northern Lights</Text>
          </ClayCard>
        </Section>

        <Section title="Pill">
          <Pill label="Earth & Sky" tint={theme.categoryColor.teal} />
          <Pill label="Biology" selected={interest} onPress={() => setInterest((v) => !v)} />
          <Pill label="Saved" />
        </Section>

        <Section title="SegmentedToggle">
          <SegmentedToggle options={['Quick', 'Deep']} value={depth} onChange={setDepth} />
        </Section>

        <Section title="ProgressDots">
          <ProgressDots count={5} index={1} />
          <ProgressDots count={9} index={3} />
        </Section>

        <Section title="TextField">
          <TextField label="Your name" value={name} onChangeText={setName} placeholder="Vera" />
        </Section>

        <Section title="Avatar">
          <Avatar avatarKey="avatar-fox" />
          <Avatar avatarKey="avatar-owl" />
          <Avatar avatarKey="avatar-bee" size="lg" />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  content: { padding: theme.space.lg, gap: theme.space.xl },
  section: { gap: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space.sm },
});
