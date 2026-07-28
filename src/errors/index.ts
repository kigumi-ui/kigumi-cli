/**
 * Kigumi CLI Error Classes
 *
 * Comprehensive error handling system with:
 * - Semantic exit codes (0-6)
 * - Structured error context
 * - Actionable suggestions for users
 * - Consistent formatting
 *
 * Usage:
 * ```typescript
 * import { ConfigNotFoundError } from './errors/index.js';
 *
 * throw new ConfigNotFoundError(process.cwd());
 * ```
 */

import type { OutputInterface } from '../output/types.js';

// Base error classes
import { KigumiError, UnknownError } from './base.js';

export {
  KigumiError,
  UserCancelledError,
  UnknownError,
  ErrorCode,
  type ErrorContext,
  type ErrorSuggestion,
} from './base.js';

// Configuration errors
export { ConfigNotFoundError, ConfigInvalidError } from './config.js';

// Validation errors
export { ValidationError } from './validation.js';

// Tier restriction errors
export { TierRestrictionError, ProThemeRequiredError } from './tier.js';

// layers.css rewrite errors
export { LayersCssRewriteError } from './layers-css.js';

// Network and dependency errors
export { DependencyInstallError } from './network.js';

// Community registry errors
export {
  CommunityRegistryNotFoundError,
  CommunityRegistryInvalidError,
  CommunityComponentNotFoundError,
  FrameworkMismatchError,
  CircularDependencyError,
  PathTraversalError,
} from './community-registry.js';

// Pre-flight check errors
export { PreFlightCheckError, type CheckResult } from './preflight.js';

// Version errors
export { VersionMismatchError } from './version.js';

/**
 * Error handler utility
 *
 * Use this to handle errors consistently across the CLI.
 *
 * @example
 * ```typescript
 * try {
 *   // Command logic
 * } catch (error) {
 *   handleError(error, output);
 * }
 * ```
 */
export function handleError(error: unknown, output?: OutputInterface): never {
  const kigumiError =
    error instanceof KigumiError ? error : UnknownError.from(error);

  // Output error message
  if (output && typeof output.error === 'function') {
    output.error(kigumiError.format(), kigumiError);

    // Output suggestions
    const suggestions = kigumiError.formatSuggestions();
    if (suggestions) {
      output.note('How to fix', suggestions);
    }
  } else {
    // Fallback to console
    console.error(kigumiError.format());

    const suggestions = kigumiError.formatSuggestions();
    if (suggestions) {
      console.error('\nHow to fix:');
      console.error(suggestions);
    }
  }

  // Exit with appropriate code
  process.exit(kigumiError.exitCode);
}
