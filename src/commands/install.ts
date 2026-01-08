import * as p from '@clack/prompts';
import pc from 'picocolors';
import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { loadConfig } from '../utils/config.js';
import { getProjectInfo } from '../utils/detect-framework.js';
import { loadTokenFromEnv } from '../utils/token-manager.js';

/**
 * Install Web Awesome package
 *
 * For Pro tier, this command reads the token from .env and installs the package
 * For Free tier, it just installs the package normally
 */
export async function installCommand() {
  console.clear();

  p.intro(pc.bgCyan(pc.black(' kigumi install ')));

  const cwd = process.cwd();

  // Load kigumi config
  const config = await loadConfig(cwd);
  if (!config) {
    p.outro(pc.red('✖ No kigumi-components.json found. Run `kigumi init` first.'));
    process.exit(1);
  }

  const tier = config.webAwesome?.tier || 'free';
  const packageName = tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';

  // Get project info to determine package manager
  const projectInfo = await getProjectInfo(cwd);

  const spinner = p.spinner();

  // For Pro tier, verify token exists
  if (tier === 'pro') {
    const token = await loadTokenFromEnv(cwd);

    if (!token) {
      p.outro(
        pc.red('✖ No valid token found in .env\n\n') +
        pc.dim('Add your Web Awesome Pro token to .env:\n') +
        pc.cyan('WEBAWESOME_NPM_TOKEN=your-token-here\n\n') +
        pc.dim('Get your token from: ') + pc.cyan('https://webawesome.com')
      );
      process.exit(1);
    }

    // Install with token
    spinner.start(`Installing ${packageName}...`);

    try {
      // Determine install command based on package manager
      let installArgs: string[];
      if (projectInfo.packageManager === 'npm') {
        installArgs = ['install', packageName];
      } else if (projectInfo.packageManager === 'pnpm') {
        installArgs = ['add', packageName];
      } else if (projectInfo.packageManager === 'yarn') {
        installArgs = ['add', packageName];
      } else {
        // bun
        installArgs = ['add', packageName];
      }

      // Run install with token in environment
      await execa(projectInfo.packageManager, installArgs, {
        cwd,
        env: {
          ...process.env,
          WEBAWESOME_NPM_TOKEN: token,
        },
      });

      spinner.stop(pc.green(`✓ ${packageName} installed successfully`));

      // Also install clsx for React projects
      if (config.framework === 'react') {
        const hasClsx = await fs.pathExists(path.join(cwd, 'node_modules', 'clsx'));
        if (!hasClsx) {
          spinner.start('Installing clsx...');
          try {
            const clsxArgs = projectInfo.packageManager === 'npm'
              ? ['install', 'clsx']
              : ['add', 'clsx'];

            await execa(projectInfo.packageManager, clsxArgs, { cwd });
            spinner.stop(pc.green('✓ clsx installed'));
          } catch (error) {
            spinner.stop(pc.yellow('⚠ Failed to install clsx (optional)'));
          }
        }
      }

      p.outro(
        pc.green('✓ Installation complete!\n\n') +
        pc.dim('Next steps:\n') +
        pc.dim('1. Configure path aliases (see INSTALLATION.md)\n') +
        pc.dim('2. Add ') + pc.cyan("import '@/lib/webawesome'") + pc.dim(' to your main file\n') +
        pc.dim('3. Run ') + pc.cyan('kigumi add button') + pc.dim(' to add components')
      );
    } catch (error: any) {
      spinner.stop(pc.red('✖ Installation failed'));

      let errorMessage = 'Failed to install Web Awesome Pro package.\n\n';

      if (error.stderr?.includes('401') || error.stderr?.includes('Unauthorized')) {
        errorMessage +=
          pc.yellow('Authentication failed. Your token may be invalid or expired.\n\n') +
          pc.dim('1. Get a new token from: ') + pc.cyan('https://webawesome.com\n') +
          pc.dim('2. Update .env with your new token\n') +
          pc.dim('3. Try running ') + pc.cyan('kigumi install') + pc.dim(' again');
      } else if (error.stderr?.includes('404')) {
        errorMessage +=
          pc.yellow('Package not found. Check your .npmrc configuration.\n\n') +
          pc.dim('Expected .npmrc content:\n') +
          pc.cyan('@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro/\n') +
          pc.cyan('//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${WEBAWESOME_NPM_TOKEN}');
      } else {
        errorMessage += pc.dim('Error: ') + (error.message || String(error));
      }

      p.outro(pc.red(errorMessage));
      process.exit(1);
    }
  } else {
    // Free tier - simple install
    spinner.start(`Installing ${packageName}...`);

    try {
      let installArgs: string[];
      if (projectInfo.packageManager === 'npm') {
        installArgs = ['install', packageName];
      } else if (projectInfo.packageManager === 'pnpm') {
        installArgs = ['add', packageName];
      } else if (projectInfo.packageManager === 'yarn') {
        installArgs = ['add', packageName];
      } else {
        installArgs = ['add', packageName];
      }

      await execa(projectInfo.packageManager, installArgs, { cwd });
      spinner.stop(pc.green(`✓ ${packageName} installed successfully`));

      // Also install clsx for React projects
      if (config.framework === 'react') {
        const hasClsx = await fs.pathExists(path.join(cwd, 'node_modules', 'clsx'));
        if (!hasClsx) {
          spinner.start('Installing clsx...');
          try {
            const clsxArgs = projectInfo.packageManager === 'npm'
              ? ['install', 'clsx']
              : ['add', 'clsx'];

            await execa(projectInfo.packageManager, clsxArgs, { cwd });
            spinner.stop(pc.green('✓ clsx installed'));
          } catch (error) {
            spinner.stop(pc.yellow('⚠ Failed to install clsx (optional)'));
          }
        }
      }

      p.outro(
        pc.green('✓ Installation complete!\n\n') +
        pc.dim('Next steps:\n') +
        pc.dim('1. Configure path aliases (see INSTALLATION.md)\n') +
        pc.dim('2. Add ') + pc.cyan("import '@/lib/webawesome'") + pc.dim(' to your main file\n') +
        pc.dim('3. Run ') + pc.cyan('kigumi add button') + pc.dim(' to add components')
      );
    } catch (error: any) {
      spinner.stop(pc.red('✖ Installation failed'));
      p.outro(pc.red('Failed to install package: ') + (error.message || String(error)));
      process.exit(1);
    }
  }
}
