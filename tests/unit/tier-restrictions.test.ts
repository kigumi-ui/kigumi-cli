/**
 * Tier Restrictions Tests
 *
 * Tests for src/utils/tier-restrictions.ts:
 * - isThemeAvailable() - Check theme availability for tier
 * - isPaletteAvailable() - Check palette availability for tier
 * - isComponentAvailable() - Check component availability for tier
 * - getAvailableThemes() - Get themes list for tier
 * - getAvailablePalettes() - Get palettes list for tier
 * - getAvailableComponents() - Get components list for tier
 */

import { describe, it, expect } from 'vitest';
import {
  isThemeAvailable,
  isPaletteAvailable,
  isComponentAvailable,
  getAvailableThemes,
  getAvailablePalettes,
  getAvailableComponents,
  TIER_RESTRICTIONS,
} from '../../src/utils/tier-restrictions.js';

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
    it('should allow all standard palettes for free tier', () => {
      expect(isPaletteAvailable('default', 'free')).toBe(true);
      expect(isPaletteAvailable('bright', 'free')).toBe(true);
      expect(isPaletteAvailable('shoelace', 'free')).toBe(true);
      expect(isPaletteAvailable('rudimentary', 'free')).toBe(true);
      expect(isPaletteAvailable('elegant', 'free')).toBe(true);
      expect(isPaletteAvailable('mild', 'free')).toBe(true);
      expect(isPaletteAvailable('natural', 'free')).toBe(true);
      expect(isPaletteAvailable('anodized', 'free')).toBe(true);
      expect(isPaletteAvailable('vogue', 'free')).toBe(true);
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
    it('should allow standard components for free tier', () => {
      expect(isComponentAvailable('button', 'free')).toBe(true);
      expect(isComponentAvailable('card', 'free')).toBe(true);
      expect(isComponentAvailable('input', 'free')).toBe(true);
      expect(isComponentAvailable('dialog', 'free')).toBe(true);
    });

    it('should deny pro-only components for free tier', () => {
      expect(isComponentAvailable('page', 'free')).toBe(false);
      expect(isComponentAvailable('charts', 'free')).toBe(false);
      expect(isComponentAvailable('combobox', 'free')).toBe(false);
      expect(isComponentAvailable('data-grid', 'free')).toBe(false);
      expect(isComponentAvailable('date-picker', 'free')).toBe(false);
      expect(isComponentAvailable('file-input', 'free')).toBe(false);
      expect(isComponentAvailable('toast', 'free')).toBe(false);
      expect(isComponentAvailable('video', 'free')).toBe(false);
    });

    it('should allow all components for pro tier', () => {
      // Standard components
      expect(isComponentAvailable('button', 'pro')).toBe(true);
      expect(isComponentAvailable('card', 'pro')).toBe(true);
      expect(isComponentAvailable('input', 'pro')).toBe(true);
      expect(isComponentAvailable('dialog', 'pro')).toBe(true);

      // Pro-only components
      expect(isComponentAvailable('page', 'pro')).toBe(true);
      expect(isComponentAvailable('charts', 'pro')).toBe(true);
      expect(isComponentAvailable('combobox', 'pro')).toBe(true);
      expect(isComponentAvailable('data-grid', 'pro')).toBe(true);
      expect(isComponentAvailable('date-picker', 'pro')).toBe(true);
      expect(isComponentAvailable('file-input', 'pro')).toBe(true);
      expect(isComponentAvailable('toast', 'pro')).toBe(true);
      expect(isComponentAvailable('video', 'pro')).toBe(true);
    });

    it('should handle case-insensitive component names', () => {
      expect(isComponentAvailable('PAGE', 'free')).toBe(false);
      expect(isComponentAvailable('Page', 'free')).toBe(false);
      expect(isComponentAvailable('PAGE', 'pro')).toBe(true);
      expect(isComponentAvailable('Page', 'pro')).toBe(true);
    });

    it('should allow unknown components (assumed free)', () => {
      expect(isComponentAvailable('unknown-component', 'free')).toBe(true);
      expect(isComponentAvailable('unknown-component', 'pro')).toBe(true);
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
    it('should return all palettes for free tier', () => {
      const palettes = getAvailablePalettes('free');

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

    it('should have same palettes for both tiers', () => {
      const freePalettes = getAvailablePalettes('free');
      const proPalettes = getAvailablePalettes('pro');

      expect(freePalettes).toEqual(proPalettes);
    });

    it('should have correct length', () => {
      expect(getAvailablePalettes('free')).toHaveLength(9);
      expect(getAvailablePalettes('pro')).toHaveLength(9);
    });
  });

  describe('getAvailableComponents', () => {
    it('should return pro-only components list for free tier', () => {
      // WHY: getAvailableComponents returns the RESTRICTED components list
      // For free tier, it returns pro-only components (what's NOT available)
      const components = getAvailableComponents('free');

      expect(components).toContain('page');
      expect(components).toContain('charts');
      expect(components).toContain('combobox');
      expect(components).toContain('data-grid');
    });

    it('should return empty list for pro tier', () => {
      // Pro has access to ALL components, so no restrictions
      const components = getAvailableComponents('pro');
      expect(components).toEqual([]);
    });
  });

  describe('TIER_RESTRICTIONS constant', () => {
    it('should have 3 free themes', () => {
      expect(TIER_RESTRICTIONS.themes.free).toHaveLength(3);
    });

    it('should have 11 pro themes (includes all free themes)', () => {
      expect(TIER_RESTRICTIONS.themes.pro).toHaveLength(11);
    });

    it('should have same 9 palettes for both tiers', () => {
      expect(TIER_RESTRICTIONS.palettes.free).toHaveLength(9);
      expect(TIER_RESTRICTIONS.palettes.pro).toHaveLength(9);
      expect(TIER_RESTRICTIONS.palettes.free).toEqual(
        TIER_RESTRICTIONS.palettes.pro
      );
    });

    it('should have 8 pro-only components', () => {
      expect(TIER_RESTRICTIONS.components.pro).toHaveLength(8);
      expect(TIER_RESTRICTIONS.components.pro).toContain('page');
      expect(TIER_RESTRICTIONS.components.pro).toContain('charts');
      expect(TIER_RESTRICTIONS.components.pro).toContain('combobox');
      expect(TIER_RESTRICTIONS.components.pro).toContain('data-grid');
      expect(TIER_RESTRICTIONS.components.pro).toContain('date-picker');
      expect(TIER_RESTRICTIONS.components.pro).toContain('file-input');
      expect(TIER_RESTRICTIONS.components.pro).toContain('toast');
      expect(TIER_RESTRICTIONS.components.pro).toContain('video');
    });
  });
});
