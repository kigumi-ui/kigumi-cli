/**
 * Pre-flight Check Error Classes
 *
 * Errors related to pre-execution validation checks
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';

/**
 * Check result for pre-flight checks
 */
export interface CheckResult {
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string[];
}

/**
 * Generic pre-flight check failed error
 */
export class PreFlightCheckError extends KigumiError {
  constructor(checkResults: CheckResult[]) {
    const failedChecks = checkResults.filter((r) => !r.passed);
    const errorChecks = failedChecks.filter((r) => r.severity === 'error');
    const warningChecks = failedChecks.filter((r) => r.severity === 'warning');

    const suggestions: ErrorSuggestion[] = [];

    // Add suggestions from failed checks
    for (const check of errorChecks) {
      if (check.suggestion && check.suggestion.length > 0) {
        suggestions.push({
          title: check.message,
          steps: check.suggestion,
        });
      }
    }

    // Generic suggestion if no specific ones
    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Fix the issues and try again',
        steps: failedChecks.map((c) => c.message),
      });
    }

    super(
      ErrorCode.PREFLIGHT_CHECK_FAILED,
      'Pre-flight checks failed',
      {
        totalChecks: checkResults.length,
        failedChecks: failedChecks.length,
        errors: errorChecks.length,
        warnings: warningChecks.length,
        checks: failedChecks,
      },
      suggestions
    );
  }

  format(): string {
    const { errors, warnings, checks } = this.context.details || {};
    const failedChecks = (checks || []) as CheckResult[];

    const parts = ['Pre-flight checks failed:'];
    parts.push('');

    const errorChecks = failedChecks.filter((c) => c.severity === 'error');
    if (errorChecks.length > 0) {
      parts.push(`Errors (${errorChecks.length}):`);
      errorChecks.forEach((check) => {
        parts.push(`  ✗ ${check.message}`);
      });
      parts.push('');
    }

    const warningChecks = failedChecks.filter((c) => c.severity === 'warning');
    if (warningChecks.length > 0) {
      parts.push(`Warnings (${warningChecks.length}):`);
      warningChecks.forEach((check) => {
        parts.push(`  ⚠ ${check.message}`);
      });
    }

    return parts.join('\n');
  }
}

/**
 * Missing dependency error
 */
export class MissingDependencyError extends KigumiError {
  constructor(
    dependency: string,
    context: 'package.json' | 'node_modules' | 'global',
    packageManager: string
  ) {
    const suggestions: ErrorSuggestion[] = [];

    if (context === 'node_modules') {
      suggestions.push({
        title: 'Install dependencies',
        steps: [
          `Required dependency not found: ${dependency}`,
          `Run: ${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} ${dependency}`,
          'Or run: kigumi install to install all dependencies',
        ],
      });
    } else if (context === 'package.json') {
      suggestions.push({
        title: 'Add dependency to package.json',
        steps: [
          `Dependency "${dependency}" not found in package.json`,
          `Add it manually or run: ${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} ${dependency}`,
        ],
      });
    } else {
      suggestions.push({
        title: 'Install global dependency',
        steps: [
          `Global dependency not found: ${dependency}`,
          `Install globally: npm install -g ${dependency}`,
        ],
      });
    }

    super(
      ErrorCode.MISSING_DEPENDENCY,
      `Missing dependency: ${dependency}`,
      { dependency, context, packageManager },
      suggestions
    );
  }
}

/**
 * Incompatible version error
 */
export class IncompatibleVersionError extends KigumiError {
  constructor(
    dependency: string,
    currentVersion: string,
    requiredVersion: string
  ) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Update to compatible version',
        steps: [
          `${dependency} version ${currentVersion} is not compatible`,
          `Required version: ${requiredVersion}`,
          'Update the dependency to meet the requirement',
          'Check for breaking changes before upgrading',
        ],
      },
    ];

    super(
      ErrorCode.INCOMPATIBLE_VERSION,
      `Incompatible version: ${dependency}`,
      { dependency, currentVersion, requiredVersion },
      suggestions
    );
  }
}
