import { z } from 'zod';
import { DepthSchema, HHmmSchema } from './_primitives.js';

const AgeBand = z.enum(['under-13', '13-17', '18-24', '25-34', '35-44', '45-54', '55+']);
const NotifPermission = z.enum(['granted', 'denied', 'undetermined']);

export const ProfileSchema = z.object({
  deviceId: z.string().uuid(),
  name: z.string().min(1).max(40).optional(),
  avatarKey: z.string().min(1),
  ageBand: AgeBand,
  // UI enforces 3–7 during onboarding (spec §2); 12 is schema-level headroom for future expansion.
  interests: z.array(z.string().min(1)).min(1).max(12),
  dailyTime: HHmmSchema,
  defaultDepth: DepthSchema,
  notifPermission: NotifPermission,
});
export type Profile = z.infer<typeof ProfileSchema>;
