import { z } from 'zod';

const AgeBand = z.enum(['all', '13+', '16+']);
const Status = z.enum(['draft', 'ready', 'published']);
const Motion = z.enum(['drift', 'parallax', 'fade']);

export const SceneSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string().url(),
  caption: z.string().min(1).max(280),
  accentColor: z.string().optional(),
  motion: Motion.optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const ChoiceSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});
export type Choice = z.infer<typeof ChoiceSchema>;

export const QuestionSchema = z.object({
  prompt: z.string().min(1),
  choices: z
    .array(ChoiceSchema)
    .min(2)
    .max(4)
    .refine((cs) => cs.some((c) => c.isCorrect), {
      message: 'At least one choice must be marked correct',
    }),
  explanation: z.string().min(1),
});
export type Question = z.infer<typeof QuestionSchema>;

export const TopicSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(120),
  deck: z.string().min(1).max(280),
  categorySlug: z.string().min(1),
  ageBand: AgeBand,
  status: Status,
  publishedAt: z.string().datetime().nullable().optional(),

  heroImageUrl: z.string().url(),
  scenesQuick: z.array(SceneSchema).min(4).max(6),
  scenesDeep: z.array(SceneSchema).min(10).max(14),
  quizQuick: z.array(QuestionSchema).length(3),
  quizDeep: z.array(QuestionSchema).min(5).max(7),
  sources: z.array(z.string().url()).min(1),
});
export type Topic = z.infer<typeof TopicSchema>;
