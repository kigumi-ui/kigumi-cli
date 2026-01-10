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
          output.log(`[DEBUG] Loaded WEBAWESOME_NPM_TOKEN from .env`);
        }
      }
    }

    // Install command
    const installCmd = packageManager === 'npm' ? 'install' : 'add';
    const args = [installCmd, ...dependencies];

    spinner.message(`Running: ${packageManager} ${args.join(' ')}`);

    await execa(packageManager, args, {
      cwd,
      stdio: 'pipe',
      env,
    });

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
