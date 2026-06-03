import type { Profile } from '@curio/shared';
import { ProfileSchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { type ProfileDraft, draftFromProfile, isDirty, isValidDraft, toProfile } from './draft';

const PROFILE: Profile = {
  deviceId: 'd1a2b3c4-1111-2222-3333-444455556666',
  name: 'Vera',
  avatarKey: 'avatar-fox',
  ageBand: '25-34',
  interests: ['space', 'history', 'biology'],
  dailyTime: '08:00',
  defaultDepth: 'quick',
  notifPermission: 'granted',
};

const base = (): ProfileDraft => draftFromProfile(PROFILE);

describe('draftFromProfile', () => {
  it('copies the editable fields and clones interests', () => {
    const draft = draftFromProfile(PROFILE);
    expect(draft).toEqual({
      name: 'Vera',
      avatarKey: 'avatar-fox',
      ageBand: '25-34',
      interests: ['space', 'history', 'biology'],
      dailyTime: '08:00',
      defaultDepth: 'quick',
    });
    expect(draft.interests).not.toBe(PROFILE.interests);
  });
});

describe('isValidDraft', () => {
  it('is true for a complete draft', () => {
    expect(isValidDraft(base())).toBe(true);
  });

  it('is false when avatar or time is empty', () => {
    expect(isValidDraft({ ...base(), avatarKey: '' })).toBe(false);
    expect(isValidDraft({ ...base(), dailyTime: '' })).toBe(false);
  });

  it('is false when interests are out of the 3-7 range', () => {
    expect(isValidDraft({ ...base(), interests: ['a', 'b'] })).toBe(false);
    expect(isValidDraft({ ...base(), interests: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] })).toBe(
      false,
    );
  });

  it('does not depend on name (name is optional)', () => {
    expect(isValidDraft({ ...base(), name: undefined })).toBe(true);
  });
});

describe('isDirty', () => {
  it('is false for an unchanged copy', () => {
    expect(isDirty(base(), base())).toBe(false);
  });

  it('is true when a scalar field changes', () => {
    expect(isDirty({ ...base(), defaultDepth: 'deep' }, base())).toBe(true);
    expect(isDirty({ ...base(), name: 'Nova' }, base())).toBe(true);
  });

  it('ignores interest ordering', () => {
    expect(isDirty({ ...base(), interests: ['history', 'biology', 'space'] }, base())).toBe(false);
  });

  it('is true when an interest is added or removed', () => {
    expect(isDirty({ ...base(), interests: ['space', 'history'] }, base())).toBe(true);
  });
});

describe('toProfile', () => {
  it('preserves deviceId and notifPermission from the base', () => {
    const next = toProfile({ ...base(), defaultDepth: 'deep' }, PROFILE);
    expect(next.deviceId).toBe(PROFILE.deviceId);
    expect(next.notifPermission).toBe('granted');
    expect(next.defaultDepth).toBe('deep');
  });

  it('normalizes a blank name to undefined', () => {
    expect(toProfile({ ...base(), name: '   ' }, PROFILE).name).toBeUndefined();
    expect(toProfile({ ...base(), name: undefined }, PROFILE).name).toBeUndefined();
  });

  it('trims a non-blank name', () => {
    expect(toProfile({ ...base(), name: '  Nova ' }, PROFILE).name).toBe('Nova');
  });

  it('produces a profile that passes ProfileSchema', () => {
    const next = toProfile({ ...base(), interests: ['space', 'art', 'music'] }, PROFILE);
    expect(ProfileSchema.safeParse(next).success).toBe(true);
  });
});
