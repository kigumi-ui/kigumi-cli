/**
 * Display Options Tests
 *
 * Tests for src/utils/display-options.ts
 */

import { describe, it, expect } from 'vitest';
import {
  getThemeLabel,
  getPaletteLabel,
  getBrandColorLabel,
  getThemeOptionsForTier,
  getPaletteOptionsForTier,
  THEME_OPTIONS,
  PALETTE_OPTIONS,
  BRAND_COLOR_OPTIONS,
} from '../../src/utils/display-options.js';
import { TIER_RESTRICTIONS } from '../../src/utils/tier-restrictions.js';

describe('THEME_OPTIONS', () => {
  it('should include free themes', () => {
    const freeThemes = THEME_OPTIONS.filter((t) => !t.pro);
    expect(freeThemes.length).toBeGreaterThanOrEqual(3);
    const freeValues = freeThemes.map((t) => t.value);
    expect(freeValues).toContain('default');
  });

  it('should include pro themes', () => {
    const proThemes = THEME_OPTIONS.filter((t) => t.pro);
    expect(proThemes.length).toBeGreaterThan(0);
  });

  it('should have unique values', () => {
    const values = THEME_OPTIONS.map((t) => t.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('PALETTE_OPTIONS', () => {
  it('should include default palette', () => {
    const values = PALETTE_OPTIONS.map((p) => p.value);
    expect(values).toContain('default');
  });

  it('should have unique values', () => {
    const values = PALETTE_OPTIONS.map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('BRAND_COLOR_OPTIONS', () => {
  it('should include standard colors', () => {
    const values = BRAND_COLOR_OPTIONS.map((c) => c.value);
    expect(values).toContain('blue');
    expect(values).toContain('red');
    expect(values).toContain('green');
  });

  it('should have unique values', () => {
    const values = BRAND_COLOR_OPTIONS.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('getThemeLabel', () => {
  it('should return label for known theme', () => {
    const label = getThemeLabel('default');
    expect(label).toBeTruthy();
    expect(typeof label).toBe('string');
  });

  it('should return value as fallback for unknown theme', () => {
    expect(getThemeLabel('nonexistent-theme')).toBe('nonexistent-theme');
  });

  it('should return label different from value for named themes', () => {
    const option = THEME_OPTIONS.find((t) => t.label !== t.value);
    if (option) {
      expect(getThemeLabel(option.value)).toBe(option.label);
    }
  });
});

describe('getPaletteLabel', () => {
  it('should return label for known palette', () => {
    const label = getPaletteLabel('default');
    expect(label).toBeTruthy();
  });

  it('should return value as fallback for unknown palette', () => {
    expect(getPaletteLabel('nonexistent')).toBe('nonexistent');
  });
});

describe('getBrandColorLabel', () => {
  it('should return label for known color', () => {
    const label = getBrandColorLabel('blue');
    expect(label).toBeTruthy();
  });

  it('should return value as fallback for unknown color', () => {
    expect(getBrandColorLabel('magenta')).toBe('magenta');
  });
});

describe('getThemeOptionsForTier', () => {
  it('should return only free themes for free tier', () => {
    const options = getThemeOptionsForTier('free');
    expect(options.length).toBeGreaterThan(0);
    // None should have pro metadata
    for (const opt of options) {
      expect(opt).not.toHaveProperty('pro');
    }
  });

  it('should return all themes for pro tier', () => {
    const freeOptions = getThemeOptionsForTier('free');
    const proOptions = getThemeOptionsForTier('pro');
    expect(proOptions.length).toBeGreaterThan(freeOptions.length);
  });

  it('should include free themes in pro tier', () => {
    const freeValues = getThemeOptionsForTier('free').map((o) => o.value);
    const proValues = getThemeOptionsForTier('pro').map((o) => o.value);
    for (const val of freeValues) {
      expect(proValues).toContain(val);
    }
  });

  it('should return options with value and label only', () => {
    const options = getThemeOptionsForTier('free');
    for (const opt of options) {
      expect(Object.keys(opt)).toEqual(
        expect.arrayContaining(['value', 'label'])
      );
    }
  });
});

describe('PALETTE_OPTIONS pro flags', () => {
  it('match TIER_RESTRICTIONS.palettes set-difference', () => {
    const flaggedAsPro = PALETTE_OPTIONS.filter((p) => 'pro' in p && p.pro).map(
      (p) => p.value
    );
    const expectedProOnly = TIER_RESTRICTIONS.palettes.pro.filter(
      (v) => !TIER_RESTRICTIONS.palettes.free.includes(v)
    );
    expect(new Set(flaggedAsPro)).toEqual(new Set(expectedProOnly));
  });
});

describe('getPaletteOptionsForTier', () => {
  it('returns 3 palettes for free tier', () => {
    const options = getPaletteOptionsForTier('free');
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.value)).toEqual([
      'default',
      'bright',
      'shoelace',
    ]);
  });

  it('returns all 9 palettes for pro tier', () => {
    const options = getPaletteOptionsForTier('pro');
    expect(options).toHaveLength(9);
  });

  it('strips the pro flag from returned objects', () => {
    const options = getPaletteOptionsForTier('pro');
    for (const option of options) {
      expect(option).toEqual({
        value: expect.any(String),
        label: expect.any(String),
      });
      expect('pro' in option).toBe(false);
    }
  });
});
