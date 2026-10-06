/**
 * Tier Restriction Error Classes
 *
 * Errors related to Free vs Pro tier restrictions
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';

/**
 * How a project moves to Pro. Tier is detected, never configured, and an
 * installed Free package wins over a token found elsewhere, so the token
 * has to go through `kigumi init`, which switches the package and .npmrc.
 */
const PRO_UPGRADE_STEPS = [
  'Get a Pro token: https://webawesome.com/pro',
  'Run: kigumi init, and enter the token when it asks (or pass --token)',
];

/**
 * Generic tier restriction error
 */
export class TierRestrictionError extends KigumiError {
  constructor(
    feature: string,
    requiredTier: 'pro',
    currentTier: 'free' | 'pro'
  ) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Upgrade to Pro tier',
        steps: [`"${feature}" requires Web Awesome Pro`, ...PRO_UPGRADE_STEPS],
      },
      {
        title: 'Or use a free alternative',
        steps: [
          'Check available free tier features',
          'Run: kigumi list to see all components',
        ],
      },
    ];

    super(
      ErrorCode.TIER_RESTRICTION,
      `Feature requires Pro tier: ${feature}`,
      { feature, requiredTier, currentTier },
      suggestions
    );
  }
}

/**
 * Pro theme required error
 */
export class ProThemeRequiredError extends KigumiError {
  constructor(themeName: string, freeThemes: string[]) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Upgrade to Pro tier',
        steps: [
          `Theme "${themeName}" requires Web Awesome Pro`,
          ...PRO_UPGRADE_STEPS,
        ],
      },
      {
        title: 'Or use a free theme',
        steps: ['Free tier themes:', ...freeThemes.map((t) => `  - ${t}`)],
      },
    ];

    super(
      ErrorCode.PRO_THEME_REQUIRED,
      `Theme requires Pro tier: ${themeName}`,
      { themeName, freeThemes },
      suggestions
    );
  }
}
