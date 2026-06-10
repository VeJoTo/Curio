import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { type NotifPermission, toPermission } from './permission';

// Thin wrappers over the OS notification permission APIs. Web has no native
// permission model here, so it resolves to `undetermined` (matching how the
// onboarding step treats web). Side-effectful — covered by manual verification,
// not unit tests (the pure mapping in permission.ts is what's tested).

export async function getOsPermission(): Promise<NotifPermission> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }
  const { status } = await Notifications.getPermissionsAsync();
  return toPermission(status);
}

export async function requestOsPermission(): Promise<NotifPermission> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return toPermission(status);
}

export function openSystemSettings(): void {
  Linking.openSettings().catch(() => {});
}
