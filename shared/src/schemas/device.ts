import { z } from 'zod';

const HHmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const Depth = z.enum(['quick', 'deep']);
const ExpoPushToken = z.string().regex(/^Expo(nent)?PushToken\[[^\]]+\]$/);

export const DevicePrefsSchema = z.object({
  categories: z.array(z.string().min(1)).min(1),
  localTime: HHmm,
  tz: z.string().min(1),
  defaultDepth: Depth,
});

export const DeviceSchema = z.object({
  id: z.string().uuid(),
  pushToken: ExpoPushToken,
  prefs: DevicePrefsSchema,
  createdAt: z.string().datetime().optional(),
  lastSeenAt: z.string().datetime().optional(),
});
export type Device = z.infer<typeof DeviceSchema>;
