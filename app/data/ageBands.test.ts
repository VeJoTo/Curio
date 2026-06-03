import { ProfileSchema } from '@curio/shared';
import { describe, expect, it } from 'vitest';
import { AGE_BANDS } from './ageBands';

describe('AGE_BANDS', () => {
  it('covers exactly the age bands the schema accepts', () => {
    const schemaValues = [...ProfileSchema.shape.ageBand.options].sort();
    const listValues = AGE_BANDS.map((b) => b.value).sort();
    expect(listValues).toEqual(schemaValues);
  });

  it('gives every band a non-empty label', () => {
    for (const band of AGE_BANDS) {
      expect(band.label.length).toBeGreaterThan(0);
    }
  });
});
