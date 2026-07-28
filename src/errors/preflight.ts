/**
 * Pre-flight Check Error Classes
 *
 * Errors related to pre-execution validation checks
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';
import { CheckSeverity, type CheckResult } from '../checks/types.js';

// Re-export CheckResult for backward compatibility
export type { CheckResult };

/**
 * Generic pre-flight check failed error
 */
export class PreFlightCheckError extends KigumiError {
  constructor(checkResults: CheckResult[]) {
    const failedChecks = checkResults.filter((r) => !r.passed);
    const errorChecks = failedChecks.filter(
      (r) => r.severity === CheckSeverity.ERROR
    );
    const warningChecks = failedChecks.filter(
      (r) => r.severity === CheckSeverity.WARNING
    );

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
    const {
      errors: _errors,
      warnings: _warnings,
      checks,
    } = this.context.details || {};
    const failedChecks = (checks || []) as CheckResult[];

    const parts = ['Pre-flight checks failed:'];
    parts.push('');

    const errorChecks = failedChecks.filter(
      (c) => c.severity === CheckSeverity.ERROR
    );
    if (errorChecks.length > 0) {
      parts.push(`Errors (${errorChecks.length}):`);
      errorChecks.forEach((check) => {
        parts.push(`  ✗ ${check.message}`);
      });
      parts.push('');
    }

    const warningChecks = failedChecks.filter(
      (c) => c.severity === CheckSeverity.WARNING
    );
    if (warningChecks.length > 0) {
      parts.push(`Warnings (${warningChecks.length}):`);
      warningChecks.forEach((check) => {
        parts.push(`  ⚠ ${check.message}`);
      });
    }

    return parts.join('\n');
  }
}
