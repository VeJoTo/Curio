import { z } from 'zod';
import { DepthSchema, HHmmSchema } from './_primitives.js';

const ExpoPushToken = z.string().regex(/^Expo(nent)?PushToken\[[^\]]+\]$/);

export const DevicePrefsSchema = z.object({
  categories: z.array(z.string().min(1)).min(1),
  localTime: HHmmSchema,
  tz: z.string().min(1),
  defaultDepth: DepthSchema,
});

export const DeviceSchema = z.object({
  id: z.string().uuid(),
  pushToken: ExpoPushToken,
  prefs: DevicePrefsSchema,
  createdAt: z.string().datetime().optional(),
  lastSeenAt: z.string().datetime().optional(),
});
export type Device = z.infer<typeof DeviceSchema>;
