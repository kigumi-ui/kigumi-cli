/**
 * Dependency Installer
 *
 * PURPOSE: Handles package installation for kigumi projects.
 *
 * EXPORTS:
 * - installDependencies() - Install Web Awesome and framework dependencies
 * - cleanupOldPackage() - Remove old package after tier migration
 *
 * @see AGENTS.md Rule #9 for auto-installation behavior
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { ENV_TOKEN_KEY } from '../../constants.js';
import type { OutputInterface } from '../../output/types.js';
import type { KigumiConfig } from '../../schemas/index.js';
import type { Tier } from '../../utils/tier.js';
import { getWebAwesomePackage } from '../../utils/tier.js';
import {
  describeTokenSource,
  detectProTokenSync,
  getTokenSourceSync,
} from '../../utils/token.js';
import { DependencyInstallError } from '../../errors/index.js';

export interface InstallOptions {
  cwd: string;
  config: KigumiConfig;
  tier: Tier;
  packageManager: string;
  output: OutputInterface;
}

type PackageManager = 'npm' | 'pnpm' | 'yarn';

interface LockfileCheckResult {
  compatible: boolean;
  lockfilePath: string | null;
}

/**
 * Check if lockfile is compatible with current package manager version
 *
 * Detects incompatible lockfiles that can cause spurious authentication
 * errors during installation.
 */
async function checkLockfileCompatibility(
  cwd: string,
  packageManager: string
): Promise<LockfileCheckResult> {
  const lockfiles: Record<string, string> = {
    npm: 'package-lock.json',
    pnpm: 'pnpm-lock.yaml',
    yarn: 'yarn.lock',
  };

  const lockfileName = lockfiles[packageManager as PackageManager];
  if (!lockfileName) {
    return { compatible: true, lockfilePath: null };
  }

  const lockfilePath = path.join(cwd, lockfileName);

  if (!(await fs.pathExists(lockfilePath))) {
    return { compatible: true, lockfilePath: null };
  }

  // Run package manager's check command with timeout
  try {
    const result = await execa(
      packageManager,
      ['install', '--frozen-lockfile'],
      { cwd, reject: false, timeout: 5000, stdio: 'pipe' }
    );

    // Check for incompatible lockfile warnings
    const incompatiblePatterns = [
      /not compatible with current/i,
      /ignoring broken lockfile/i,
      /lockfile .* version/i,
    ];

    const output = (result.stderr || '') + (result.stdout || '');
    const hasIncompatibility = incompatiblePatterns.some((pattern) =>
      pattern.test(output)
    );

    return {
      compatible: !hasIncompatibility,
      lockfilePath: hasIncompatibility ? lockfilePath : null,
    };
  } catch (_error) {
    // If command times out or fails, assume compatible
    return { compatible: true, lockfilePath: null };
  }
}

/**
 * Create helpful error message for lockfile compatibility issues
 */
function createLockfileErrorMessage(
  packageManager: string,
  lockfilePath: string
): string {
  const commands: Record<string, string> = {
    npm: 'rm package-lock.json && npm install',
    pnpm: 'rm pnpm-lock.yaml && pnpm install',
    yarn: 'rm yarn.lock && yarn install',
  };

  const command = commands[packageManager as PackageManager] || 'reinstall';

  return (
    `Your ${packageManager} lockfile is incompatible with the current ${packageManager} version.\n\n` +
    `This can cause authentication failures during installation.\n\n` +
    `Quick fix:\n` +
    `  cd ${path.dirname(lockfilePath)}\n` +
    `  ${command}\n\n` +
    `Then run kigumi init again.`
  );
}

/**
 * Create helpful error message for pnpm store compatibility issues
 */
function createStoreErrorMessage(cwd: string): string {
  return (
    `Your node_modules were installed with a different pnpm version.\n\n` +
    `The pnpm store version has changed, causing installation failures.\n\n` +
    `Quick fix:\n` +
    `  cd ${cwd}\n` +
    `  rm -rf node_modules pnpm-lock.yaml\n` +
    `  pnpm install\n\n` +
    `Then run kigumi init again.`
  );
}

/**
 * Detect npm ERESOLVE peer-dependency conflict errors.
 */
