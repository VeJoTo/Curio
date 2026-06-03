import type { Profile } from '@curio/shared';
import { ProfileSchema } from '@curio/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

const PROFILE_KEY = 'curio.profile';
const DEVICE_ID_KEY = 'curio.deviceId';

async function resolveDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

// Memoize the in-flight promise so concurrent first-calls can't generate
// two different UUIDs (the second write would otherwise win).
let deviceIdPromise: Promise<string> | null = null;

export function getDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = resolveDeviceId();
  }
  return deviceIdPromise;
}

export async function getProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const result = ProfileSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  const valid = ProfileSchema.parse(profile);
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(valid));
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
