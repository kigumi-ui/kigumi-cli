/**
 * Tier Validation Schemas
 *
 * Validation logic for Free vs Pro tier restrictions
 */

import { z } from 'zod';
import type { Tier } from './config.js';

/**
 * Available themes per tier
 */
export const TIER_THEMES = {
  free: ['default', 'awesome', 'shoelace'],
  pro: [
    'default',
    'awesome',
    'shoelace',
    'ocean',
    'forest',
    'sunset',
    'midnight',
    'candy',
    'corporate',
    'minimal',
    'vibrant',
  ],
} as const;

/**
 * All palettes are available to both tiers
 */
export const AVAILABLE_PALETTES = [
  'default',
  'bright',
  'warm',
  'cool',
  'shoelace',
  'ocean',
  'forest',
  'sunset',
  'candy',
] as const;

/**
 * Available brand colors
 */
export const AVAILABLE_BRAND_COLORS = [
  'blue',
  'purple',
  'green',
  'red',
  'orange',
  'yellow',
  'pink',
  'gray',
] as const;

/**
 * Pro-only components
 */
export const PRO_COMPONENTS = [
  'page',
  'charts',
  'combobox',
  'data-grid',
  'date-picker',
  'file-input',
  'toast',
  'video',
] as const;

/**
 * Theme schema with tier validation
 */
export function createThemeSchema(tier: Tier) {
  const allowedThemes = TIER_THEMES[tier];

  return z.string().refine(
    (theme) => allowedThemes.includes(theme as any),
    {
      message: `Theme must be one of: ${allowedThemes.join(', ')} (available in ${tier} tier)`,
    }
  );
}

/**
 * Palette schema (all tiers)
 */
export const paletteSchema = z.enum(AVAILABLE_PALETTES, {
  errorMap: () => ({
    message: `Palette must be one of: ${AVAILABLE_PALETTES.join(', ')}`,
  }),
});

/**
 * Brand color schema
 */
export const brandColorSchema = z.enum(AVAILABLE_BRAND_COLORS, {
  errorMap: () => ({
    message: `Brand color must be one of: ${AVAILABLE_BRAND_COLORS.join(', ')}`,
  }),
});

/**
 * Component name schema (basic validation)
 */
export const componentNameSchema = z.string().min(1, 'Component name cannot be empty');

/**
 * Validate theme for tier
 *
 * @param theme - Theme name to validate
 * @param tier - User's tier (free or pro)
 * @returns True if theme is allowed
 */
export function isThemeAllowedForTier(theme: string, tier: Tier): boolean {
  return TIER_THEMES[tier].includes(theme as any);
}

/**
 * Validate component for tier
 *
 * @param componentName - Component name to validate
 * @param tier - User's tier (free or pro)
 * @returns True if component is allowed
 */
export function isComponentAllowedForTier(componentName: string, tier: Tier): boolean {
  if (tier === 'pro') {
    return true; // Pro tier has access to everything
  }

  // Free tier cannot use pro components
  return !PRO_COMPONENTS.includes(componentName as any);
}

/**
 * Get available themes for tier
 *
 * @param tier - User's tier
 * @returns Array of available theme names
 */
export function getAvailableThemes(tier: Tier): string[] {
  return [...TIER_THEMES[tier]];
}

/**
 * Get available palettes (same for all tiers)
 *
 * @returns Array of available palette names
 */
export function getAvailablePalettes(): string[] {
  return [...AVAILABLE_PALETTES];
}

/**
 * Get available brand colors
 *
 * @returns Array of available brand colors
 */
export function getAvailableBrandColors(): string[] {
  return [...AVAILABLE_BRAND_COLORS];
}

/**
 * Check if component requires Pro tier
 *
 * @param componentName - Component name to check
 * @returns True if component requires Pro tier
 */
export function isProComponent(componentName: string): boolean {
  return PRO_COMPONENTS.includes(componentName as any);
}

/**
 * Get all Pro components
 *
 * @returns Array of Pro component names
 */
export function getProComponents(): string[] {
  return [...PRO_COMPONENTS];
}

/**
 * Tier validation result
 */
export interface TierValidationResult {
  allowed: boolean;
  reason?: string;
  requiredTier?: 'pro';
}

/**
 * Validate theme selection for tier
 *
 * @param theme - Theme name
 * @param tier - User's tier
 * @returns Validation result
 */
export function validateThemeForTier(theme: string, tier: Tier): TierValidationResult {
  if (isThemeAllowedForTier(theme, tier)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Theme "${theme}" requires Pro tier`,
    requiredTier: 'pro',
  };
}

/**
 * Validate component selection for tier
 *
 * @param componentName - Component name
 * @param tier - User's tier
 * @returns Validation result
 */
export function validateComponentForTier(
  componentName: string,
  tier: Tier
): TierValidationResult {
  if (isComponentAllowedForTier(componentName, tier)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Component "${componentName}" requires Pro tier`,
    requiredTier: 'pro',
  };
}

/**
 * Validate multiple components for tier
 *
 * @param componentNames - Array of component names
 * @param tier - User's tier
 * @returns Array of validation results with component names
 */
export function validateComponentsForTier(
  componentNames: string[],
  tier: Tier
): Array<{ component: string; result: TierValidationResult }> {
  return componentNames.map((component) => ({
    component,
    result: validateComponentForTier(component, tier),
  }));
}
