import { describe, it, expect } from 'vitest';
import {
  isThemeAvailable,
  isPaletteAvailable,
  isComponentAvailable,
  getAvailableThemes,
  getAvailablePalettes,
  getProOnlyComponents,
  TIER_RESTRICTIONS,
} from '../../src/utils/tier-restrictions.js';

describe('Tier Restrictions', () => {
  describe('Theme Restrictions', () => {
    it('should have 3 free tier themes', () => {
      expect(TIER_RESTRICTIONS.themes.free).toHaveLength(3);
      expect(TIER_RESTRICTIONS.themes.free).toEqual([
        'default',
        'awesome',
        'shoelace',
      ]);
    });

    it('should have 11 pro tier themes', () => {
      expect(TIER_RESTRICTIONS.themes.pro).toHaveLength(11);
    });

    it('free tier should have access to default, awesome, shoelace', () => {
      expect(isThemeAvailable('default', 'free')).toBe(true);
      expect(isThemeAvailable('awesome', 'free')).toBe(true);
      expect(isThemeAvailable('shoelace', 'free')).toBe(true);
    });

    it('free tier should NOT have access to pro themes', () => {
      expect(isThemeAvailable('brutalist', 'free')).toBe(false);
      expect(isThemeAvailable('glossy', 'free')).toBe(false);
      expect(isThemeAvailable('matter', 'free')).toBe(false);
      expect(isThemeAvailable('mellow', 'free')).toBe(false);
      expect(isThemeAvailable('playful', 'free')).toBe(false);
      expect(isThemeAvailable('premium', 'free')).toBe(false);
      expect(isThemeAvailable('tailspin', 'free')).toBe(false);
      expect(isThemeAvailable('active', 'free')).toBe(false);
    });

    it('pro tier should have access to all themes', () => {
      expect(isThemeAvailable('default', 'pro')).toBe(true);
      expect(isThemeAvailable('awesome', 'pro')).toBe(true);
      expect(isThemeAvailable('shoelace', 'pro')).toBe(true);
      expect(isThemeAvailable('brutalist', 'pro')).toBe(true);
      expect(isThemeAvailable('glossy', 'pro')).toBe(true);
      expect(isThemeAvailable('matter', 'pro')).toBe(true);
      expect(isThemeAvailable('mellow', 'pro')).toBe(true);
      expect(isThemeAvailable('playful', 'pro')).toBe(true);
      expect(isThemeAvailable('premium', 'pro')).toBe(true);
      expect(isThemeAvailable('tailspin', 'pro')).toBe(true);
      expect(isThemeAvailable('active', 'pro')).toBe(true);
    });

    it('both tiers should have access to "none" and "custom"', () => {
      expect(isThemeAvailable('none', 'free')).toBe(true);
      expect(isThemeAvailable('none', 'pro')).toBe(true);
      expect(isThemeAvailable('custom', 'free')).toBe(true);
      expect(isThemeAvailable('custom', 'pro')).toBe(true);
    });

    it('getAvailableThemes should include none and custom', () => {
      const freeThemes = getAvailableThemes('free');
      const proThemes = getAvailableThemes('pro');

      expect(freeThemes).toContain('none');
      expect(freeThemes).toContain('custom');
      expect(proThemes).toContain('none');
      expect(proThemes).toContain('custom');
    });

    it('getAvailableThemes free should return 5 options (3 themes + none + custom)', () => {
      const freeThemes = getAvailableThemes('free');
      expect(freeThemes).toHaveLength(5);
    });

    it('getAvailableThemes pro should return 13 options (11 themes + none + custom)', () => {
      const proThemes = getAvailableThemes('pro');
      expect(proThemes).toHaveLength(13);
    });
  });

  describe('Palette Restrictions', () => {
    it('should have 9 palettes in free tier', () => {
      expect(TIER_RESTRICTIONS.palettes.free).toHaveLength(9);
    });

    it('should have 9 palettes in pro tier', () => {
      expect(TIER_RESTRICTIONS.palettes.pro).toHaveLength(9);
    });

    it('CRITICAL: all palettes should be available to FREE tier', () => {
      const palettes = [
        'default',
        'bright',
        'shoelace',
        'rudimentary',
        'elegant',
        'mild',
        'natural',
        'anodized',
        'vogue',
      ];

      for (const palette of palettes) {
        expect(isPaletteAvailable(palette, 'free')).toBe(true);
      }
    });

    it('all palettes should be available to pro tier', () => {
      const palettes = [
        'default',
        'bright',
        'shoelace',
        'rudimentary',
        'elegant',
        'mild',
        'natural',
        'anodized',
        'vogue',
      ];

      for (const palette of palettes) {
        expect(isPaletteAvailable(palette, 'pro')).toBe(true);
      }
    });

    it('both tiers should have access to "custom" palette', () => {
      expect(isPaletteAvailable('custom', 'free')).toBe(true);
      expect(isPaletteAvailable('custom', 'pro')).toBe(true);
    });

    it('free and pro palettes should be identical', () => {
      expect(TIER_RESTRICTIONS.palettes.free).toEqual(
        TIER_RESTRICTIONS.palettes.pro
      );
    });

    it('getAvailablePalettes should include custom', () => {
      const freePalettes = getAvailablePalettes('free');
      const proPalettes = getAvailablePalettes('pro');

      expect(freePalettes).toContain('custom');
      expect(proPalettes).toContain('custom');
    });

    it('getAvailablePalettes should return 10 options (9 palettes + custom)', () => {
      const freePalettes = getAvailablePalettes('free');
      const proPalettes = getAvailablePalettes('pro');

      expect(freePalettes).toHaveLength(10);
      expect(proPalettes).toHaveLength(10);
    });
  });

  describe('Component Restrictions', () => {
    it('should have 8 pro-only components', () => {
      const proComponents = getProOnlyComponents();
      expect(proComponents).toHaveLength(8);
      expect(proComponents).toEqual([
        'page',
        'charts',
        'combobox',
        'data-grid',
        'date-picker',
        'file-input',
        'toast',
        'video',
      ]);
    });

    it('free tier should NOT have access to pro-only components', () => {
      expect(isComponentAvailable('page', 'free')).toBe(false);
      expect(isComponentAvailable('charts', 'free')).toBe(false);
      expect(isComponentAvailable('combobox', 'free')).toBe(false);
      expect(isComponentAvailable('data-grid', 'free')).toBe(false);
      expect(isComponentAvailable('date-picker', 'free')).toBe(false);
      expect(isComponentAvailable('file-input', 'free')).toBe(false);
      expect(isComponentAvailable('toast', 'free')).toBe(false);
      expect(isComponentAvailable('video', 'free')).toBe(false);
    });

    it('pro tier should have access to pro-only components', () => {
      expect(isComponentAvailable('page', 'pro')).toBe(true);
      expect(isComponentAvailable('charts', 'pro')).toBe(true);
      expect(isComponentAvailable('combobox', 'pro')).toBe(true);
      expect(isComponentAvailable('data-grid', 'pro')).toBe(true);
      expect(isComponentAvailable('date-picker', 'pro')).toBe(true);
      expect(isComponentAvailable('file-input', 'pro')).toBe(true);
      expect(isComponentAvailable('toast', 'pro')).toBe(true);
      expect(isComponentAvailable('video', 'pro')).toBe(true);
    });

    it('free components should be available to free tier', () => {
      expect(isComponentAvailable('button', 'free')).toBe(true);
      expect(isComponentAvailable('input', 'free')).toBe(true);
      expect(isComponentAvailable('card', 'free')).toBe(true);
      expect(isComponentAvailable('badge', 'free')).toBe(true);
      expect(isComponentAvailable('avatar', 'free')).toBe(true);
    });

    it('free components should be available to pro tier', () => {
      expect(isComponentAvailable('button', 'pro')).toBe(true);
      expect(isComponentAvailable('input', 'pro')).toBe(true);
      expect(isComponentAvailable('card', 'pro')).toBe(true);
      expect(isComponentAvailable('badge', 'pro')).toBe(true);
      expect(isComponentAvailable('avatar', 'pro')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isComponentAvailable('Page', 'free')).toBe(false);
      expect(isComponentAvailable('PAGE', 'free')).toBe(false);
      expect(isComponentAvailable('Button', 'free')).toBe(true);
      expect(isComponentAvailable('BUTTON', 'free')).toBe(true);
    });
  });
});
