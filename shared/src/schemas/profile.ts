import { z } from 'zod';

const AgeBand = z.enum(['under-13', '13-17', '18-24', '25-34', '35-44', '45-54', '55+']);
const Depth = z.enum(['quick', 'deep']);
const NotifPermission = z.enum(['granted', 'denied', 'undetermined']);

const HHmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be 24h HH:mm');

export const ProfileSchema = z.object({
  deviceId: z.string().uuid(),
  name: z.string().min(1).max(40).optional(),
  avatarKey: z.string().min(1),
  ageBand: AgeBand,
  interests: z.array(z.string().min(1)).min(1).max(12),
  dailyTime: HHmm,
  defaultDepth: Depth,
  notifPermission: NotifPermission,
});
export type Profile = z.infer<typeof ProfileSchema>;
