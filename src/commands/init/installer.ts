/**
 * Dependency Installer
 *
 * Handles package installation for kigumi projects
 */

import { execa } from 'execa';
import type { OutputInterface } from '../../output/types.js';
import type { KigumiConfig } from '../../schemas/index.js';
import { DependencyInstallError } from '../../errors/index.js';

/**
 * Install project dependencies
 *
 * @param cwd - Current working directory
 * @param config - Kigumi configuration
 * @param packageManager - Package manager to use
 * @param output - Output interface
 */
export async function installDependencies(
  cwd: string,
  config: KigumiConfig,
  packageManager: string,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Installing dependencies...');

  try {
    // Determine Web Awesome package
    const tier = config.webAwesome?.tier || 'free';
    const waPackage = tier === 'pro'
      ? '@awesome.me/webawesome-pro'
      : '@awesome.me/webawesome';

    // Base dependencies
    const dependencies = [waPackage];

    // Framework-specific dependencies
    if (config.framework === 'react') {
      dependencies.push('clsx');
    }

    // Install command
    const installCmd = packageManager === 'npm' ? 'install' : 'add';
    const args = [installCmd, ...dependencies];

    spinner.message(`Running: ${packageManager} ${args.join(' ')}`);

    await execa(packageManager, args, {
      cwd,
      stdio: 'pipe',
    });

    spinner.stop('Dependencies installed');
  } catch (error) {
    spinner.error('Installation failed');

    const execaError = error as any;
    const statusCode = execaError.exitCode;

    throw new DependencyInstallError(
      'dependencies',
      packageManager,
      error as Error,
      statusCode
    );
  }
}
