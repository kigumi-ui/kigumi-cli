import type { KigumiConfig } from '../schemas/config.js';
/**
 * Check System Types
 *
 * Type definitions for the pre-flight check system
 */

/**
 * Check severity levels
 */
export enum CheckSeverity {
  ERROR = 'error', // Must be fixed before continuing
  WARNING = 'warning', // Should be fixed but can continue
  INFO = 'info', // Informational only
}

/**
 * Check result
 */
export interface CheckResult {
  passed: boolean;
  severity: CheckSeverity;
  message: string;
  suggestion?: string[];
  details?: Record<string, unknown>;
}

/**
 * Check context
 *
 * Shared context passed to all checks
 */
export interface CheckContext {
  cwd: string;
  config?: KigumiConfig;
  [key: string]: unknown;
}

/**
 * Base check interface
 *
 * All checks must implement this interface
 */
export interface Check {
  /**
   * Unique identifier for this check
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * Check description
   */
  readonly description: string;

  /**
   * Execute the check
   *
   * @param context - Check context
   * @returns Check result
   */
  run(context: CheckContext): Promise<CheckResult>;
}

/**
 * Check group
 *
 * Logical grouping of related checks
 */
export interface CheckGroup {
  name: string;
  description: string;
  checks: Check[];
}
