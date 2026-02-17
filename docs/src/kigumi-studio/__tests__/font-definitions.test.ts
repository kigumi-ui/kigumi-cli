import { describe, it, expect } from 'vitest';
import {
  AVAILABLE_FONTS,
  FONT_CATEGORIES,
  FONT_WEIGHTS,
} from '../lib/font-definitions';

describe('AVAILABLE_FONTS', () => {
  it('has at least 20 font options', () => {
    expect(AVAILABLE_FONTS.length).toBeGreaterThanOrEqual(20);
  });

  it('every font has a non-empty name and value', () => {
    for (const font of AVAILABLE_FONTS) {
      expect(font.name.length).toBeGreaterThan(0);
      expect(font.value.length).toBeGreaterThan(0);
    }
  });

  it('every font category is a valid FONT_CATEGORIES value', () => {
    const validCategories = new Set<string>(FONT_CATEGORIES);
    for (const font of AVAILABLE_FONTS) {
      expect(validCategories.has(font.category)).toBe(true);
    }
  });

  it('has no duplicate font names', () => {
    const names = AVAILABLE_FONTS.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has no duplicate font values', () => {
    const values = AVAILABLE_FONTS.map((f) => f.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('system fonts do not have bunnyUrl', () => {
    const systemFonts = AVAILABLE_FONTS.filter((f) => f.category === 'System');
    expect(systemFonts.length).toBeGreaterThan(0);
    for (const font of systemFonts) {
      expect(font.bunnyUrl).toBeUndefined();
    }
  });

  it('non-system fonts all have bunnyUrl starting with https://fonts.bunny.net', () => {
    const webFonts = AVAILABLE_FONTS.filter((f) => f.category !== 'System');
    expect(webFonts.length).toBeGreaterThan(0);
    for (const font of webFonts) {
      expect(font.bunnyUrl).toBeDefined();
      expect(font.bunnyUrl!).toMatch(/^https:\/\/fonts\.bunny\.net/);
    }
  });

  it('has all four categories represented', () => {
    const categories = new Set(AVAILABLE_FONTS.map((f) => f.category));
    for (const cat of FONT_CATEGORIES) {
      expect(categories.has(cat)).toBe(true);
    }
  });

  it('Sans-Serif has the most options', () => {
    const counts: Record<string, number> = {};
    for (const font of AVAILABLE_FONTS) {
      counts[font.category] = (counts[font.category] ?? 0) + 1;
    }
    expect(counts['Sans-Serif']).toBeGreaterThan(counts['Monospace']);
    expect(counts['Sans-Serif']).toBeGreaterThanOrEqual(counts['Serif']);
  });

  it('web font values contain fallback fonts', () => {
    const webFonts = AVAILABLE_FONTS.filter((f) => f.category !== 'System');
    for (const font of webFonts) {
      expect(font.value).toContain(',');
    }
  });
});

describe('FONT_CATEGORIES', () => {
  it('has exactly 4 categories', () => {
    expect(FONT_CATEGORIES).toHaveLength(4);
  });

  it('includes System, Sans-Serif, Serif, Monospace', () => {
    expect(FONT_CATEGORIES).toContain('System');
    expect(FONT_CATEGORIES).toContain('Sans-Serif');
    expect(FONT_CATEGORIES).toContain('Serif');
    expect(FONT_CATEGORIES).toContain('Monospace');
  });
});

describe('FONT_WEIGHTS', () => {
  it('has 9 weight options (100 through 900)', () => {
    expect(FONT_WEIGHTS).toHaveLength(9);
  });

  it('weights are in ascending order', () => {
    for (let i = 1; i < FONT_WEIGHTS.length; i++) {
      expect(Number(FONT_WEIGHTS[i].value)).toBeGreaterThan(
        Number(FONT_WEIGHTS[i - 1].value)
      );
    }
  });

  it('each weight has matching label and value', () => {
    for (const w of FONT_WEIGHTS) {
      expect(w.label).toBe(w.value);
    }
  });

  it('includes standard weights 400 and 700', () => {
    expect(FONT_WEIGHTS.find((w) => w.value === '400')).toBeDefined();
    expect(FONT_WEIGHTS.find((w) => w.value === '700')).toBeDefined();
  });
});
