import { describe, expect, it } from 'vitest';
import { theme } from './index';

// WCAG 2.1 relative luminance + contrast ratio, computed from a #rrggbb string.
function luminance(hex: string): number {
  const v = hex.replace('#', '');
  const channel = (h: string) => {
    const s = Number.parseInt(h, 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(v.slice(0, 2));
  const g = channel(v.slice(2, 4));
  const b = channel(v.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('palette contrast', () => {
  it('ink on cream is AAA body (>= 11:1)', () => {
    expect(contrast(theme.color.ink, theme.color.cream)).toBeGreaterThanOrEqual(11);
  });

  it('inkSoft on cream is AA (>= 4.5:1)', () => {
    expect(contrast(theme.color.inkSoft, theme.color.cream)).toBeGreaterThanOrEqual(4.5);
  });

  it('white on indigo is AA for the primary button (>= 4.5:1)', () => {
    expect(contrast('#FFFFFF', theme.color.indigo)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('type scale', () => {
  it('body is at least 16px with line-height >= 1.5', () => {
    expect(theme.type.body.fontSize).toBeGreaterThanOrEqual(16);
    expect(theme.type.body.lineHeight / theme.type.body.fontSize).toBeGreaterThanOrEqual(1.5);
  });

  it('sizes step down display > title > heading > body', () => {
    expect(theme.type.display.fontSize).toBeGreaterThan(theme.type.title.fontSize);
    expect(theme.type.title.fontSize).toBeGreaterThan(theme.type.heading.fontSize);
    expect(theme.type.heading.fontSize).toBeGreaterThan(theme.type.body.fontSize);
  });

  it('bodyStrong matches body size; meta is smaller', () => {
    expect(theme.type.bodyStrong.fontSize).toBe(theme.type.body.fontSize);
    expect(theme.type.meta.fontSize).toBeLessThan(theme.type.body.fontSize);
  });
});

describe('token completeness', () => {
  it('every category color token maps to a hex', () => {
    for (const token of ['rose', 'teal', 'mustard', 'indigo', 'coral'] as const) {
      expect(theme.categoryColor[token]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('exposes the core palette roles', () => {
    for (const role of [
      'cream',
      'peach',
      'surface',
      'ink',
      'inkSoft',
      'coral',
      'indigo',
    ] as const) {
      expect(theme.color[role]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