function isEresolveError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'stderr' in error) {
    const stderr = String((error as { stderr: unknown }).stderr);
    return /ERESOLVE/.test(stderr);
  }
  return false;
}

/**
 * Install project dependencies
 *
 * @param options - Installation options
 */
export async function installDependencies(
  options: InstallOptions
): Promise<void> {
  const { cwd, config, tier, packageManager, output } = options;

  // Check lockfile compatibility before installation
  const lockfileCheck = await checkLockfileCompatibility(cwd, packageManager);

  if (!lockfileCheck.compatible && lockfileCheck.lockfilePath) {
    output.warn('Incompatible lockfile detected');
    output.note(
      'Lockfile compatibility issue',
      createLockfileErrorMessage(packageManager, lockfileCheck.lockfilePath)
    );

    throw new Error(
      `Incompatible ${packageManager} lockfile - please delete and reinstall`
    );
  }

  const spinner = output.spinner('Installing dependencies...');

  // Determine Web Awesome package based on tier, with version from config
  const waPackage = getWebAwesomePackage(tier);
  const waVersion = config.webAwesome?.version;
  const waSpec = waVersion ? `${waPackage}@${waVersion}` : waPackage;

  // Base dependencies
  const dependencies = [waSpec];

  // Framework-specific dependencies
  if (config.framework === 'react') {
    dependencies.push('clsx');
  }

  try {
    // Dev dependencies (types)
    const devDependencies: string[] = [];
    if (config.framework === 'react' && config.typescript) {
      devDependencies.push('@types/react', '@types/react-dom');
    }

    // For Pro tier, load token from fallback chain
    const env = { ...process.env };
    if (tier === 'pro') {
      const token = detectProTokenSync(cwd);
      if (token) {
        env[ENV_TOKEN_KEY] = token;
        const source = getTokenSourceSync(cwd);
        output.log(
          `[DEBUG] Pro token loaded from ${describeTokenSource(source)}`
        );
      }
    }

    // Install dependencies
    const installCmd = packageManager === 'npm' ? 'install' : 'add';
    const args = [installCmd, ...dependencies];

    try {
      await execa(packageManager, args, {
        cwd,
        stdio: 'pipe',
        env,
      });
    } catch (firstError) {
      // npm ERESOLVE: retry with --legacy-peer-deps to bypass unrelated
      // peer-dependency conflicts in the project's existing tree
      if (packageManager === 'npm' && isEresolveError(firstError)) {
        output.warn(
          'Peer dependency conflict detected, retrying with --legacy-peer-deps'
        );
        await execa(packageManager, [...args, '--legacy-peer-deps'], {
          cwd,
          stdio: 'pipe',
          env,
        });
      } else {
        throw firstError;
      }
    }

    // Install devDependencies separately if needed
    if (devDependencies.length > 0) {
      const devArgs =
        packageManager === 'npm'
          ? ['install', '--save-dev', ...devDependencies]
          : ['add', '-D', ...devDependencies];

      try {
        await execa(packageManager, devArgs, {
          cwd,
          stdio: 'pipe',
          env,
        });
      } catch (firstError) {
        if (packageManager === 'npm' && isEresolveError(firstError)) {
          output.warn(
            'Peer dependency conflict detected, retrying with --legacy-peer-deps'
          );
          await execa(packageManager, [...devArgs, '--legacy-peer-deps'], {
            cwd,
            stdio: 'pipe',
            env,
          });
        } else {
          throw firstError;
        }
      }
    }

    spinner.stop('Dependencies installed');
  } catch (error) {
    spinner.error('Installation failed');

    // Type guard for execa error
    if (
      error &&
      typeof error === 'object' &&
      'exitCode' in error &&
      'stderr' in error
    ) {
      const execaError = error as {
        exitCode?: number;
        stderr?: string;
        stdout?: string;
      };

      const stderr = execaError.stderr || '';
      const stdout = execaError.stdout || '';
      const errorOutput = stderr + stdout;

      // Check for pnpm store version mismatch
      const isStoreIssue =
        /ERR_PNPM_UNEXPECTED_STORE/i.test(errorOutput) ||
        /Unexpected store location/i.test(errorOutput) ||
        /currently linked from the store/i.test(errorOutput);

      if (isStoreIssue && packageManager === 'pnpm') {
        output.error('Installation failed due to pnpm store version mismatch');
        output.note('Store compatibility issue', createStoreErrorMessage(cwd));

        throw new DependencyInstallError(
          dependencies.join(' '),
          packageManager,
          error instanceof Error ? error : new Error(String(execaError.stderr)),
          execaError.exitCode
        );
      }

      // Check for lockfile compatibility issues
      const isLockfileIssue =
        /not compatible with current/i.test(errorOutput) ||
        /ignoring broken lockfile/i.test(errorOutput) ||
        /lockfile .* version/i.test(errorOutput);

      if (isLockfileIssue) {
        output.error('Installation failed due to incompatible lockfile');

        // Get lockfile path
        const lockfiles: Record<string, string> = {
          npm: 'package-lock.json',
          pnpm: 'pnpm-lock.yaml',
          yarn: 'yarn.lock',
        };
        const lockfileName = lockfiles[packageManager as PackageManager];
        const lockfilePath = lockfileName ? path.join(cwd, lockfileName) : null;

        if (lockfilePath) {
          output.note(
            'Lockfile compatibility issue',
            createLockfileErrorMessage(packageManager, lockfilePath)
          );
        }

        throw new DependencyInstallError(
          dependencies.join(' '),
          packageManager,
          error instanceof Error ? error : new Error(String(execaError.stderr)),
          execaError.exitCode
        );
      }

      // Enhanced 401 error handling (Phase 3)
      const is401Error =
        stderr.includes('401') || stderr.includes('Unauthorized');

      if (is401Error && tier === 'pro') {
        // Context-aware error message for Pro tier
        output.error('Authentication failed for Pro package');
        output.note(
          'Pro token required',
          'The Pro package requires a valid Web Awesome Pro token.\n\n' +
            'Setup options (choose one):\n\n' +
            '1. Local development (recommended):\n' +
            '   npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken YOUR_TOKEN\n\n' +
            '2. CI/CD environments:\n' +
            `   Set ${ENV_TOKEN_KEY} environment variable\n\n` +
            '3. Project-specific (.env file):\n' +
            `   ${ENV_TOKEN_KEY}=your_token_here\n\n` +
            'Get your token at: https://webawesome.com/login\n' +
            'Then run kigumi init again.'
        );
      }

      throw new DependencyInstallError(
        dependencies.join(' '),
        packageManager,
        error instanceof Error ? error : new Error(String(execaError.stderr)),
        execaError.exitCode
      );
    }

    throw new DependencyInstallError(
      dependencies.join(' '),
      packageManager,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Clean up old package after tier migration (Bug #3 fix)
 *
 * Removes the old Web Awesome package that is no longer needed
 */
export async function cleanupOldPackage(
  cwd: string,
  oldPackage: '@awesome.me/webawesome' | '@awesome.me/webawesome-pro',
  packageManager: string,
  output: OutputInterface
): Promise<void> {
  try {
    // Check if package exists in package.json
    const packageJsonPath = path.join(cwd, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      return;
    }

    const packageJson = await fs.readJSON(packageJsonPath);
    if (!packageJson.dependencies?.[oldPackage]) {
      // Package not installed, nothing to clean up
      return;
    }

    const spinner = output.spinner(`Removing old package: ${oldPackage}`);

    try {
      // Uninstall old package
      const uninstallCmd = packageManager === 'npm' ? 'uninstall' : 'remove';
      await execa(packageManager, [uninstallCmd, oldPackage], {
        cwd,
        stdio: 'pipe',
      });

      spinner.stop(`Removed old package: ${oldPackage}`);
      output.log(`[DEBUG] Cleaned up old package: ${oldPackage}`);
    } catch (_error) {
      // Non-critical error, just log it
      spinner.error(`Failed to remove old package: ${oldPackage}`);
      output.warn(
        `Could not remove ${oldPackage}. You may want to uninstall it manually.`
      );
    }
  } catch (error) {
    // Ignore errors in cleanup - it's a nice-to-have
    output.log(`[DEBUG] Package cleanup skipped: ${error}`);
  }
}
