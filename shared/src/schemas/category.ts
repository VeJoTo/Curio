import { z } from 'zod';

// Tokens from spec §6 — keep in sync with app theme
export const ColorToken = z.enum(['rose', 'teal', 'mustard', 'indigo', 'coral']);

export const CategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  colorToken: ColorToken,
});
export type Category = z.infer<typeof CategorySchema>;
