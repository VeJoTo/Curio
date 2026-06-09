import type { Profile } from '@curio/shared';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import {
  AvatarPicker,
  ClayButton,
  ClayCard,
  IconButton,
  Pill,
  SegmentedToggle,
  Text,
  TextField,
  TimePicker,
} from '../components';
import { AGE_BANDS } from '../data/ageBands';
import { availableInterestCategories } from '../data/interests';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { Reveal } from '../motion';
import {
  MAX_INTERESTS,
  type ProfileDraft,
  draftFromProfile,
  isDirty,
  isValidDraft,
  toProfile,
} from '../profile/draft';
import { clearProfile, getProfile, saveProfile } from '../storage/profile';
import { theme } from '../theme';

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; profile: Profile; original: ProfileDraft };

const SAVE_CONFIRM_MS = 700;

export default function ProfileScreen() {
  const router = useRouter();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    getProfile().then((p) => {
      if (!mounted) {
        return;
      }
      if (p) {
        setLoad({ status: 'ready', profile: p, original: draftFromProfile(p) });
        setDraft(draftFromProfile(p));
      } else {
        setLoad({ status: 'missing' });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (load.status === 'loading') {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.color.indigo} accessibilityLabel="Loading your profile" />
      </SafeAreaView>
    );
  }
  if (load.status === 'missing' || !draft) {
    return <Redirect href="/onboarding" />;
  }

  const { profile, original } = load;
  const canSave = isDirty(draft, original) && isValidDraft(draft);

  const toggleInterest = (slug: string) => {
    if (draft.interests.includes(slug)) {
      setDraft({ ...draft, interests: draft.interests.filter((s) => s !== slug) });
    } else if (draft.interests.length < MAX_INTERESTS) {
      setDraft({ ...draft, interests: [...draft.interests, slug] });
    }
  };

  const onSave = async () => {
    setSaveError(false);
    try {
      await saveProfile(toProfile(draft, profile));
    } catch (err) {
      console.error('profile save failed', err);
      setSaveError(true);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved(true);
    await new Promise((resolve) => setTimeout(resolve, SAVE_CONFIRM_MS));
    router.back();
  };
  const save = useAsyncAction(onSave);

  const onStartOver = () => {
    Alert.alert('Start over?', 'This clears your profile and restarts onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start over',
        style: 'destructive',
        onPress: () => {
          clearProfile()
            .then(() => router.replace('/onboarding'))
            .catch((err) => console.error('clearProfile failed', err));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="←" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text variant="title" color="ink">
          You
        </Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Reveal>
          <ClayCard surface="cream">
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Avatar
            </Text>
            <AvatarPicker
              value={draft.avatarKey}
              onChange={(k) => setDraft({ ...draft, avatarKey: k })}
            />
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Name
            </Text>
            <TextField
              value={draft.name ?? ''}
              onChangeText={(name) => setDraft({ ...draft, name })}
              placeholder="Your name"
              accessibilityLabel="Your name"
            />
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Age
            </Text>
            <View style={styles.row}>
              {AGE_BANDS.map((b) => (
                <Pill
                  key={b.value}
                  label={b.label}
                  selected={draft.ageBand === b.value}
                  onPress={() => setDraft({ ...draft, ageBand: b.value })}
                />
              ))}
            </View>
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Interests · {draft.interests.length} chosen
            </Text>
            <View style={styles.row}>
              {availableInterestCategories(draft.interests).map((c) => (
                <Pill
                  key={c.slug}
                  label={`${c.emoji} ${c.name}`}
                  tint={theme.categoryColor[c.colorToken]}
                  selected={draft.interests.includes(c.slug)}
                  onPress={() => toggleInterest(c.slug)}
                />
              ))}
            </View>
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Daily time
            </Text>
            <TimePicker
              value={draft.dailyTime}
              onChange={(t) => setDraft({ ...draft, dailyTime: t })}
            />
          </ClayCard>

          <ClayCard surface="cream" style={styles.card}>
            <Text variant="meta" color="inkSoft" style={styles.label}>
              Default depth
            </Text>
            <SegmentedToggle
              accessibilityLabel="Default depth"
              options={['Quick', 'Deep']}
              value={draft.defaultDepth === 'deep' ? 'Deep' : 'Quick'}
              onChange={(v) =>
                setDraft({ ...draft, defaultDepth: v === 'Deep' ? 'deep' : 'quick' })
              }
            />
          </ClayCard>

          {saved ? (
            <View accessibilityLiveRegion="polite" style={styles.error}>
              <Text variant="meta" color="teal">
                Saved ✓
              </Text>
            </View>
          ) : saveError ? (
            <View accessibilityLiveRegion="polite" style={styles.error}>
              <Text variant="meta" color="coral">
                Couldn't save. Please try again.
              </Text>
            </View>
          ) : null}

          <ClayButton
            label="Save changes"
            variant="coral"
            disabled={!canSave || save.pending}
            loading={save.pending && !saved}
            onPress={save.run}
            style={styles.save}
          />

          <Text variant="meta" color="inkSoft" style={styles.notif}>
            Notifications: {profile.notifPermission}
          </Text>
          <ClayButton
            label="Start over"
            variant="ghost"
            onPress={onStartOver}
            style={styles.startOver}
          />
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.cream },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
  },
  spacer: { width: 46 },
  body: { padding: theme.space.lg },
  card: { marginTop: theme.space.md },
  label: { marginBottom: theme.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  error: { marginTop: theme.space.md },
  save: { alignSelf: 'stretch', marginTop: theme.space.lg },
  notif: { marginTop: theme.space.lg, textAlign: 'center' },
  startOver: { alignSelf: 'center', marginTop: theme.space.sm },
});
