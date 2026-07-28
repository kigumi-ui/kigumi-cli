/**
 * Tier Restriction Error Classes
 *
 * Errors related to Free vs Pro tier restrictions
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';

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
        steps: [
          `"${feature}" requires Web Awesome Pro`,
          'Visit: https://webawesome.com/pro',
          'Sign up for a Pro account',
          'Update your configuration: tier: "pro"',
          'Add your Pro token to .env: WEBAWESOME_NPM_TOKEN=your-token',
        ],
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
          'Visit: https://webawesome.com/pro',
          'Sign up for a Pro account',
          'Update kigumi.config.json: "tier": "pro"',
          'Add your Pro token to .env: WEBAWESOME_NPM_TOKEN=your-token',
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
