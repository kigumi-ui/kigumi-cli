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

import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../constants.js';
import { detectProToken, detectProTokenSync } from './token.js';

export type Tier = 'free' | 'pro';

/**
 * Detect tier based on token availability
 *
 * Pro tier requires a valid token from any source in the fallback chain.
 * Free tier is the default if no token is found.
 *
 * @param cwd - Current working directory
 * @returns 'pro' if valid token exists, 'free' otherwise
 */
export async function detectTier(cwd: string): Promise<Tier> {
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
