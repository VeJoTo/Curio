import { describe, expect, it } from 'vitest';
import { greetingLine } from './greeting';

describe('greetingLine', () => {
  it('greets by name when present', () => {
    expect(greetingLine('Vera')).toBe('Hi, Vera 👋');
  });

  it('returns null when name is undefined', () => {
    expect(greetingLine(undefined)).toBeNull();
  });

  it('returns null for a blank/whitespace name', () => {
    expect(greetingLine('   ')).toBeNull();
  });
});
