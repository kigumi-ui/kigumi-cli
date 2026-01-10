/**
 * Token Manager
 *
 * Manages Web Awesome Pro tokens - validation, loading, and saving to .env
 */

import fs from 'fs-extra';
import path from 'path';
import * as p from '@clack/prompts';

/**
 * Check if token format is valid (basic format check)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Token should be non-empty and not contain obvious invalid characters
  const trimmed = token.trim();
  if (trimmed.length < 10) {
    return false; // Too short to be a real token
  }

  // Basic format check - should be alphanumeric with underscores/hyphens
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

/**
 * Load token from .env file
 */
export async function loadTokenFromEnv(cwd: string): Promise<string | null> {
  const envPath = path.join(cwd, '.env');

  try {
    if (!(await fs.pathExists(envPath))) {
      return null;
    }

    const envContent = await fs.readFile(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Check if line contains WEBAWESOME_NPM_TOKEN or old WA_TOKEN
      if (
        trimmed.startsWith('WEBAWESOME_NPM_TOKEN=') ||
        trimmed.startsWith('WA_TOKEN=')
      ) {
        const token = trimmed.split('=')[1]?.trim();
        if (token && token !== 'your-token-here') {
          return token;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Save token to .env file
 */
export async function saveTokenToEnv(
  token: string,
  cwd: string
): Promise<void> {
  const envPath = path.join(cwd, '.env');
  let envContent = '';

  // Read existing .env if it exists
  if (await fs.pathExists(envPath)) {
    envContent = await fs.readFile(envPath, 'utf-8');
  }

  const lines = envContent.split('\n');
  let tokenUpdated = false;

  // Update existing token line or prepare to add new one
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Replace both old WA_TOKEN and new WEBAWESOME_NPM_TOKEN
    if (
      trimmed.startsWith('WEBAWESOME_NPM_TOKEN=') ||
      trimmed.startsWith('WA_TOKEN=')
    ) {
      lines[i] = `WEBAWESOME_NPM_TOKEN=${token}`;
      tokenUpdated = true;
      break;
    }
  }

  // If token wasn't found, add it
  if (!tokenUpdated) {
    // Add a newline before if content exists and doesn't end with newline
    if (envContent && !envContent.endsWith('\n')) {
      lines.push('');
    }

    lines.push('# Web Awesome Pro Authentication Token');
    lines.push(`WEBAWESOME_NPM_TOKEN=${token}`);
  }

  // Write back to .env
  await fs.writeFile(envPath, lines.join('\n'));
}

/**
 * Prompt user for token interactively
 */
export async function promptForToken(): Promise<string | undefined> {
  const token = await p.text({
    message: 'Enter your Web Awesome Pro token:',
    placeholder: 'your-token-here',
    validate: (value) => {
      if (!value) {
        return 'Token is required for Pro tier';
      }
      if (!isValidTokenFormat(value)) {
        return 'Invalid token format';
      }
    },
  });

  if (p.isCancel(token)) {
    return undefined;
  }

  return token as string;
}
