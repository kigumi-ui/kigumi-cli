/**
 * Tier Validation Schema Tests
 */

import { describe, it, expect } from 'vitest';
import {
  TIER_THEMES,
  AVAILABLE_PALETTES,
  PRO_COMPONENTS,
  isThemeAllowedForTier,
  isComponentAllowedForTier,
  getAvailableThemes,
  getAvailablePalettes,
  isProComponent,
  getProComponents,
  validateThemeForTier,
  validateComponentForTier,
  validateComponentsForTier,
  paletteSchema,
  brandColorSchema,
} from '../../../src/schemas/tier.js';

describe('TIER_THEMES', () => {
  it('should define free tier themes', () => {
    expect(TIER_THEMES.free).toContain('default');
    expect(TIER_THEMES.free).toContain('awesome');
    expect(TIER_THEMES.free).toContain('shoelace');
    expect(TIER_THEMES.free).toHaveLength(3);
  });

  it('should define pro tier themes', () => {
    expect(TIER_THEMES.pro.length).toBeGreaterThan(TIER_THEMES.free.length);
    expect(TIER_THEMES.pro).toContain('default');
    expect(TIER_THEMES.pro).toContain('ocean');
    expect(TIER_THEMES.pro).toContain('forest');
  });

  it('should include all free themes in pro', () => {
    for (const theme of TIER_THEMES.free) {
      expect(TIER_THEMES.pro).toContain(theme);
    }
  });
});

describe('AVAILABLE_PALETTES', () => {
  it('should define available palettes', () => {
    expect(AVAILABLE_PALETTES).toContain('default');
    expect(AVAILABLE_PALETTES).toContain('bright');
    expect(AVAILABLE_PALETTES).toContain('warm');
    expect(AVAILABLE_PALETTES.length).toBeGreaterThan(5);
  });
});

describe('PRO_COMPONENTS', () => {
  it('should define pro components', () => {
    expect(PRO_COMPONENTS).toContain('data-grid');
    expect(PRO_COMPONENTS).toContain('charts');
    expect(PRO_COMPONENTS).toContain('date-picker');
    expect(PRO_COMPONENTS.length).toBe(8);
  });
});

describe('isThemeAllowedForTier', () => {
  it('should allow free themes for free tier', () => {
    expect(isThemeAllowedForTier('default', 'free')).toBe(true);
    expect(isThemeAllowedForTier('awesome', 'free')).toBe(true);
    expect(isThemeAllowedForTier('shoelace', 'free')).toBe(true);
  });

  it('should not allow pro themes for free tier', () => {
    expect(isThemeAllowedForTier('ocean', 'free')).toBe(false);
    expect(isThemeAllowedForTier('forest', 'free')).toBe(false);
    expect(isThemeAllowedForTier('midnight', 'free')).toBe(false);
  });

  it('should allow all themes for pro tier', () => {
    for (const theme of TIER_THEMES.pro) {
      expect(isThemeAllowedForTier(theme, 'pro')).toBe(true);
    }
  });

  it('should return false for invalid themes', () => {
    expect(isThemeAllowedForTier('invalid', 'free')).toBe(false);
    expect(isThemeAllowedForTier('invalid', 'pro')).toBe(false);
  });
});

describe('isComponentAllowedForTier', () => {
  it('should allow non-pro components for free tier', () => {
    expect(isComponentAllowedForTier('button', 'free')).toBe(true);
    expect(isComponentAllowedForTier('input', 'free')).toBe(true);
    expect(isComponentAllowedForTier('dialog', 'free')).toBe(true);
  });

  it('should not allow pro components for free tier', () => {
    expect(isComponentAllowedForTier('data-grid', 'free')).toBe(false);
    expect(isComponentAllowedForTier('charts', 'free')).toBe(false);
    expect(isComponentAllowedForTier('date-picker', 'free')).toBe(false);
  });

  it('should allow all components for pro tier', () => {
    expect(isComponentAllowedForTier('button', 'pro')).toBe(true);
    expect(isComponentAllowedForTier('data-grid', 'pro')).toBe(true);
    expect(isComponentAllowedForTier('charts', 'pro')).toBe(true);
  });
});

