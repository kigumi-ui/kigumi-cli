/**
 * Tier Restrictions
 *
 * PURPOSE: Defines which themes and palettes are available for each tier.
 *
 * For **component** tier checks, use `isComponentAvailable()`, which reads
 * `component.tier` directly from the registry (`src/utils/registry.ts`).
 * The registry is the single source of truth for component tier.
 *
 * EXPORTS:
 * - TIER_RESTRICTIONS - Static definition of theme/palette tier limitations
 * - getAvailableThemes() - Get themes for a tier
 * - getAvailablePalettes() - Get palettes for a tier
 * - isThemeAvailable() - Check if theme is available for tier
 * - isPaletteAvailable() - Check if palette is available for tier
 * - isComponentAvailable() - Check if component is available for tier (reads registry)
 *
 * @internal - Used by init and add commands
 */

import { getComponent } from './registry.js';

export interface TierRestrictions {
  themes: {
    free: string[];
    pro: string[];
  };
  palettes: {
    free: string[];
    pro: string[];
  };
}

/**
 * Central source of truth for theme and palette tier restrictions.
 *
 * Note: Component tier restrictions are NOT listed here. They come from
 * the registry (`src/utils/registry.ts`), where each component has its
 * own `tier` field. See `isComponentAvailable()` below.
 */
export const TIER_RESTRICTIONS: TierRestrictions = {
  themes: {
    free: ['default', 'awesome', 'shoelace'],
    pro: [
      'default',
      'awesome',
      'shoelace',
      'brutalist',
      'glossy',
      'matter',
      'mellow',
      'playful',
      'premium',
      'tailspin',
      'active',
    ],
  },
  palettes: {
    free: ['default', 'bright', 'shoelace'],
    pro: [
      'default',
      'bright',
      'shoelace',
      'rudimentary',
      'elegant',
      'mild',
      'natural',
      'anodized',
      'vogue',
    ],
  },
};

/**
 * Check if a theme is available for a given tier
 */
export function isThemeAvailable(theme: string, tier: 'free' | 'pro'): boolean {
  if (theme === 'none') {
    return true;
  }
  return TIER_RESTRICTIONS.themes[tier].includes(theme);
}

/**
 * Check if a palette is available for a given tier
 */
export function isPaletteAvailable(
  palette: string,
  tier: 'free' | 'pro'
): boolean {
  return TIER_RESTRICTIONS.palettes[tier].includes(palette);
}

/**
 * Check if a component is available for a given tier.
 *
 * Reads `component.tier` from the registry (`src/utils/registry.ts`),
 * which is the single source of truth. Drift is impossible by construction.
 *
 * @precondition The component should exist in the registry. Callers should
 *               check `hasComponent()` first so that the existence error
 *               takes precedence over a misleading "Pro required" error.
 *               For unknown components, this function returns `true` to
 *               defer to the upstream existence check.
 */
export function isComponentAvailable(
  component: string,
  tier: 'free' | 'pro'
): boolean {
  const def = getComponent(component);
  if (!def) {
    // Unknown component: defer to the upstream existence check
    // (validator.ts calls hasComponent() first and throws ValidationError).
    return true;
  }
  return tier === 'pro' || def.tier === 'free';
}

/**
 * Get list of available themes for a tier
 */
export function getAvailableThemes(tier: 'free' | 'pro'): string[] {
  return ['none', ...TIER_RESTRICTIONS.themes[tier]];
}

/**
 * Get list of available palettes for a tier
 */
export function getAvailablePalettes(tier: 'free' | 'pro'): string[] {
  return TIER_RESTRICTIONS.palettes[tier];
}
