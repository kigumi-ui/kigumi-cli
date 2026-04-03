/**
 * Tier Restrictions
 *
 * PURPOSE: Defines which themes, palettes, and components are available for each tier.
 *
 * EXPORTS:
 * - TIER_RESTRICTIONS - Static definition of tier limitations
 * - getAvailableThemes() - Get themes for a tier
 * - getAvailablePalettes() - Get palettes for a tier
 * - isThemeAvailable() - Check if theme is available for tier
 * - isComponentAvailable() - Check if component is available for tier
 *
 * @internal - Used by init and add commands
 */

export interface TierRestrictions {
  themes: {
    free: string[];
    pro: string[];
  };
  palettes: {
    free: string[];
    pro: string[];
  };
  components: {
    free: string[];
    pro: string[];
  };
}

/**
 * Central source of truth for tier-based restrictions
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
    // CRITICAL: ALL palettes available to BOTH tiers
    free: [
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
  components: {
    free: [], // Will be dynamically populated (all components except pro-only)
    pro: [
      'charts',
      'combobox',
      'data-grid',
      'date-picker',
      'file-input',
      'number-input',
      'sparkline',
      'toast',
      'video',
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
 * Check if a component is available for a given tier
 */
export function isComponentAvailable(
  component: string,
  tier: 'free' | 'pro'
): boolean {
  const componentKey = component.toLowerCase();

  // Pro-only components
  if (TIER_RESTRICTIONS.components.pro.includes(componentKey)) {
    return tier === 'pro';
  }

  // All other components are free tier
  return true;
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

/**
 * Get list of available components for a tier
 */
export function getAvailableComponents(tier: 'free' | 'pro'): string[] {
  if (tier === 'pro') {
    // Pro tier has access to all components
    return [];
  }

  // Free tier: all except pro-only
  return TIER_RESTRICTIONS.components.pro;
}

/**
 * Get pro-only components
 */
export function getProOnlyComponents(): string[] {
  return TIER_RESTRICTIONS.components.pro;
}