describe('getAvailableThemes', () => {
  it('should return free themes for free tier', () => {
    const themes = getAvailableThemes('free');
    expect(themes).toHaveLength(3);
    expect(themes).toContain('default');
    expect(themes).toContain('awesome');
  });

  it('should return all themes for pro tier', () => {
    const themes = getAvailableThemes('pro');
    expect(themes.length).toBeGreaterThan(5);
    expect(themes).toContain('ocean');
    expect(themes).toContain('forest');
  });

  it('should return a copy (not reference)', () => {
    const themes1 = getAvailableThemes('free');
    const themes2 = getAvailableThemes('free');
    expect(themes1).not.toBe(themes2);
  });
});

describe('getAvailablePalettes', () => {
  it('should return all palettes', () => {
    const palettes = getAvailablePalettes();
    expect(palettes.length).toBeGreaterThan(5);
    expect(palettes).toContain('default');
    expect(palettes).toContain('bright');
  });

  it('should return a copy', () => {
    const pal1 = getAvailablePalettes();
    const pal2 = getAvailablePalettes();
    expect(pal1).not.toBe(pal2);
  });
});

describe('isProComponent', () => {
  it('should identify pro components', () => {
    expect(isProComponent('data-grid')).toBe(true);
    expect(isProComponent('charts')).toBe(true);
    expect(isProComponent('date-picker')).toBe(true);
  });

  it('should return false for free components', () => {
    expect(isProComponent('button')).toBe(false);
    expect(isProComponent('input')).toBe(false);
    expect(isProComponent('dialog')).toBe(false);
  });
});

describe('getProComponents', () => {
  it('should return all pro components', () => {
    const components = getProComponents();
    expect(components).toHaveLength(8);
    expect(components).toContain('data-grid');
    expect(components).toContain('charts');
  });

  it('should return a copy', () => {
    const comp1 = getProComponents();
    const comp2 = getProComponents();
    expect(comp1).not.toBe(comp2);
  });
});

describe('validateThemeForTier', () => {
  it('should allow valid theme for tier', () => {
    const result = validateThemeForTier('default', 'free');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should reject pro theme for free tier', () => {
    const result = validateThemeForTier('ocean', 'free');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Pro tier');
    expect(result.requiredTier).toBe('pro');
  });

  it('should allow pro theme for pro tier', () => {
    const result = validateThemeForTier('ocean', 'pro');
    expect(result.allowed).toBe(true);
  });
});

describe('validateComponentForTier', () => {
  it('should allow free component for free tier', () => {
    const result = validateComponentForTier('button', 'free');
    expect(result.allowed).toBe(true);
  });

  it('should reject pro component for free tier', () => {
    const result = validateComponentForTier('data-grid', 'free');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Pro tier');
    expect(result.requiredTier).toBe('pro');
  });

  it('should allow all components for pro tier', () => {
    const result1 = validateComponentForTier('button', 'pro');
    expect(result1.allowed).toBe(true);

    const result2 = validateComponentForTier('data-grid', 'pro');
    expect(result2.allowed).toBe(true);
  });
});

describe('validateComponentsForTier', () => {
  it('should validate multiple components', () => {
    const components = ['button', 'data-grid', 'input'];
    const results = validateComponentsForTier(components, 'free');

    expect(results).toHaveLength(3);
    expect(results[0].component).toBe('button');
    expect(results[0].result.allowed).toBe(true);

    expect(results[1].component).toBe('data-grid');
    expect(results[1].result.allowed).toBe(false);

    expect(results[2].component).toBe('input');
    expect(results[2].result.allowed).toBe(true);
  });

  it('should allow all for pro tier', () => {
    const components = ['button', 'data-grid', 'charts'];
    const results = validateComponentsForTier(components, 'pro');

    expect(results.every((r) => r.result.allowed)).toBe(true);
  });
});

describe('paletteSchema', () => {
  it('should accept valid palettes', () => {
    expect(paletteSchema.parse('default')).toBe('default');
    expect(paletteSchema.parse('bright')).toBe('bright');
    expect(paletteSchema.parse('warm')).toBe('warm');
  });

  it('should reject invalid palettes', () => {
    expect(() => paletteSchema.parse('invalid')).toThrow();
    expect(() => paletteSchema.parse('')).toThrow();
  });
});

describe('brandColorSchema', () => {
  it('should accept valid brand colors', () => {
    expect(brandColorSchema.parse('blue')).toBe('blue');
    expect(brandColorSchema.parse('purple')).toBe('purple');
    expect(brandColorSchema.parse('green')).toBe('green');
  });

  it('should reject invalid brand colors', () => {
    expect(() => brandColorSchema.parse('invalid')).toThrow();
    expect(() => brandColorSchema.parse('cyan')).toThrow();
  });
});
