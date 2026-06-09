import { CategorySchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, getCategory } from './categories';

describe('categories fixture', () => {
  it('has 8 categories', () => {
    expect(CATEGORIES).toHaveLength(8);
  });

  it('every category parses CategorySchema (slug/name/colorToken)', () => {
    for (const c of CATEGORIES) {
      const result = CategorySchema.safeParse({
        slug: c.slug,
        name: c.name,
        colorToken: c.colorToken,
      });
      expect(result.success).toBe(true);
    }
  });

  it('slugs are unique', () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('getCategory', () => {
  it('returns the category for a known slug', () => {
    expect(getCategory('biology')?.name).toBe('Biology');
    expect(getCategory('space')?.emoji).toBe('🚀');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getCategory('nope')).toBeUndefined();
  });
});
