import type { Topic } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import type { DisplayCategory } from './categories';
import {
  availableInterestCategories,
  interestPickerCategories,
  publishedCategorySlugs,
} from './interests';

function cat(slug: string): DisplayCategory {
  return { slug, name: slug, colorToken: 'teal', emoji: '⭐' };
}

// The selectors only read categorySlug/status off a topic; a cast partial keeps tests focused.
function topic(categorySlug: string, status: Topic['status'] = 'published'): Topic {
  return { categorySlug, status } as Topic;
}

describe('publishedCategorySlugs', () => {
  it('collects the categorySlugs of published topics only', () => {
    const slugs = publishedCategorySlugs([topic('space'), topic('biology'), topic('art', 'draft')]);
    expect(slugs).toEqual(new Set(['space', 'biology']));
  });

  it('returns an empty set when there are no published topics', () => {
    expect(publishedCategorySlugs([topic('space', 'draft')])).toEqual(new Set());
  });
});

describe('interestPickerCategories', () => {
  const categories = [cat('space'), cat('biology'), cat('art'), cat('history')];
  const topics = [topic('space'), topic('biology')]; // only space + biology have content

  it('shows only categories with a published topic when nothing is selected', () => {
    const result = interestPickerCategories(categories, topics, []);
    expect(result.map((c) => c.slug)).toEqual(['space', 'biology']);
  });

  it('also shows an already-selected category that has no published topic (removable ghost)', () => {
    const result = interestPickerCategories(categories, topics, ['art']);
    expect(result.map((c) => c.slug)).toEqual(['space', 'biology', 'art']);
  });

  it('hides a category with no published topic that is not selected', () => {
    const result = interestPickerCategories(categories, topics, ['art']);
    expect(result.map((c) => c.slug)).not.toContain('history');
  });

  it('preserves the original category order', () => {
    const result = interestPickerCategories(categories, topics, ['history']);
    expect(result.map((c) => c.slug)).toEqual(['space', 'biology', 'history']);
  });

  it('does not count a draft topic as making its category available', () => {
    const result = interestPickerCategories(categories, [topic('art', 'draft')], []);
    expect(result).toEqual([]);
  });
});

describe('availableInterestCategories (real catalog)', () => {
  it('returns exactly the categories that currently have published topics', () => {
    expect(availableInterestCategories().map((c) => c.slug)).toEqual([
      'earth-and-sky',
      'biology',
      'how-things-work',
      'space',
    ]);
  });

  it('includes an already-selected empty category so it can be removed', () => {
    expect(availableInterestCategories(['art']).map((c) => c.slug)).toContain('art');
  });
});
