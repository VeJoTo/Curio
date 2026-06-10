import { z } from 'zod';

/** One per-day journal entry: a completed topic plus its reflection. */
export const DayEntrySchema = z
  .object({
    // Local calendar day, "YYYY-MM-DD". Format-only check — the value is
    // produced by the app's dayKey(date), which guarantees calendar validity.
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
    slug: z.string().min(1),
    score: z.number().int().min(0),
    total: z.number().int().min(0),
    // May be "" — an empty reflection is allowed.
    reflection: z.string().max(2000),
    // ISO instant the day was marked done.
    completedAt: z.string().datetime(),
  })
  .refine((d) => d.score <= d.total, {
    message: 'score cannot exceed total',
    path: ['score'],
  });
export type DayEntry = z.infer<typeof DayEntrySchema>;
