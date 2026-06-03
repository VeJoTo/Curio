import type { Profile } from '@curio/shared';

export type AgeBand = Profile['ageBand'];

export const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: 'under-13', label: 'Under 13' },
  { value: '13-17', label: '13–17' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+', label: '55+' },
];
