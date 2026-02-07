/**
 * Token Detection Utility
 *
 * PURPOSE: Detects Web Awesome Pro token from multiple sources with fallback chain.
 *
 * FALLBACK CHAIN (in priority order):
 * 1. Environment Variable: $WEBAWESOME_NPM_TOKEN (for CI/CD)
 * 2. Global ~/.npmrc (recommended for local development)
 * 3. Project .env file (backwards compatible)
 *
 * EXPORTS:
 * - detectProToken() - Get token from any source
 * - detectProTokenSync() - Sync version
 * - getTokenSource() - Identify where token was found
 *
 * @see AGENTS.md for token handling architecture
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  ENV_FILE_NAME,
  ENV_TOKEN_KEY,
  ENV_TOKEN_REGEX,
  MIN_TOKEN_LENGTH,
  NPM_PRO_REGISTRY,
} from '../constants.js';

export type TokenSource = 'env' | 'npmrc' | 'dotenv' | null;

interface TokenResult {
  token: string | null;
  source: TokenSource;
}

/**
 * Detect Pro token from fallback chain
 *
 * Priority:
 * 1. $WEBAWESOME_NPM_TOKEN environment variable
 * 2. Global ~/.npmrc (//npm.cloudsmith.io/.../webawesome-pro/:_authToken)
 * 3. Project .env file
 *
 * @param cwd - Current working directory (for .env lookup)
 * @returns Token string if found, null otherwise
 */
export async function detectProToken(cwd: string): Promise<string | null> {
  const result = await detectProTokenWithSource(cwd);
  return result.token;
}

/**
 * Synchronous version of detectProToken
 */
export function detectProTokenSync(cwd: string): string | null {
  const result = detectProTokenWithSourceSync(cwd);
  return result.token;
}

/**
 * Get token source without returning the actual token
 *
 * Useful for displaying where the token was found without exposing it.
 *
 * @param cwd - Current working directory
 * @returns Source identifier or null
 */
export async function getTokenSource(cwd: string): Promise<TokenSource> {
  const result = await detectProTokenWithSource(cwd);
  return result.source;
}

/**
 * Synchronous version of getTokenSource
 */
export function getTokenSourceSync(cwd: string): TokenSource {
  const result = detectProTokenWithSourceSync(cwd);
  return result.source;
}

/**
 * Internal: Detect token with source information (async)
 */
async function detectProTokenWithSource(cwd: string): Promise<TokenResult> {
  // 1. Check environment variable first (CI/CD priority)
  const envToken = getTokenFromEnvVar();
  if (envToken) {
    return { token: envToken, source: 'env' };
  }

  // 2. Check global ~/.npmrc (skip in tests if env var set)
  if (!process.env.KIGUMI_SKIP_GLOBAL_NPMRC) {
    const npmrcToken = await getTokenFromGlobalNpmrc();
    if (npmrcToken) {
      return { token: npmrcToken, source: 'npmrc' };
    }
  }

  // 3. Check project .env file (backwards compatible)
  const dotenvToken = await getTokenFromDotenv(cwd);
  if (dotenvToken) {
    return { token: dotenvToken, source: 'dotenv' };
  }

  return { token: null, source: null };
}

/**
 * Internal: Detect token with source information (sync)
 */
function detectProTokenWithSourceSync(cwd: string): TokenResult {
  // 1. Check environment variable first
  const envToken = getTokenFromEnvVar();
  if (envToken) {
    return { token: envToken, source: 'env' };
  }

  // 2. Check global ~/.npmrc (skip in tests if env var set)
  if (!process.env.KIGUMI_SKIP_GLOBAL_NPMRC) {
    const npmrcToken = getTokenFromGlobalNpmrcSync();
    if (npmrcToken) {
      return { token: npmrcToken, source: 'npmrc' };
    }
  }

  // 3. Check project .env file
  const dotenvToken = getTokenFromDotenvSync(cwd);
  if (dotenvToken) {
    return { token: dotenvToken, source: 'dotenv' };
  }

  return { token: null, source: null };
}

/**
 * Get token from environment variable
 */
function getTokenFromEnvVar(): string | null {
  const token = process.env[ENV_TOKEN_KEY];
  if (token && token.length >= MIN_TOKEN_LENGTH) {
    return token.trim();
  }
  return null;
}

/**
 * Get token from global ~/.npmrc (async)
 *
 * Looks for: //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=TOKEN
 */
async function getTokenFromGlobalNpmrc(): Promise<string | null> {
  const npmrcPath = path.join(os.homedir(), '.npmrc');

  if (!(await fs.pathExists(npmrcPath))) {
    return null;
  }

  const content = await fs.readFile(npmrcPath, 'utf-8');
  return extractTokenFromNpmrc(content);
}

/**
 * Get token from global ~/.npmrc (sync)
 */
function getTokenFromGlobalNpmrcSync(): string | null {
  const npmrcPath = path.join(os.homedir(), '.npmrc');

  if (!fs.existsSync(npmrcPath)) {
    return null;
  }

  const content = fs.readFileSync(npmrcPath, 'utf-8');
  return extractTokenFromNpmrc(content);
}

/**
 * Extract auth token from npmrc content
 *
 * Matches patterns like:
 * - //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=TOKEN
 * - //npm.cloudsmith.io/fortawesome/webawesome-pro:_authToken=TOKEN
 */
function extractTokenFromNpmrc(content: string): string | null {
  // Extract registry host from NPM_PRO_REGISTRY (remove https://)
  const registryHost = NPM_PRO_REGISTRY.replace('https://', '');

  // Match auth token for the Pro registry
  // Supports both //:_authToken and :_authToken patterns
  const patterns = [
    new RegExp(`//${registryHost}/?:_authToken=(.+)`, 'm'),
    new RegExp(`${registryHost}/?:_authToken=(.+)`, 'm'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const token = match[1].trim();
      if (token.length >= MIN_TOKEN_LENGTH) {
        return token;
      }
    }
  }

  return null;
}

/**
 * Get token from project .env file (async)
 */
async function getTokenFromDotenv(cwd: string): Promise<string | null> {
  const envPath = path.join(cwd, ENV_FILE_NAME);

  if (!(await fs.pathExists(envPath))) {
    return null;
  }

  const content = await fs.readFile(envPath, 'utf-8');
  return extractTokenFromDotenv(content);
}

/**
 * Get token from project .env file (sync)
 */
function getTokenFromDotenvSync(cwd: string): string | null {
  const envPath = path.join(cwd, ENV_FILE_NAME);

  if (!fs.existsSync(envPath)) {
    return null;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  return extractTokenFromDotenv(content);
}

/**
 * Extract token from .env content
 */
function extractTokenFromDotenv(content: string): string | null {
  const match = content.match(ENV_TOKEN_REGEX);
  if (match && match[1]) {
    const token = match[1].trim();
    if (token.length >= MIN_TOKEN_LENGTH) {
      return token;
    }
  }
  return null;
}

/**
 * Get human-readable description of token source
 *
 * Useful for user-facing messages.
 */
export function describeTokenSource(source: TokenSource): string {
  switch (source) {
    case 'env':
      return `environment variable ($${ENV_TOKEN_KEY})`;
    case 'npmrc':
      return 'global ~/.npmrc';
    case 'dotenv':
      return 'project .env file';
    default:
      return 'unknown';
  }
}
