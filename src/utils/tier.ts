/**
 * Tier Detection Utility
 *
 * Determines Free vs Pro tier based on .env file
 */

import fs from 'fs-extra';
import path from 'path';

export type Tier = 'free' | 'pro';

/**
 * Detect tier from .env file
 * 
 * Pro tier requires WEBAWESOME_NPM_TOKEN in .env
 * Free tier is the default if no token is found
 */
export async function detectTier(cwd: string): Promise<Tier> {
  const envPath = path.join(cwd, '.env');
  
  if (!(await fs.pathExists(envPath))) {
    return 'free';
  }

  const envContent = await fs.readFile(envPath, 'utf-8');
  const tokenMatch = envContent.match(/^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m);
  
  if (tokenMatch && tokenMatch[1] && tokenMatch[1].length >= 10) {
    return 'pro';
  }

  return 'free';
}

/**
 * Synchronous version of detectTier
 */
export function detectTierSync(cwd: string): Tier {
  const envPath = path.join(cwd, '.env');
  
  if (!fs.existsSync(envPath)) {
    return 'free';
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const tokenMatch = envContent.match(/^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m);
  
  if (tokenMatch && tokenMatch[1] && tokenMatch[1].length >= 10) {
    return 'pro';
  }

  return 'free';
}

/**
 * Get Pro token from .env file
 */
export async function getProToken(cwd: string): Promise<string | null> {
  const envPath = path.join(cwd, '.env');
  
  if (!(await fs.pathExists(envPath))) {
    return null;
  }

  const envContent = await fs.readFile(envPath, 'utf-8');
  const tokenMatch = envContent.match(/^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m);
  
  return tokenMatch && tokenMatch[1] ? tokenMatch[1].trim() : null;
}

/**
 * Get package name based on tier
 */
export function getWebAwesomePackage(tier: Tier): string {
  return tier === 'pro' 
    ? '@awesome.me/webawesome-pro'
    : '@awesome.me/webawesome';
}
