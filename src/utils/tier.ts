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
 * - getProToken() - Get token from any source
 * - getWebAwesomePackage() - Get npm package name for tier
 *
 * @see AGENTS.md Rule #8 for tier system architecture
 */

import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../constants.js';
import { detectProToken, detectProTokenSync } from './token.js';

export const tierSchema = z.enum(['free', 'pro'], {
  error: () => 'Must be either "free" or "pro"',
});

export type Tier = z.infer<typeof tierSchema>;

/**
 * Detect tier based on installed package
 *
 * Checks package.json to see if @awesome.me/webawesome-pro is installed.
 * Falls back to token detection if package.json doesn't exist.
 *
 * @param cwd - Current working directory
 * @returns 'pro' if webawesome-pro is installed, 'free' otherwise
 */
export async function detectTier(cwd: string): Promise<Tier> {
  // First check package.json for installed package
  const packageJsonPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // If webawesome-pro is installed, it's Pro tier
      if (deps[WEB_AWESOME_PRO_PACKAGE]) {
        return 'pro';
      }

      // If webawesome (free) is installed, it's Free tier
      if (deps[WEB_AWESOME_FREE_PACKAGE]) {
        return 'free';
      }
    } catch (_error) {
      // Ignore JSON parse errors, fall through to token detection
    }
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
  // First check package.json for installed package
  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.pathExistsSync(packageJsonPath)) {
    try {
      const packageJson = fs.readJsonSync(packageJsonPath);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // If webawesome-pro is installed, it's Pro tier
      if (deps[WEB_AWESOME_PRO_PACKAGE]) {
        return 'pro';
      }

      // If webawesome (free) is installed, it's Free tier
      if (deps[WEB_AWESOME_FREE_PACKAGE]) {
        return 'free';
      }
    } catch (_error) {
      // Ignore JSON parse errors, fall through to token detection
    }
  }

  // Fallback to token detection (for init command or if no package installed yet)
  const token = detectProTokenSync(cwd);
  return token ? 'pro' : 'free';
}

/**
 * Get Pro token from fallback chain
 *
 * @param cwd - Current working directory
 * @returns Token string if found, null otherwise
 */
export async function getProToken(cwd: string): Promise<string | null> {
  return detectProToken(cwd);
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
