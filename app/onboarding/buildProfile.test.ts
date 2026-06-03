import { ProfileSchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { buildProfile } from './buildProfile';
import type { OnboardingDraft } from './types';

const DEVICE_ID = 'd1a2b3c4-1111-2222-3333-444455556666';

const complete: OnboardingDraft = {
  name: 'Vera',
  avatarKey: 'avatar-fox',
  ageBand: '18-24',
  interests: ['earth-and-sky', 'biology', 'space'],
  dailyTime: '08:00',
  defaultDepth: 'quick',
  notifPermission: 'granted',
};

describe('buildProfile', () => {
  it('builds a ProfileSchema-valid profile from a complete draft', () => {
    const profile = buildProfile(complete, DEVICE_ID);
    expect(ProfileSchema.safeParse(profile).success).toBe(true);
    expect(profile.deviceId).toBe(DEVICE_ID);
    expect(profile.name).toBe('Vera');
  });

  it('omits name when blank/whitespace', () => {
    const profile = buildProfile({ ...complete, name: '   ' }, DEVICE_ID);
    expect(profile.name).toBeUndefined();
    expect(ProfileSchema.safeParse(profile).success).toBe(true);
  });

  it('accepts interests at the 3 and 7 bounds', () => {
    const three = buildProfile({ ...complete, interests: ['a', 'b', 'c'] }, DEVICE_ID);
    const seven = buildProfile(
      { ...complete, interests: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] },
      DEVICE_ID,
    );
    expect(ProfileSchema.safeParse(three).success).toBe(true);
    expect(ProfileSchema.safeParse(seven).success).toBe(true);
  });

  it('throws on an incomplete draft (missing avatarKey)', () => {
    const { avatarKey: _omit, ...partial } = complete;
    expect(() => buildProfile(partial as OnboardingDraft, DEVICE_ID)).toThrow();
  });
});
