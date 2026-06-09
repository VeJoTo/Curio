import type { Profile } from '@curio/shared';

export type AgeBand = Profile['ageBand'];
export type Depth = Profile['defaultDepth'];
export type NotifPermission = Profile['notifPermission'];

export interface OnboardingDraft {
  name?: string;
  avatarKey?: string;
  ageBand?: AgeBand;
  interests: string[];
  dailyTime?: string;
  defaultDepth?: Depth;
  notifPermission?: NotifPermission;
}

export interface StepProps {
  draft: OnboardingDraft;
  patch: (p: Partial<OnboardingDraft>) => void;
  next: () => void;
  finish: () => Promise<void>;
}
