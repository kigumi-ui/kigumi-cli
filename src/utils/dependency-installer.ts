/**
 * Dependency Installer
 *
 * PURPOSE: Handles package installation for kigumi projects.
 *
 * Lives in utils/ rather than under a command, because both `init` and
 * `upgrade` install dependencies. It was previously commands/init/installer.ts,
 * which made upgrade.ts reach across into another command's directory - the
 * only cross-command import in the codebase. See issue #4.
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
import {
  ENV_TOKEN_KEY,
  ENV_TOKEN_REFERENCE,
  NPM_PRO_AUTH_TOKEN_KEY,
  WEB_AWESOME_FREE_PACKAGE,
} from '../constants.js';
import type { OutputInterface } from '../output/types.js';
import type { KigumiConfig } from '../schemas/index.js';
import { tokenReferenceUnset, writeProjectNpmrc } from './npmrc.js';
import type { Tier } from './tier.js';
import { getWebAwesomePackage } from './tier.js';
import {
  describeTokenSource,
  detectProTokenSync,
  getTokenSourceSync,
} from './token.js';
import { DependencyInstallError } from '../errors/index.js';

export interface InstallOptions {
  cwd: string;
  config: KigumiConfig;
  tier: Tier;
  packageManager: string;
  output: OutputInterface;
  /**
   * The token the user just gave (init's --token or prompt). It wins over
   * one Kigumi detects in the environment, the user npmrc or .env.
   */
  token?: string;
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
  packageManager: string,
  env: NodeJS.ProcessEnv
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
      { cwd, reject: false, timeout: 5000, stdio: 'pipe', env }
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
 * Write the exact version over an existing entry for `pkg` in package.json.
 *
 * `pnpm add <pkg>@<version> --save-exact` keeps the range prefix of an entry
 * that is already there, so `^3.6.0` becomes `^3.13.0` and Web Awesome floats
 * again. npm and yarn write the exact version. Handing pnpm an exact entry
 * leaves it no prefix to keep.
 *
 * Returns the original file text when it changed anything, so a failed install
 * can put it back, and null when there was nothing to change.
 */
async function pinExistingDependency(
  cwd: string,
  pkg: string,
  version: string
): Promise<string | null> {
  const manifestPath = path.join(cwd, 'package.json');
  if (!(await fs.pathExists(manifestPath))) return null;

  const original = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(original) as Record<string, unknown>;
  let changed = false;
  for (const field of ['dependencies', 'devDependencies']) {
    const deps = manifest[field] as Record<string, string> | undefined;
    if (deps?.[pkg] !== undefined && deps[pkg] !== version) {
      deps[pkg] = version;
      changed = true;
    }
  }
  if (!changed) return null;

  const indent = /^([ \t]+)"/m.exec(original)?.[1] ?? 2;
  await fs.writeFile(
    manifestPath,
    JSON.stringify(manifest, null, indent) + '\n'
  );
  return original;
}

/**
 * Put back the package.json text `pinExistingDependency` replaced, when the
 * install it was written for failed. The lockfile still records the old range.
 */
async function restoreManifest(
  cwd: string,
  original: string | null
): Promise<void> {
  if (original === null) return;
  await fs.writeFile(path.join(cwd, 'package.json'), original);
}

/**
 * The environment for a package manager child. On Pro it carries the token
 * Kigumi found as WEBAWESOME_NPM_TOKEN, which the project .npmrc reference
 * reads, so the install authenticates whether the token came from the
 * environment, the user npmrc or the project .env. A Free install gets no
 * token it does not need: every install script can read the environment.
 */
function packageManagerEnv(
  cwd: string,
  tier: Tier,
  output: OutputInterface,
  explicitToken?: string
): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (tier !== 'pro') return env;

  if (explicitToken) {
    env[ENV_TOKEN_KEY] = explicitToken;
    output.debug('[DEBUG] Pro token from --token or the init prompt');
    return env;
  }
  const token = detectProTokenSync(cwd);
  if (token) {
    env[ENV_TOKEN_KEY] = token;
    output.debug(
      `[DEBUG] Pro token loaded from ${describeTokenSource(getTokenSourceSync(cwd))}`
    );
  }
  return env;
}

/**
 * Whether a failed Pro install failed for want of a working token: a 401, or
 * pnpm skipping the project .npmrc because it could not fill the reference,
 * then asking the public registry for the Pro package (404).
 */
function isProAuthFailure(output: string): boolean {
  return (
    output.includes('401') ||
    output.includes('Unauthorized') ||
    output.includes(`Failed to replace env in config: ${ENV_TOKEN_REFERENCE}`)
  );
}

/**
 * The note shown when a Pro install cannot authenticate. The two setups it
 * offers are the ones npm and pnpm read; `.env` is not one of them (#160).
 */
