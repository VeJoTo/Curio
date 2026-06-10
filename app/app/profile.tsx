import type { Profile } from '@curio/shared';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
import { type NotifPermission, notifControl } from '../notifications/permission';
import { getOsPermission, openSystemSettings, requestOsPermission } from '../notifications/service';
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
  const [resetError, setResetError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getProfile().then(async (p) => {
      if (!mounted) {
        return;
      }
      if (!p) {
        setLoad({ status: 'missing' });
        return;
      }
      // Reconcile the stored notification permission with the real OS state, so a
      // change made in system Settings is reflected (and persisted) on open.
      let profile = p;
      const real = await getOsPermission();
      if (!mounted) {
        return;
      }
      if (real !== p.notifPermission) {
        profile = { ...p, notifPermission: real };
        saveProfile(profile).catch((err) => console.error('notif reconcile save failed', err));
      }
      setLoad({ status: 'ready', profile, original: draftFromProfile(profile) });
      setDraft(draftFromProfile(profile));
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

  const control = notifControl(profile.notifPermission);
  const applyPermission = async (perm: NotifPermission) => {
    setLoad((prev) =>
      prev.status === 'ready'
        ? { ...prev, profile: { ...prev.profile, notifPermission: perm } }
        : prev,
    );
    try {
      await saveProfile({ ...profile, notifPermission: perm });
    } catch (err) {
      console.error('notif permission save failed', err);
    }
  };
  const onNotif = async () => {
    if (control.action === 'request') {
      await applyPermission(await requestOsPermission());
    } else {
      openSystemSettings();
    }
  };
  const notifAction = useAsyncAction(onNotif);

  const onBack = () => {
    if (isDirty(draft, original)) {
      Alert.alert('Discard changes?', 'Your unsaved edits will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
      return;
    }
    router.back();
  };

  const onStartOver = () => {
    Alert.alert('Start over?', 'This clears your profile and restarts onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start over',
        style: 'destructive',
        onPress: () => {
          setResetError(false);
          clearProfile()
            .then(() => router.replace('/onboarding'))
            .catch((err) => {
              console.error('clearProfile failed', err);
              setResetError(true);
            });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="←" accessibilityLabel="Go back" onPress={onBack} />
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
              {draft.interests.length >= MAX_INTERESTS ? ' · max reached' : ''}
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

          {Platform.OS !== 'web' ? (
            <View style={styles.notif}>
              <Text variant="meta" color="inkSoft" style={styles.notifLabel}>
                Notifications: {control.statusLabel}
              </Text>
              <ClayButton
                label={control.actionLabel}
                variant="ghost"
                loading={notifAction.pending}
                onPress={notifAction.run}
                style={styles.notifBtn}
              />
            </View>
          ) : null}
          <ClayButton
            label="Start over"
            variant="ghost"
            onPress={onStartOver}
            style={styles.startOver}
          />
          {resetError ? (
            <View accessibilityLiveRegion="polite" style={styles.error}>
              <Text variant="meta" color="coral">
                Couldn't reset. Please try again.
              </Text>
            </View>
          ) : null}
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
  notif: { marginTop: theme.space.lg, alignItems: 'center', gap: theme.space.xs },
  notifLabel: { textAlign: 'center' },
  notifBtn: { alignSelf: 'center' },
  startOver: { alignSelf: 'center', marginTop: theme.space.sm },
});
