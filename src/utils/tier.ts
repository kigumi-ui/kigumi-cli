/**
 * Tier Detection Utility
 *
 * PURPOSE: Determines Free vs Pro tier based on token availability.
 *
 * Token detection uses fallback chain (see src/utils/token.ts):
 * 1. $WEBAWESOME_NPM_TOKEN environment variable (CI/CD)
 * 2. Global ~/.npmrc (local development)
 * 3. Project .env file (backwards compatible)
 *
 * EXPORTS:
 * - detectTier() - Async tier detection (PREFERRED)
 * - detectTierSync() - Sync version (use only when absolutely necessary)
 * - getWebAwesomePackage() - Get npm package name for tier
 *
 * @see AGENTS.md Rule #8 for tier system architecture
 */

import { z } from 'zod';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../constants.js';
import { PackageJsonInvalidError } from '../errors/filesystem.js';
import {
  readDependencies,
  readDependenciesSync,
  type Dependencies,
} from './package-json.js';
import { detectProToken, detectProTokenSync } from './token.js';

export const tierSchema = z.enum(['free', 'pro'], {
  error: () => 'Must be either "free" or "pro"',
});

export type Tier = z.infer<typeof tierSchema>;

/**
 * The tier an installed Web Awesome package implies, or undefined when
 * package.json lists neither. Pro wins when both are listed.
 */
function tierFromDependencies(deps: Dependencies): Tier | undefined {
  if (deps[WEB_AWESOME_PRO_PACKAGE]) return 'pro';
  if (deps[WEB_AWESOME_FREE_PACKAGE]) return 'free';
  return undefined;
}

/**
 * Detect tier based on installed package
 *
 * Checks package.json to see if @awesome.me/webawesome-pro is installed.
 * Falls back to token detection when package.json is missing, is invalid
 * (PackageJsonInvalidError), or lists neither Web Awesome package. An
 * unreadable package.json is thrown as PackageJsonReadError.
 * An installed package wins over a token.
 *
 * @param cwd - Current working directory
 * @returns 'pro' if webawesome-pro is installed, 'free' otherwise
 */
export async function detectTier(cwd: string): Promise<Tier> {
  try {
    const installed = tierFromDependencies(await readDependencies(cwd));
    if (installed) return installed;
  } catch (error) {
    // A broken package.json is not a tier signal; fall through to the token.
    if (!(error instanceof PackageJsonInvalidError)) throw error;
  }

  // Fallback to token detection (for init command or if no package installed yet)
  const token = await detectProToken(cwd);
  return token ? 'pro' : 'free';
}

/**
 * Synchronous version of detectTier
 *
 * WHY: Some code paths (e.g., validators) need synchronous tier detection.
 * Prefer detectTier() when possible.
 */
export function detectTierSync(cwd: string): Tier {
  try {
    const installed = tierFromDependencies(readDependenciesSync(cwd));
    if (installed) return installed;
  } catch (error) {
    // A broken package.json is not a tier signal; fall through to the token.
    if (!(error instanceof PackageJsonInvalidError)) throw error;
  }

  // Fallback to token detection (for init command or if no package installed yet)
  const token = detectProTokenSync(cwd);
  return token ? 'pro' : 'free';
}

/**
 * Get package name based on tier
 *
 * @param tier - 'free' or 'pro'
 * @returns Full npm package name
 */
export function getWebAwesomePackage(tier: Tier): string {
  return tier === 'pro' ? WEB_AWESOME_PRO_PACKAGE : WEB_AWESOME_FREE_PACKAGE;
}