function proTokenGuidance(tokenFound: boolean): string {
  return (
    (tokenFound
      ? 'The Pro package requires a valid Web Awesome Pro token.\n\n'
      : 'Kigumi found no Pro token (environment variable, user npmrc or .env).\n\n') +
    'npm and pnpm read it from an npmrc. Setup options (choose one):\n\n' +
    `1. Set ${ENV_TOKEN_KEY} in your environment (shell profile, CI secret).\n` +
    '   The project .npmrc reads it through this line:\n' +
    `   ${NPM_PRO_AUTH_TOKEN_KEY}=${ENV_TOKEN_REFERENCE}\n\n` +
    '2. Store it in your user ~/.npmrc, once per machine:\n' +
    `   npm config set ${NPM_PRO_AUTH_TOKEN_KEY} YOUR_TOKEN\n` +
    '   An _authToken line in the project .npmrc takes precedence over it.\n\n' +
    'A token in the project .env selects Pro for Kigumi, but npm and pnpm never read it.\n\n' +
    'Get your token at: https://webawesome.com/login\n' +
    'Then run the command again.'
  );
}

/**
 * Install project dependencies
 *
 * Brings the project .npmrc in line with the tier first, so `upgrade` and a
 * reinstall authenticate against a .npmrc an older Kigumi wrote.
 *
 * @param options - Installation options
 */
export async function installDependencies(
  options: InstallOptions
): Promise<void> {
  const { cwd, config, tier, packageManager, output } = options;

  if (await writeProjectNpmrc(cwd, tier)) {
    output.info(
      `Updated .npmrc for the ${tier === 'pro' ? 'Pro' : 'Free'} registry`
    );
  }
  const env = packageManagerEnv(cwd, tier, output, options.token);

  // Check lockfile compatibility before installation
  const lockfileCheck = await checkLockfileCompatibility(
    cwd,
    packageManager,
    env
  );

  if (!lockfileCheck.compatible && lockfileCheck.lockfilePath) {
    output.warn('Incompatible lockfile detected');
    output.note(
      'Lockfile compatibility issue',
      createLockfileErrorMessage(packageManager, lockfileCheck.lockfilePath)
    );

    throw new DependencyInstallError(
      `Incompatible ${packageManager} lockfile - please delete and reinstall`,
      packageManager
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

    const installCmd = packageManager === 'npm' ? 'install' : 'add';
    const exactFlag = packageManager === 'yarn' ? '--exact' : '--save-exact';
    const args = [installCmd, ...dependencies, exactFlag];

    const originalManifest = waVersion
      ? await pinExistingDependency(cwd, waPackage, waVersion)
      : null;

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
        try {
          await execa(packageManager, [...args, '--legacy-peer-deps'], {
            cwd,
            stdio: 'pipe',
            env,
          });
        } catch (retryError) {
          await restoreManifest(cwd, originalManifest);
          throw retryError;
        }
      } else {
        await restoreManifest(cwd, originalManifest);
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

    // This install had the token; the user's own installs and CI will not.
    if (tier === 'pro' && (await tokenReferenceUnset(cwd))) {
      output.warn(
        `.npmrc reads the Pro token from ${ENV_TOKEN_KEY}, which is not set here. ` +
          `Kigumi passed its token to this install; set ${ENV_TOKEN_KEY} ` +
          '(shell profile, CI secret) for your own installs.'
      );
    }
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

      if (tier === 'pro' && isProAuthFailure(errorOutput)) {
        output.error('Authentication failed for Pro package');
        output.note(
          'Pro token required',
          proTokenGuidance(Boolean(env[ENV_TOKEN_KEY]))
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

    // Removing Free means the project moved to Pro: the package manager
    // reads the Pro .npmrc, whose token reference needs the token.
    const env = packageManagerEnv(
      cwd,
      oldPackage === WEB_AWESOME_FREE_PACKAGE ? 'pro' : 'free',
      output
    );

    try {
      // Uninstall old package
      const uninstallCmd = packageManager === 'npm' ? 'uninstall' : 'remove';
      await execa(packageManager, [uninstallCmd, oldPackage], {
        cwd,
        stdio: 'pipe',
        env,
      });

      spinner.stop(`Removed old package: ${oldPackage}`);
      output.debug(`[DEBUG] Cleaned up old package: ${oldPackage}`);
    } catch (_error) {
      // Non-critical error, just log it
      spinner.error(`Failed to remove old package: ${oldPackage}`);
      output.warn(
        `Could not remove ${oldPackage}. You may want to uninstall it manually.`
      );
    }
  } catch (error) {
    // Ignore errors in cleanup - it's a nice-to-have
    output.debug(`[DEBUG] Package cleanup skipped: ${error}`);
  }
}
