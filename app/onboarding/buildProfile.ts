import type { Profile } from '@curio/shared';
import { ProfileSchema } from '@curio/shared';
import type { OnboardingDraft } from './types';

// Assembles a Profile from the wizard draft and validates it.
// Throws (via ProfileSchema.parse) if the draft is incomplete — the Done step
// only calls this once every required step is satisfied.
export function buildProfile(draft: OnboardingDraft, deviceId: string): Profile {
  const name = draft.name?.trim();
  const candidate = {
    deviceId,
    ...(name ? { name } : {}),
    avatarKey: draft.avatarKey,
    ageBand: draft.ageBand,
    interests: draft.interests,
    dailyTime: draft.dailyTime,
    defaultDepth: draft.defaultDepth,
    notifPermission: draft.notifPermission,
  };
  return ProfileSchema.parse(candidate);
}
