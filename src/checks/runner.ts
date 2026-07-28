/**
 * Check Runner
 *
 * Orchestrates execution of pre-flight checks
 */

import type { Check, CheckContext, CheckResult } from './types.js';
import { CheckSeverity } from './types.js';

/**
 * Check runner options
 */
export interface CheckRunnerOptions {
  /**
   * Stop on first error (default: true)
   */
  stopOnError?: boolean;
}

/**
 * Check runner
 *
 * Executes checks and collects results
 */
export class CheckRunner {
  private checks: Check[] = [];
  private options: Required<CheckRunnerOptions>;

  constructor(options: CheckRunnerOptions = {}) {
    this.options = {
      stopOnError: options.stopOnError ?? true,
    };
  }

  /**
   * Add a check to the runner
   *
   * @param check - Check to add
   * @returns This runner (for chaining)
   */
  add(check: Check): this {
    this.checks.push(check);
    return this;
  }

  /**
   * Add multiple checks
   *
   * @param checks - Checks to add
   * @returns This runner (for chaining)
   */
  addAll(checks: Check[]): this {
    this.checks.push(...checks);
    return this;
  }

  /**
   * Run all checks
   *
   * @param context - Check context
   * @returns Array of check results
   */
  async run(context: CheckContext): Promise<CheckResult[]> {
    if (this.checks.length === 0) {
      return [];
    }

    return this.runSequential(context);
  }

  /**
   * Run checks sequentially
   */
  private async runSequential(context: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    for (const check of this.checks) {
      try {
        const result = await check.run(context);
        results.push(result);

        // Stop on first error if configured
        if (
          this.options.stopOnError &&
          !result.passed &&
          result.severity === CheckSeverity.ERROR
        ) {
          break;
        }
      } catch (error) {
        // Wrap unexpected errors
        results.push({
          passed: false,
          severity: CheckSeverity.ERROR,
          message: `Check "${check.name}" failed with error: ${error instanceof Error ? error.message : String(error)}`,
          suggestion: ['Check the logs for more details'],
        });

        if (this.options.stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Check if there are any errors in results
   *
   * @param results - Check results
   * @returns True if there are errors
   */
  hasErrors(results: CheckResult[]): boolean {
    return results.some((r) => !r.passed && r.severity === CheckSeverity.ERROR);
  }

  /**
   * Check if there are any warnings in results
   *
   * @param results - Check results
   * @returns True if there are warnings
   */
  hasWarnings(results: CheckResult[]): boolean {
    return results.some(
      (r) => !r.passed && r.severity === CheckSeverity.WARNING
    );
  }

  /**
   * Get all errors from results
   *
   * @param results - Check results
   * @returns Array of error results
   */
  getErrors(results: CheckResult[]): CheckResult[] {
    return results.filter(
      (r) => !r.passed && r.severity === CheckSeverity.ERROR
    );
  }

  /**
   * Get all warnings from results
   *
   * @param results - Check results
   * @returns Array of warning results
   */
  getWarnings(results: CheckResult[]): CheckResult[] {
    return results.filter(
      (r) => !r.passed && r.severity === CheckSeverity.WARNING
    );
  }

  /**
   * Format results as string
   *
   * @param results - Check results
   * @returns Formatted string
   */
  formatResults(results: CheckResult[]): string {
    const errors = this.getErrors(results);
    const warnings = this.getWarnings(results);

    const parts: string[] = [];

    if (errors.length > 0) {
      parts.push(`Errors (${errors.length}):`);
      errors.forEach((error) => {
        parts.push(`  ✗ ${error.message}`);
      });
    }

    if (warnings.length > 0) {
      if (parts.length > 0) parts.push('');
      parts.push(`Warnings (${warnings.length}):`);
      warnings.forEach((warning) => {
        parts.push(`  ⚠ ${warning.message}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Clear all checks
   */
  clear(): void {
    this.checks = [];
  }
}
