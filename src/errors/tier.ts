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
          'Add your Pro token to .env: WA_TOKEN=your-token',
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
 * Pro component required error
 */
export class ProComponentRequiredError extends KigumiError {
  constructor(componentName: string, freeAlternatives?: string[]) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Upgrade to Pro tier',
        steps: [
          `Component "${componentName}" requires Web Awesome Pro`,
          'Visit: https://webawesome.com/pro',
          'Sign up for a Pro account',
          'Update kigumi-components.json: "tier": "pro"',
          'Add your Pro token to .env: WA_TOKEN=your-token',
        ],
      },
    ];

    if (freeAlternatives && freeAlternatives.length > 0) {
      suggestions.push({
        title: 'Or use a free alternative',
        steps: [
          'Free tier alternatives:',
          ...freeAlternatives.map((c) => `  - ${c}`),
        ],
      });
    }

    super(
      ErrorCode.PRO_COMPONENT_REQUIRED,
      `Component requires Pro tier: ${componentName}`,
      { componentName, freeAlternatives },
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
          'Update kigumi-components.json: "tier": "pro"',
          'Add your Pro token to .env: WA_TOKEN=your-token',
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

/**
 * Token required error
 */
export class TokenRequiredError extends KigumiError {
  constructor() {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Add your Pro token',
        steps: [
          'Get your token from: https://webawesome.com/pro',
          'Sign in to your Web Awesome account',
          'Navigate to Settings → API Tokens',
          'Generate a new token',
          'Add to .env file: WA_TOKEN=your-token',
        ],
      },
      {
        title: 'For team members',
        steps: [
          'Ask your team lead for the shared Pro token',
          'Add the token to your .env file',
          'Make sure .env is in .gitignore (security!)',
        ],
      },
    ];

    super(
      ErrorCode.TOKEN_REQUIRED,
      'Pro tier token is required but not found',
      { envVar: 'WA_TOKEN', checked: ['.env', 'process.env.WA_TOKEN'] },
      suggestions
    );
  }
}

/**
 * Token invalid error
 */
export class TokenInvalidError extends KigumiError {
  constructor(statusCode?: number, message?: string) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Check your Pro token',
        steps: [
          'Verify your token is correct in .env',
          'Make sure there are no extra spaces or quotes',
          "Check that the token hasn't expired",
          'Get a new token from: https://webawesome.com/pro',
        ],
      },
      {
        title: 'Authentication failed',
        steps: [
          ...(statusCode === 401
            ? ['Your token was rejected (401 Unauthorized)']
            : []),
          ...(message ? [`Error: ${message}`] : []),
          'Verify you have an active Pro subscription',
          'Contact support if the issue persists',
        ],
      },
    ];

    super(
      ErrorCode.TOKEN_INVALID,
      'Pro tier token is invalid or expired',
      { statusCode, message },
      suggestions
    );
  }
}
