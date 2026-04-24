/**
 * Tier Restrictions Tests
 *
 * Tests for src/utils/tier-restrictions.ts:
 * - isThemeAvailable() - Check theme availability for tier
 * - isPaletteAvailable() - Check palette availability for tier
 * - isComponentAvailable() - Check component availability for tier (reads registry)
 * - getAvailableThemes() - Get themes list for tier
 * - getAvailablePalettes() - Get palettes list for tier
 *
 * The component check reads `component.tier` directly from the registry
 * in `src/utils/registry.ts`, so there is only one source of truth.
 * Drift between the registry and the filter is impossible by construction.
 */

import { describe, it, expect } from 'vitest';
import {
  isThemeAvailable,
  isPaletteAvailable,
  isComponentAvailable,
  getAvailableThemes,
  getAvailablePalettes,
  TIER_RESTRICTIONS,
} from '../../src/utils/tier-restrictions.js';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';

describe('tier restrictions', () => {
  describe('isThemeAvailable', () => {
    it('should allow free themes for free tier', () => {
      expect(isThemeAvailable('default', 'free')).toBe(true);
      expect(isThemeAvailable('awesome', 'free')).toBe(true);
      expect(isThemeAvailable('shoelace', 'free')).toBe(true);
    });

    it('should deny pro themes for free tier', () => {
      expect(isThemeAvailable('brutalist', 'free')).toBe(false);
      expect(isThemeAvailable('glossy', 'free')).toBe(false);
      expect(isThemeAvailable('matter', 'free')).toBe(false);
      expect(isThemeAvailable('mellow', 'free')).toBe(false);
      expect(isThemeAvailable('playful', 'free')).toBe(false);
      expect(isThemeAvailable('premium', 'free')).toBe(false);
      expect(isThemeAvailable('tailspin', 'free')).toBe(false);
      expect(isThemeAvailable('active', 'free')).toBe(false);
    });

    it('should allow all themes for pro tier', () => {
      // Free themes
      expect(isThemeAvailable('default', 'pro')).toBe(true);
      expect(isThemeAvailable('awesome', 'pro')).toBe(true);
      expect(isThemeAvailable('shoelace', 'pro')).toBe(true);

      // Pro themes
      expect(isThemeAvailable('brutalist', 'pro')).toBe(true);
      expect(isThemeAvailable('glossy', 'pro')).toBe(true);
      expect(isThemeAvailable('matter', 'pro')).toBe(true);
      expect(isThemeAvailable('mellow', 'pro')).toBe(true);
      expect(isThemeAvailable('playful', 'pro')).toBe(true);
      expect(isThemeAvailable('premium', 'pro')).toBe(true);
      expect(isThemeAvailable('tailspin', 'pro')).toBe(true);
      expect(isThemeAvailable('active', 'pro')).toBe(true);
    });

    it('should allow "none" theme for both tiers', () => {
      expect(isThemeAvailable('none', 'free')).toBe(true);
      expect(isThemeAvailable('none', 'pro')).toBe(true);
    });

    it('should deny "custom" theme (not in standard themes)', () => {
      // "custom" is not a built-in theme - users should use theme.css for customization
      expect(isThemeAvailable('custom', 'free')).toBe(false);
      expect(isThemeAvailable('custom', 'pro')).toBe(false);
    });

    it('should deny unknown themes', () => {
      expect(isThemeAvailable('unknown-theme', 'free')).toBe(false);
      expect(isThemeAvailable('unknown-theme', 'pro')).toBe(false);
    });
  });

  describe('isPaletteAvailable', () => {
    it('should allow free palettes for free tier', () => {
      expect(isPaletteAvailable('default', 'free')).toBe(true);
      expect(isPaletteAvailable('bright', 'free')).toBe(true);
      expect(isPaletteAvailable('shoelace', 'free')).toBe(true);
    });

    it('should deny pro palettes for free tier', () => {
      expect(isPaletteAvailable('rudimentary', 'free')).toBe(false);
      expect(isPaletteAvailable('elegant', 'free')).toBe(false);
      expect(isPaletteAvailable('mild', 'free')).toBe(false);
      expect(isPaletteAvailable('natural', 'free')).toBe(false);
      expect(isPaletteAvailable('anodized', 'free')).toBe(false);
      expect(isPaletteAvailable('vogue', 'free')).toBe(false);
    });

    it('should allow all standard palettes for pro tier', () => {
      expect(isPaletteAvailable('default', 'pro')).toBe(true);
      expect(isPaletteAvailable('bright', 'pro')).toBe(true);
      expect(isPaletteAvailable('shoelace', 'pro')).toBe(true);
      expect(isPaletteAvailable('rudimentary', 'pro')).toBe(true);
      expect(isPaletteAvailable('elegant', 'pro')).toBe(true);
      expect(isPaletteAvailable('mild', 'pro')).toBe(true);
      expect(isPaletteAvailable('natural', 'pro')).toBe(true);
      expect(isPaletteAvailable('anodized', 'pro')).toBe(true);
      expect(isPaletteAvailable('vogue', 'pro')).toBe(true);
    });

    it('should deny "custom" palette (not in standard palettes)', () => {
      // "custom" is not a built-in palette - users should use theme.css for customization
      expect(isPaletteAvailable('custom', 'free')).toBe(false);
      expect(isPaletteAvailable('custom', 'pro')).toBe(false);
    });

    it('should deny unknown palettes', () => {
      expect(isPaletteAvailable('unknown-palette', 'free')).toBe(false);
      expect(isPaletteAvailable('unknown-palette', 'pro')).toBe(false);
    });
  });

  describe('isComponentAvailable', () => {
    it('should allow free-tier components on free tier', () => {
      expect(isComponentAvailable('button', 'free')).toBe(true);
      expect(isComponentAvailable('card', 'free')).toBe(true);
      expect(isComponentAvailable('input', 'free')).toBe(true);
      expect(isComponentAvailable('dialog', 'free')).toBe(true);
    });

    it('should deny pro-tier components on free tier', () => {
      // Every component below is marked `tier: 'pro'` in LOCAL_REGISTRY.
      // Use the actual registry keys, not the hardcoded names from the old
      // TIER_RESTRICTIONS.components.pro list.
      expect(isComponentAvailable('combobox', 'free')).toBe(false);
      expect(isComponentAvailable('file-input', 'free')).toBe(false);
      expect(isComponentAvailable('number-input', 'free')).toBe(false);
      expect(isComponentAvailable('sparkline', 'free')).toBe(false);
      expect(isComponentAvailable('toast', 'free')).toBe(false);
      expect(isComponentAvailable('toast-item', 'free')).toBe(false);
      expect(isComponentAvailable('chart', 'free')).toBe(false);
      expect(isComponentAvailable('bar-chart', 'free')).toBe(false);
      expect(isComponentAvailable('line-chart', 'free')).toBe(false);
      expect(isComponentAvailable('bubble-chart', 'free')).toBe(false);
      expect(isComponentAvailable('doughnut-chart', 'free')).toBe(false);
      expect(isComponentAvailable('pie-chart', 'free')).toBe(false);
      expect(isComponentAvailable('polar-area-chart', 'free')).toBe(false);
      expect(isComponentAvailable('radar-chart', 'free')).toBe(false);
      expect(isComponentAvailable('scatter-chart', 'free')).toBe(false);
    });

    it('should allow all components on pro tier', () => {
      // Standard components
      expect(isComponentAvailable('button', 'pro')).toBe(true);
      expect(isComponentAvailable('card', 'pro')).toBe(true);
      expect(isComponentAvailable('input', 'pro')).toBe(true);
      expect(isComponentAvailable('dialog', 'pro')).toBe(true);

      // Pro-tier components
      expect(isComponentAvailable('combobox', 'pro')).toBe(true);
      expect(isComponentAvailable('bar-chart', 'pro')).toBe(true);
      expect(isComponentAvailable('toast-item', 'pro')).toBe(true);
    });

    it('should be case-insensitive for component names', () => {
      // getComponent() in the registry lowercases the name internally
      expect(isComponentAvailable('BAR-CHART', 'free')).toBe(false);
      expect(isComponentAvailable('Bar-Chart', 'free')).toBe(false);
      expect(isComponentAvailable('BAR-CHART', 'pro')).toBe(true);
      expect(isComponentAvailable('Bar-Chart', 'pro')).toBe(true);
    });

    it('should return true for unknown components (defers to existence check)', () => {
      // Contract: unknown component → true, so that the upstream
      // hasComponent() check in validator.ts throws the correct
      // "Component not found" error instead of a misleading
      // "Pro required" error.
      expect(isComponentAvailable('unknown-component', 'free')).toBe(true);
      expect(isComponentAvailable('unknown-component', 'pro')).toBe(true);
      expect(isComponentAvailable('buton', 'free')).toBe(true); // typo
    });

    it('REGRESSION: bar-chart is Pro-only on Free tier', () => {
      // This is the user's originally observed bug (2026-04-09):
      // running `npx kigumi add` on a Free-tier repo showed BarChart
      // in the selector. The old TIER_RESTRICTIONS.components.pro
      // list had "charts" (plural) but the registry key is "bar-chart",
      // so the filter missed it. This test names the regression so
      // git blame makes the history obvious.
      expect(isComponentAvailable('bar-chart', 'free')).toBe(false);
    });

    describe('registry drift guard', () => {
      // These tests iterate the registry to guarantee that the filter
      // matches the registry's tier field for every entry. If anyone
      // ever reintroduces a parallel hardcoded list and it drifts,
      // these tests fail loudly.

      it('every pro component in LOCAL_REGISTRY is denied on free tier', () => {
        const proComponents = Object.entries(LOCAL_REGISTRY).filter(
          ([, def]) => def.tier === 'pro'
        );
        expect(proComponents.length).toBeGreaterThan(0); // sanity check
        for (const [key] of proComponents) {
          expect(
            isComponentAvailable(key, 'free'),
            `Pro component "${key}" should be denied on free tier`
          ).toBe(false);
        }
      });

      it('every free component in LOCAL_REGISTRY is allowed on free tier', () => {
        const freeComponents = Object.entries(LOCAL_REGISTRY).filter(
          ([, def]) => def.tier === 'free'
        );
        expect(freeComponents.length).toBeGreaterThan(0); // sanity check
        for (const [key] of freeComponents) {
          expect(
            isComponentAvailable(key, 'free'),
            `Free component "${key}" should be allowed on free tier`
          ).toBe(true);
        }
      });

      it('every component in LOCAL_REGISTRY is allowed on pro tier', () => {
        for (const [key] of Object.entries(LOCAL_REGISTRY)) {
          expect(
            isComponentAvailable(key, 'pro'),
            `Component "${key}" should be allowed on pro tier`
          ).toBe(true);
        }
      });
    });
  });

  describe('getAvailableThemes', () => {
    it('should return free themes for free tier', () => {
      const themes = getAvailableThemes('free');

      expect(themes).toContain('none');
      expect(themes).toContain('default');
      expect(themes).toContain('awesome');
      expect(themes).toContain('shoelace');

      // Should NOT contain pro themes
      expect(themes).not.toContain('brutalist');
      expect(themes).not.toContain('glossy');
    });

    it('should return all themes for pro tier', () => {
      const themes = getAvailableThemes('pro');

      expect(themes).toContain('none');
      expect(themes).toContain('default');
      expect(themes).toContain('awesome');
      expect(themes).toContain('shoelace');
      expect(themes).toContain('brutalist');
      expect(themes).toContain('glossy');
      expect(themes).toContain('matter');
      expect(themes).toContain('mellow');
      expect(themes).toContain('playful');
      expect(themes).toContain('premium');
      expect(themes).toContain('tailspin');
      expect(themes).toContain('active');
    });

    it('should always start with "none"', () => {
      expect(getAvailableThemes('free')[0]).toBe('none');
      expect(getAvailableThemes('pro')[0]).toBe('none');
    });

    it('should have correct length', () => {
      // Free: none + 3 themes = 4
      expect(getAvailableThemes('free')).toHaveLength(4);
      // Pro: none + 11 themes = 12
      expect(getAvailableThemes('pro')).toHaveLength(12);
    });
  });

  describe('getAvailablePalettes', () => {
    it('should return only free palettes for free tier', () => {
      const palettes = getAvailablePalettes('free');

      expect(palettes).toEqual(['default', 'bright', 'shoelace']);
    });

    it('should return all palettes for pro tier', () => {
      const palettes = getAvailablePalettes('pro');

      expect(palettes).toContain('default');
      expect(palettes).toContain('bright');
      expect(palettes).toContain('shoelace');
      expect(palettes).toContain('rudimentary');
      expect(palettes).toContain('elegant');
      expect(palettes).toContain('mild');
      expect(palettes).toContain('natural');
      expect(palettes).toContain('anodized');
      expect(palettes).toContain('vogue');
    });

    it('should have pro as a superset of free', () => {
      const freePalettes = getAvailablePalettes('free');
      const proPalettes = getAvailablePalettes('pro');

      for (const palette of freePalettes) {
        expect(proPalettes).toContain(palette);
      }
    });

    it('should have correct length per tier', () => {
      expect(getAvailablePalettes('free')).toHaveLength(3);
      expect(getAvailablePalettes('pro')).toHaveLength(9);
    });
  });

  describe('TIER_RESTRICTIONS constant', () => {
    it('should have 3 free themes', () => {
      expect(TIER_RESTRICTIONS.themes.free).toHaveLength(3);
    });

    it('should have 11 pro themes (includes all free themes)', () => {
      expect(TIER_RESTRICTIONS.themes.pro).toHaveLength(11);
    });

    it('should have 3 free palettes', () => {
      expect(TIER_RESTRICTIONS.palettes.free).toHaveLength(3);
    });

    it('should have 9 pro palettes (superset of free)', () => {
      expect(TIER_RESTRICTIONS.palettes.pro).toHaveLength(9);
      for (const palette of TIER_RESTRICTIONS.palettes.free) {
        expect(TIER_RESTRICTIONS.palettes.pro).toContain(palette);
      }
    });

    it('should NOT have a components field (deleted in favor of registry)', () => {
      // Components are tracked per-entry in LOCAL_REGISTRY, not here.
      // If someone re-adds a `.components` field, they are re-introducing
      // the drift source this spec was created to eliminate.
      expect(
        (TIER_RESTRICTIONS as Record<string, unknown>).components
      ).toBeUndefined();
    });
  });
});
