/**
 * Dependency Installer
 *
 * Handles package installation for kigumi projects
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import type { OutputInterface } from '../../output/types.js';
import type { KigumiConfig } from '../../schemas/index.js';
import type { Tier } from '../../utils/tier.js';
import { getWebAwesomePackage } from '../../utils/tier.js';
import { DependencyInstallError } from '../../errors/index.js';

export interface InstallOptions {
  cwd: string;
  config: KigumiConfig;
  tier: Tier;
  packageManager: string;
  output: OutputInterface;
}

/**
 * Install project dependencies
 */
export async function installDependencies(
  options: InstallOptions
): Promise<void> {
  const { cwd, config, tier, packageManager, output } = options;
  const spinner = output.spinner('Installing dependencies...');

  try {
    // Determine Web Awesome package based on tier
    const waPackage = getWebAwesomePackage(tier);

    // Base dependencies
    const dependencies = [waPackage];

    // Framework-specific dependencies
    if (config.framework === 'react') {
      dependencies.push('clsx');
    }

    // Dev dependencies (types)
    const devDependencies: string[] = [];
    if (config.framework === 'react' && config.typescript) {
      devDependencies.push('@types/react', '@types/react-dom');
    }

    // For Pro tier, load token from .env
    const env = { ...process.env };
    if (tier === 'pro') {
      const envPath = path.join(cwd, '.env');
      if (await fs.pathExists(envPath)) {
        const envContent = await fs.readFile(envPath, 'utf-8');
        const tokenMatch = envContent.match(
          /^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m
        );
        if (tokenMatch && tokenMatch[1]) {
          env.WEBAWESOME_NPM_TOKEN = tokenMatch[1].trim();
        }
      }
    }

    // Install dependencies
    const installCmd = packageManager === 'npm' ? 'install' : 'add';
    const args = [installCmd, ...dependencies];

    spinner.message(`Running: ${packageManager} ${args.join(' ')}`);

    await execa(packageManager, args, {
      cwd,
      stdio: 'pipe',
      env,
    });

    // Install devDependencies separately if needed
    if (devDependencies.length > 0) {
      const devArgs =
        packageManager === 'npm'
          ? ['install', '--save-dev', ...devDependencies]
          : ['add', '-D', ...devDependencies];

      spinner.message(`Running: ${packageManager} ${devArgs.join(' ')}`);

      await execa(packageManager, devArgs, {
        cwd,
        stdio: 'pipe',
        env,
      });
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

      // Enhanced 401 error handling (Phase 3)
      const stderr = execaError.stderr || '';
      const is401Error =
        stderr.includes('401') || stderr.includes('Unauthorized');

      if (is401Error && tier === 'pro') {
        // Context-aware error message for Pro tier
        output.error('Authentication failed for Pro package');
        output.note(
          'Pro token required',
          'The Pro package requires a valid Web Awesome Pro token.\n\n' +
            'To get a token:\n' +
            '1. Visit https://webawesome.com/account/tokens\n' +
            '2. Generate or copy your token\n' +
            '3. Add to your .env file:\n' +
            '   WEBAWESOME_NPM_TOKEN=your_token_here\n\n' +
            'Then run kigumi init again.'
        );
      }

      throw new DependencyInstallError(
        'dependencies',
        packageManager,
        execaError as Error,
        execaError.exitCode
      );
    }

    throw new DependencyInstallError(
      'dependencies',
      packageManager,
      error as Error
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
    } catch {
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
