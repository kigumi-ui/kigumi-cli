/**
 * Configuration Checks
 *
 * Pre-flight checks for configuration files
 */

import fs from 'fs-extra';
import path from 'path';
import type { Check, CheckContext, CheckResult } from './types.js';
import { CheckSeverity } from './types.js';
import { loadConfig, getSearchPlaces } from '../utils/config.js';

/**
 * Check if a kigumi configuration is reachable from the project's cwd.
 *
 * Delegates to `loadConfig` so all of cosmiconfig's recognised filenames
 * (`kigumi.config.json`, `.kigumirc`, `package.json#kigumi`, etc.) count as
 * "exists" - the previous version only looked for `kigumi.config.json` and
 * spuriously failed for users on legacy or alternative formats.
 */
export class ConfigExistsCheck implements Check {
  readonly id = 'config-exists';
  readonly name = 'Configuration File Exists';
  readonly description =
    'Check if a kigumi config file exists at any supported path';

  async run(context: CheckContext): Promise<CheckResult> {
    const loaded = loadConfig(context.cwd);

    if (!loaded) {
      return {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: 'Configuration file not found',
        suggestion: ['Run: kigumi init', 'This will create kigumi.config.json'],
        details: {
          searched: [...getSearchPlaces()],
          cwd: context.cwd,
        },
      };
    }

    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: `Configuration loaded from ${path.basename(loaded.filepath)}`,
      details: { filepath: loaded.filepath },
    };
  }
}

/**
 * Check if package.json exists
 */
export class PackageJsonExistsCheck implements Check {
  readonly id = 'package-json-exists';
  readonly name = 'Package.json Exists';
  readonly description = 'Check if package.json exists in project';

  async run(context: CheckContext): Promise<CheckResult> {
    const packageJsonPath = path.join(context.cwd, 'package.json');
    const exists = await fs.pathExists(packageJsonPath);

    if (!exists) {
      return {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: 'package.json not found',
        suggestion: [
          'Initialize npm project: npm init',
          'Or ensure you are in the correct directory',
        ],
        details: {
          path: packageJsonPath,
        },
      };
    }

    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: 'package.json exists',
    };
  }
}

/**
 * Check if .gitignore exists
 */
export class GitIgnoreExistsCheck implements Check {
  readonly id = 'gitignore-exists';
  readonly name = 'Gitignore Exists';
  readonly description = 'Check if .gitignore exists (optional)';

  async run(context: CheckContext): Promise<CheckResult> {
    const gitignorePath = path.join(context.cwd, '.gitignore');
    const exists = await fs.pathExists(gitignorePath);

    if (!exists) {
      return {
        passed: false,
        severity: CheckSeverity.WARNING,
        message: '.gitignore not found',
        suggestion: [
          'Create .gitignore to avoid committing sensitive files',
          'Kigumi can create one for you during init',
        ],
      };
    }

    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: '.gitignore exists',
    };
  }
}
