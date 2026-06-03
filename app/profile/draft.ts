import type { Profile } from '@curio/shared';

export interface ProfileDraft {
  name?: string;
  avatarKey: string;
  ageBand: Profile['ageBand'];
  interests: string[];
  dailyTime: string;
  defaultDepth: Profile['defaultDepth'];
}

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 7;

/** Seed an editable draft from a stored profile (interests cloned so edits don't mutate it). */
export function draftFromProfile(p: Profile): ProfileDraft {
  return {
    name: p.name,
    avatarKey: p.avatarKey,
    ageBand: p.ageBand,
    interests: [...p.interests],
    dailyTime: p.dailyTime,
    defaultDepth: p.defaultDepth,
  };
}

/** Saveable when required fields are set and interests are within 3-7. Name is optional. */
export function isValidDraft(draft: ProfileDraft): boolean {
  return (
    draft.avatarKey.length > 0 &&
    draft.dailyTime.length > 0 &&
    draft.interests.length >= MIN_INTERESTS &&
    draft.interests.length <= MAX_INTERESTS
  );
}

function sameInterests(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, i) => value === sortedB[i]);
}

/** True when the draft differs from the originally-loaded values (interest order ignored). */
export function isDirty(draft: ProfileDraft, original: ProfileDraft): boolean {
  return (
    draft.name !== original.name ||
    draft.avatarKey !== original.avatarKey ||
    draft.ageBand !== original.ageBand ||
    draft.dailyTime !== original.dailyTime ||
    draft.defaultDepth !== original.defaultDepth ||
    !sameInterests(draft.interests, original.interests)
  );
}

/** Merge draft edits over the loaded profile, preserving deviceId/notifPermission and normalizing name. */
export function toProfile(draft: ProfileDraft, base: Profile): Profile {
  const name = draft.name?.trim();
  return {
    ...base,
    name: name ? name : undefined,
    avatarKey: draft.avatarKey,
    ageBand: draft.ageBand,
    interests: draft.interests,
    dailyTime: draft.dailyTime,
    defaultDepth: draft.defaultDepth,
  };
}
