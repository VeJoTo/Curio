import type { Category } from '@curio/shared';

// Display category: the shared Category fields + an app-side emoji.
export interface DisplayCategory extends Category {
  emoji: string;
}

export const CATEGORIES: DisplayCategory[] = [
  { slug: 'earth-and-sky', name: 'Earth & Sky', colorToken: 'teal', emoji: '🌍' },
  { slug: 'biology', name: 'Biology', colorToken: 'rose', emoji: '🧬' },
  { slug: 'how-things-work', name: 'How Things Work', colorToken: 'mustard', emoji: '⚙️' },
  { slug: 'history', name: 'History', colorToken: 'indigo', emoji: '🏛️' },
  { slug: 'space', name: 'Space', colorToken: 'coral', emoji: '🚀' },
  { slug: 'art', name: 'Art', colorToken: 'rose', emoji: '🎨' },
  { slug: 'mind-and-brain', name: 'Mind & Brain', colorToken: 'teal', emoji: '🧠' },
  { slug: 'food-and-cooking', name: 'Food & Cooking', colorToken: 'mustard', emoji: '🍳' },
];

/** Look up a display category by slug (undefined if none matches). */
export function getCategory(slug: string): DisplayCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
