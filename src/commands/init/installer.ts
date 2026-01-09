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

    // For Pro tier, load .env file and pass token to npm
    const env = { ...process.env };
    if (tier === 'pro') {
      const envPath = path.join(cwd, '.env');
      if (await fs.pathExists(envPath)) {
        const envContent = await fs.readFile(envPath, 'utf-8');
        const tokenMatch = envContent.match(/WEBAWESOME_NPM_TOKEN=(.+)/);
        if (tokenMatch && tokenMatch[1]) {
          env.WEBAWESOME_NPM_TOKEN = tokenMatch[1].trim();
          output.log(`[DEBUG] Loaded WEBAWESOME_NPM_TOKEN from .env`);
        }
      } else if (config.webAwesome?.token) {
        // Fallback to token from config
        env.WEBAWESOME_NPM_TOKEN = config.webAwesome.token;
        output.log(`[DEBUG] Using token from config`);
      }
    }

    // Install command
    const installCmd = packageManager === 'npm' ? 'install' : 'add';
    const args = [installCmd, ...dependencies];

    spinner.message(`Running: ${packageManager} ${args.join(' ')}`);

    await execa(packageManager, args, {
      cwd,
      stdio: 'pipe',
      env, // Pass environment with token
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
