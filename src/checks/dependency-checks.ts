/**
 * Dependency Checks
 *
 * Pre-flight checks for dependencies
 */

import fs from 'fs-extra';
import path from 'path';
import type { Check, CheckContext, CheckResult } from './types.js';
import { CheckSeverity } from './types.js';

/**
 * Check if node_modules exists
 */
export class NodeModulesExistsCheck implements Check {
  readonly id = 'node-modules-exists';
  readonly name = 'Node Modules Exists';
  readonly description = 'Check if node_modules directory exists';

  async run(context: CheckContext): Promise<CheckResult> {
    const nodeModulesPath = path.join(context.cwd, 'node_modules');
    const exists = await fs.pathExists(nodeModulesPath);

    if (!exists) {
      return {
        passed: false,
        severity: CheckSeverity.WARNING,
        message: 'node_modules not found',
        suggestion: [
          'Install dependencies: npm install (or pnpm install, yarn, bun install)',
          'This may be expected if you just cloned the repository',
        ],
      };
    }

    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: 'node_modules exists',
    };
  }
}

/**
 * Check if Web Awesome is installed
 */
export class WebAwesomeInstalledCheck implements Check {
  readonly id = 'webawesome-installed';
  readonly name = 'Web Awesome Installed';
  readonly description = 'Check if @awesome.me/webawesome is installed';

  async run(context: CheckContext): Promise<CheckResult> {
    const { cwd } = context;

    // Detect tier from .env
    const { detectTier } = await import('../utils/tier.js');
    const tier = await detectTier(cwd);
    const packageName =
      tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';

    const packagePath = path.join(
      context.cwd,
      'node_modules',
      packageName.replace('/', path.sep)
    );

    const exists = await fs.pathExists(packagePath);

    if (!exists) {
      return {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: `${packageName} is not installed`,
        suggestion: [
          `Install the package: npm install ${packageName}`,
          'Or run: kigumi install',
        ],
        details: {
          packageName,
          tier,
        },
      };
    }

    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: `${packageName} is installed`,
    };
  }
}

/**
 * Check if required dependency is installed
 */
export class DependencyInstalledCheck implements Check {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  constructor(
    private packageName: string,
    private severity: CheckSeverity = CheckSeverity.ERROR
  ) {
    this.id = `dependency-${packageName}`;
    this.name = `${packageName} Installed`;
    this.description = `Check if ${packageName} is installed`;
  }

  async run(context: CheckContext): Promise<CheckResult> {
    const packagePath = path.join(
      context.cwd,
      'node_modules',
      this.packageName.replace('/', path.sep)
    );

    const exists = await fs.pathExists(packagePath);

    if (!exists) {
      return {
        passed: false,
        severity: this.severity,
        message: `${this.packageName} is not installed`,
        suggestion: [`Install the package: npm install ${this.packageName}`],
        details: {
          packageName: this.packageName,
        },
      };
    }

    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: `${this.packageName} is installed`,
    };
  }
}

/**
 * Check if package.json has a dependency
 */
export class PackageJsonDependencyCheck implements Check {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  constructor(
    private packageName: string,
    private severity: CheckSeverity = CheckSeverity.WARNING
  ) {
    this.id = `package-json-dep-${packageName}`;
    this.name = `${packageName} in package.json`;
    this.description = `Check if ${packageName} is in package.json`;
  }

  async run(context: CheckContext): Promise<CheckResult> {
    const packageJsonPath = path.join(context.cwd, 'package.json');

    if (!(await fs.pathExists(packageJsonPath))) {
      return {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: 'package.json not found',
      };
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (!deps[this.packageName]) {
      return {
        passed: false,
        severity: this.severity,
        message: `${this.packageName} not found in package.json`,
        suggestion: [`Add to package.json: npm install ${this.packageName}`],
      };
    }

    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: `${this.packageName} is in package.json`,
    };
  }
}
