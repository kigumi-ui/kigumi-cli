/**
 * Pre-flight Checks System
 *
 * Centralized check system for validating state before command execution
 *
 * Usage:
 * ```typescript
 * import { CheckRunner, ConfigExistsCheck } from './checks/index.js';
 *
 * const runner = new CheckRunner().add(new ConfigExistsCheck());
 *
 * const results = await runner.run({ cwd: process.cwd() });
 *
 * if (runner.hasErrors(results)) {
 *   throw new PreFlightCheckError(results);
 * }
 * ```
 */

// Core types and runner
export {
  CheckSeverity,
  type Check,
  type CheckContext,
  type CheckResult,
} from './types.js';
export { CheckRunner, type CheckRunnerOptions } from './runner.js';

// Configuration checks
export { ConfigExistsCheck, PackageJsonExistsCheck } from './config-checks.js';
