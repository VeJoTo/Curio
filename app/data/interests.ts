import type { Topic } from '@curio/shared';
import { CATEGORIES, type DisplayCategory } from './categories';
import { getAllTopics } from './topics';

/** Category slugs that have at least one published topic. */
export function publishedCategorySlugs(topics: Topic[]): Set<string> {
  return new Set(topics.filter((t) => t.status === 'published').map((t) => t.categorySlug));
}

/**
 * Categories to show in an interest picker: every category that has a published
 * topic, plus any already-selected category (so a previously-chosen category with
 * no content stays visible and removable, but can't be newly added). Original
 * category order is preserved.
 */
export function interestPickerCategories(
  categories: DisplayCategory[],
  topics: Topic[],
  selected: string[],
): DisplayCategory[] {
  const available = publishedCategorySlugs(topics);
  const selectedSet = new Set(selected);
  return categories.filter((c) => available.has(c.slug) || selectedSet.has(c.slug));
}

/** Interest picker categories over the real catalog. Pass current selections to keep them visible. */
export function availableInterestCategories(selected: string[] = []): DisplayCategory[] {
  return interestPickerCategories(CATEGORIES, getAllTopics(), selected);
}
