/**
 * Configuration Checks
 *
 * Pre-flight checks for configuration files
 */

import fs from 'fs-extra';
import path from 'path';
import type { Check, CheckContext, CheckResult } from './types.js';
import { CheckSeverity } from './types.js';

/**
 * Check if configuration file exists
 */
export class ConfigExistsCheck implements Check {
  readonly id = 'config-exists';
  readonly name = 'Configuration File Exists';
  readonly description = 'Check if kigumi.config.json exists';

  async run(context: CheckContext): Promise<CheckResult> {
    const configPath = path.join(context.cwd, 'kigumi.config.json');
    const exists = await fs.pathExists(configPath);

    if (!exists) {
      return {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: 'Configuration file not found',
        suggestion: [
          'Run: kigumi init',
          'This will create kigumi.config.json',
        ],
        details: {
          path: configPath,
        },
      };
    }

    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: 'Configuration file exists',
    };
  }
}

/**
 * Check if configuration is valid
 */
export class ConfigValidCheck implements Check {
  readonly id = 'config-valid';
  readonly name = 'Configuration Valid';
  readonly description = 'Check if configuration is valid according to schema';

  async run(context: CheckContext): Promise<CheckResult> {
    if (!context.config) {
      return {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: 'Configuration not loaded',
        suggestion: ['Ensure configuration file is valid JSON'],
      };
    }

    // Configuration validation will be done when loading
    // This check just verifies it was loaded successfully
    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: 'Configuration is valid',
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
