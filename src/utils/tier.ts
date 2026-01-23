/**
 * Tier Detection Utility
 *
 * PURPOSE: Determines Free vs Pro tier based on .env file presence and token validity.
 *
 * EXPORTS:
 * - detectTier() - Async tier detection (PREFERRED)
 * - detectTierSync() - Sync version (use only when absolutely necessary)
 * - getProToken() - Extract token from .env
 * - getWebAwesomePackage() - Get npm package name for tier
 *
 * @see AGENTS.md Rule #8 for tier system architecture
 */

import fs from 'fs-extra';
import path from 'path';
import {
  ENV_FILE_NAME,
  ENV_TOKEN_REGEX,
  MIN_TOKEN_LENGTH,
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../constants.js';

export type Tier = 'free' | 'pro';

/**
 * Detect tier from .env file
 *
 * Pro tier requires WEBAWESOME_NPM_TOKEN in .env with valid length.
 * Free tier is the default if no token is found.
 *
 * @param cwd - Current working directory
 * @returns 'pro' if valid token exists, 'free' otherwise
 */
export async function detectTier(cwd: string): Promise<Tier> {
  const envPath = path.join(cwd, ENV_FILE_NAME);

  if (!(await fs.pathExists(envPath))) {
    return 'free';
  }

  const envContent = await fs.readFile(envPath, 'utf-8');
  const tokenMatch = envContent.match(ENV_TOKEN_REGEX);

  // Token length validation: MIN_TOKEN_LENGTH chars minimum
  // WHY: Cloudsmith tokens are typically 40+ chars, MIN_TOKEN_LENGTH is a safety threshold
  // to avoid accepting malformed/empty values like "=" or "token"
  if (tokenMatch && tokenMatch[1] && tokenMatch[1].length >= MIN_TOKEN_LENGTH) {
    return 'pro';
  }

  return 'free';
}

/**
 * Synchronous version of detectTier
 *
 * WHY: Some code paths (e.g., validators) need synchronous tier detection.
 * Prefer detectTier() when possible.
 */
export function detectTierSync(cwd: string): Tier {
  const envPath = path.join(cwd, ENV_FILE_NAME);

  if (!fs.existsSync(envPath)) {
    return 'free';
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const tokenMatch = envContent.match(ENV_TOKEN_REGEX);

  if (tokenMatch && tokenMatch[1] && tokenMatch[1].length >= MIN_TOKEN_LENGTH) {
    return 'pro';
  }

  return 'free';
}

/**
 * Get Pro token from .env file
 *
 * @param cwd - Current working directory
 * @returns Token string if found, null otherwise
 */
export async function getProToken(cwd: string): Promise<string | null> {
  const envPath = path.join(cwd, ENV_FILE_NAME);

  if (!(await fs.pathExists(envPath))) {
    return null;
  }

  const envContent = await fs.readFile(envPath, 'utf-8');
  const tokenMatch = envContent.match(ENV_TOKEN_REGEX);

  return tokenMatch && tokenMatch[1] ? tokenMatch[1].trim() : null;
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
