/**
 * Tier Schema Validation Tests
 *
 * Tests for src/schemas/tier.ts tier validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  createThemeSchema,
  paletteSchema,
  brandColorSchema,
  componentNameSchema,
  isThemeAllowedForTier,
  isComponentAllowedForTier,
  getAvailableThemes,
  getAvailablePalettes,
  getAvailableBrandColors,
  isProComponent,
  getProComponents,
  validateThemeForTier,
  validateComponentForTier,
  validateComponentsForTier,
  TIER_THEMES,
  PRO_COMPONENTS,
} from '../../src/schemas/tier.js';

describe('createThemeSchema', () => {
  it('accepts valid free theme', () => {
    const schema = createThemeSchema('free');
    expect(schema.parse('awesome')).toBe('awesome');
  });

  it('rejects pro-only theme for free tier', () => {
    const schema = createThemeSchema('free');
    expect(() => schema.parse('ocean')).toThrow();
  });

  it('accepts pro theme for pro tier', () => {
    const schema = createThemeSchema('pro');
    expect(schema.parse('ocean')).toBe('ocean');
  });

  it('accepts all free themes for pro tier', () => {
    const schema = createThemeSchema('pro');
    for (const theme of TIER_THEMES.free) {
      expect(schema.parse(theme)).toBe(theme);
    }
  });

  it('rejects unknown theme for both tiers', () => {
    expect(() => createThemeSchema('free').parse('nonexistent')).toThrow();
    expect(() => createThemeSchema('pro').parse('nonexistent')).toThrow();
  });
});

describe('paletteSchema', () => {
  it('accepts valid palette', () => {
    expect(paletteSchema.parse('bright')).toBe('bright');
  });

  it('rejects invalid palette', () => {
    expect(() => paletteSchema.parse('neon')).toThrow();
  });
});

describe('brandColorSchema', () => {
  it('accepts valid brand color', () => {
    expect(brandColorSchema.parse('purple')).toBe('purple');
  });

  it('rejects invalid brand color', () => {
    expect(() => brandColorSchema.parse('neon')).toThrow();
  });
});

describe('componentNameSchema', () => {
  it('accepts valid name', () => {
    expect(componentNameSchema.parse('button')).toBe('button');
  });

  it('rejects empty string', () => {
    expect(() => componentNameSchema.parse('')).toThrow();
  });
});

describe('isThemeAllowedForTier', () => {
  it('allows free themes for free tier', () => {
    expect(isThemeAllowedForTier('awesome', 'free')).toBe(true);
  });

  it('disallows pro themes for free tier', () => {
    expect(isThemeAllowedForTier('midnight', 'free')).toBe(false);
  });

  it('allows all themes for pro tier', () => {
    expect(isThemeAllowedForTier('midnight', 'pro')).toBe(true);
    expect(isThemeAllowedForTier('awesome', 'pro')).toBe(true);
  });
});

describe('isComponentAllowedForTier', () => {
  it('allows free components for free tier', () => {
    expect(isComponentAllowedForTier('button', 'free')).toBe(true);
  });

  it('disallows pro components for free tier', () => {
    expect(isComponentAllowedForTier('combobox', 'free')).toBe(false);
    expect(isComponentAllowedForTier('charts', 'free')).toBe(false);
  });

  it('allows everything for pro tier', () => {
    expect(isComponentAllowedForTier('combobox', 'pro')).toBe(true);
    expect(isComponentAllowedForTier('button', 'pro')).toBe(true);
  });
});

describe('getAvailableThemes', () => {
  it('returns 3 themes for free', () => {
    expect(getAvailableThemes('free')).toHaveLength(3);
  });

  it('returns 11 themes for pro', () => {
    expect(getAvailableThemes('pro')).toHaveLength(11);
  });

  it('returns copies (not references)', () => {
    const themes = getAvailableThemes('free');
    themes.push('hacked');
    expect(getAvailableThemes('free')).toHaveLength(3);
  });
});

describe('getAvailablePalettes', () => {
  it('returns all palettes', () => {
    expect(getAvailablePalettes().length).toBeGreaterThan(0);
    expect(getAvailablePalettes()).toContain('bright');
  });
});

describe('getAvailableBrandColors', () => {
  it('returns all brand colors', () => {
    expect(getAvailableBrandColors()).toContain('blue');
    expect(getAvailableBrandColors()).toContain('purple');
  });
});

describe('isProComponent', () => {
  it('identifies pro components', () => {
    expect(isProComponent('combobox')).toBe(true);
    expect(isProComponent('charts')).toBe(true);
  });

  it('identifies free components', () => {
    expect(isProComponent('button')).toBe(false);
  });
});

describe('getProComponents', () => {
  it('returns all pro components', () => {
    const pros = getProComponents();
    expect(pros).toContain('combobox');
    expect(pros.length).toBe(PRO_COMPONENTS.length);
  });
});

describe('validateThemeForTier', () => {
  it('returns allowed for valid theme', () => {
    expect(validateThemeForTier('awesome', 'free')).toEqual({ allowed: true });
  });

  it('returns not allowed for pro theme on free tier', () => {
    const result = validateThemeForTier('ocean', 'free');
    expect(result.allowed).toBe(false);
    expect(result.requiredTier).toBe('pro');
    expect(result.reason).toContain('Pro tier');
  });
});

describe('validateComponentForTier', () => {
  it('returns allowed for free component', () => {
    expect(validateComponentForTier('button', 'free')).toEqual({
      allowed: true,
    });
  });

  it('returns not allowed for pro component on free tier', () => {
    const result = validateComponentForTier('combobox', 'free');
    expect(result.allowed).toBe(false);
    expect(result.requiredTier).toBe('pro');
  });

  it('returns allowed for pro component on pro tier', () => {
    expect(validateComponentForTier('combobox', 'pro')).toEqual({
      allowed: true,
    });
  });
});

describe('validateComponentsForTier', () => {
  it('validates multiple components', () => {
    const results = validateComponentsForTier(
      ['button', 'combobox', 'dialog'],
      'free'
    );
    expect(results).toHaveLength(3);
    expect(results[0].result.allowed).toBe(true);
    expect(results[1].result.allowed).toBe(false);
    expect(results[2].result.allowed).toBe(true);
  });

  it('all allowed for pro tier', () => {
    const results = validateComponentsForTier(['charts', 'combobox'], 'pro');
    expect(results.every((r) => r.result.allowed)).toBe(true);
  });
});
