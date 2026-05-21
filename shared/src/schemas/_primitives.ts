import { z } from 'zod';

/** 24-hour clock string, e.g. "08:00" or "23:59". */
export const HHmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be 24h HH:mm');

/** Session-length preference shared across profile and device prefs. */
export const DepthSchema = z.enum(['quick', 'deep']);
export type Depth = z.infer<typeof DepthSchema>;
