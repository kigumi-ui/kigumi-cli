/**
 * Package.json Updater
 *
 * PURPOSE: Add Pro tier specific npm scripts to package.json
 * for easier dotenv-cli usage.
 *
 * @see AGENTS.md for Pro tier setup
 */

import fs from 'fs-extra';
import path from 'path';
import type { Tier } from '../../utils/tier.js';
import { readJSONWithComments } from '../../utils/json.js';

/**
 * Get the appropriate dotenv-cli executor for the package manager
 *
 * @param packageManager - Package manager in use
 * @returns The command to run dotenv-cli
 * @internal
 */
function getDotenvExecutor(
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun'
): string {
  switch (packageManager) {
    case 'pnpm':
      return 'pnpx dotenv-cli';
    case 'yarn':
      return 'yarn dlx dotenv-cli';
    case 'bun':
      return 'bunx dotenv-cli';
    case 'npm':
    default:
      return 'npx dotenv-cli';
  }
}

/**
 * Get the install command for the package manager
 *
 * @param packageManager - Package manager in use
 * @returns The install command
 * @internal
 */
function getInstallCommand(
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun'
): string {
  switch (packageManager) {
    case 'npm':
      return 'npm install';
    case 'pnpm':
      return 'pnpm install';
    case 'yarn':
      return 'yarn install';
    case 'bun':
      return 'bun install';
  }
}

/**
 * Get the add command for the package manager
 *
 * @param packageManager - Package manager in use
 * @returns The add command
 * @internal
 */
function getAddCommand(
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun'
): string {
  switch (packageManager) {
    case 'npm':
      return 'npm install';
    case 'pnpm':
      return 'pnpm add';
    case 'yarn':
      return 'yarn add';
    case 'bun':
      return 'bun add';
  }
}

/**
 * Add helpful npm scripts for Pro tier projects
 *
 * Adds convenience scripts that wrap package manager commands with dotenv-cli
 * to automatically load WEBAWESOME_NPM_TOKEN from .env file.
 *
 * @param cwd - Current working directory
 * @param tier - Project tier (only acts on 'pro')
 * @param packageManager - Package manager in use
 * @internal
 */
export async function addProScripts(
  cwd: string,
  tier: Tier,
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun'
): Promise<void> {
  if (tier !== 'pro') return;

  const packageJsonPath = path.join(cwd, 'package.json');
  const packageJsonRaw = await readJSONWithComments(packageJsonPath);

  // Type assertion - we know package.json structure
  const packageJson = packageJsonRaw as {
    scripts?: Record<string, string>;
    [key: string]: unknown;
  };

  // Ensure scripts object exists
  packageJson.scripts = packageJson.scripts || {};

  const dotenvExec = getDotenvExecutor(packageManager);
  const installCmd = getInstallCommand(packageManager);
  const addCmd = getAddCommand(packageManager);

  // Don't override if already exists
  if (!packageJson.scripts['install:deps']) {
    packageJson.scripts['install:deps'] = `${dotenvExec} -- ${installCmd}`;
  }

  if (!packageJson.scripts['add']) {
    packageJson.scripts['add'] = `${dotenvExec} -- ${addCmd}`;
  }

  await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
}
