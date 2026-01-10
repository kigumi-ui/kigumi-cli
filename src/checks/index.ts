/**
 * Pre-flight Checks System
 *
 * Centralized check system for validating state before command execution
 *
 * Usage:
 * ```typescript
 * import { CheckRunner, ConfigExistsCheck } from './checks/index.js';
 *
 * const runner = new CheckRunner()
 *   .add(new ConfigExistsCheck())
 *   .add(new NodeModulesExistsCheck());
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
  type CheckGroup,
} from './types.js';
export { CheckRunner, type CheckRunnerOptions } from './runner.js';

// Configuration checks
export {
  ConfigExistsCheck,
  ConfigValidCheck,
  PackageJsonExistsCheck,
  GitIgnoreExistsCheck,
} from './config-checks.js';

// Dependency checks
export {
  NodeModulesExistsCheck,
  WebAwesomeInstalledCheck,
  DependencyInstalledCheck,
  PackageJsonDependencyCheck,
} from './dependency-checks.js';
