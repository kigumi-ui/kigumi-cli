#!/usr/bin/env node

/**
 * Setup Web Awesome Pro authentication for package managers.
 *
 * Reads token from .env files and writes it to:
 * - Global ~/.npmrc (for npm/yarn and projects without local .npmrc)
 * - docs/.npmrc (required for pnpm in docs/ - pnpm does not use global auth for scoped registries)
 *
 * The docs/.npmrc file is gitignored. Run this script after cloning to generate it.
 *
 * Zero dependencies - uses only Node.js built-ins (fs, path, os).
 * Mirrors the token detection logic from src/utils/token.ts.
 *
 * Usage: node scripts/setup-npmrc.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.dirname(path.dirname(__filename));

const ENV_TOKEN_KEY = 'WEBAWESOME_NPM_TOKEN';
const MIN_TOKEN_LENGTH = 10;
const PRO_REGISTRY = 'npm.cloudsmith.io/fortawesome/webawesome-pro';
const AUTH_LINE = `//${PRO_REGISTRY}/:_authToken=`;

// --- Token Detection (mirrors src/utils/token.ts fallback chain) ---

function getTokenFromEnvVar() {
  const token = process.env[ENV_TOKEN_KEY];
  return token && token.length >= MIN_TOKEN_LENGTH ? token.trim() : null;
}

function getTokenFromGlobalNpmrc() {
  const npmrcPath = path.join(os.homedir(), '.npmrc');
  if (!fs.existsSync(npmrcPath)) return null;

  const content = fs.readFileSync(npmrcPath, 'utf-8');
  const patterns = [
    new RegExp(`//${PRO_REGISTRY}/?:_authToken=(.+)`, 'm'),
    new RegExp(`${PRO_REGISTRY}/?:_authToken=(.+)`, 'm'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      const token = match[1].trim();
      if (token.length >= MIN_TOKEN_LENGTH) return token;
    }
  }

  return null;
}

function getTokenFromDotenv(dir) {
  const envPath = path.join(dir, '.env');
  if (!fs.existsSync(envPath)) return null;

  const content = fs.readFileSync(envPath, 'utf-8');
  const match = content.match(
    new RegExp(`^\\s*${ENV_TOKEN_KEY}\\s*=\\s*(.+?)\\s*$`, 'm'),
  );
  const token = match?.[1]?.trim();
  return token && token.length >= MIN_TOKEN_LENGTH ? token : null;
}

function detectToken() {
  // 1. Environment variable (highest priority - CI/CD)
  let token = getTokenFromEnvVar();
  if (token) return { token, source: `environment variable ($${ENV_TOKEN_KEY})` };

  // 2. Global ~/.npmrc (already configured)
  token = getTokenFromGlobalNpmrc();
  if (token) return { token, source: 'global ~/.npmrc', alreadyGlobal: true };

  // 3. Docs .env file
  const docsDir = path.join(ROOT_DIR, 'docs');
  token = getTokenFromDotenv(docsDir);
  if (token) return { token, source: 'docs/.env file' };

  // 4. Root .env file
  token = getTokenFromDotenv(ROOT_DIR);
  if (token) return { token, source: 'root .env file' };

  return { token: null, source: null };
}

// --- Global ~/.npmrc Configuration ---

function isGlobalNpmrcConfigured() {
  const npmrcPath = path.join(os.homedir(), '.npmrc');
  if (!fs.existsSync(npmrcPath)) return false;

  const content = fs.readFileSync(npmrcPath, 'utf-8');
  return content.includes(AUTH_LINE);
}

function writeTokenToGlobalNpmrc(token) {
  const npmrcPath = path.join(os.homedir(), '.npmrc');
  let content = '';

  if (fs.existsSync(npmrcPath)) {
    content = fs.readFileSync(npmrcPath, 'utf-8');
    // Remove existing auth line for this registry (update in place)
    content = content
      .split('\n')
      .filter((line) => !line.includes(PRO_REGISTRY + '/:_authToken'))
      .join('\n');
    // Ensure trailing newline
    if (content.length > 0 && !content.endsWith('\n')) {
      content += '\n';
    }
  }

  content += `${AUTH_LINE}${token}\n`;
  fs.writeFileSync(npmrcPath, content);
}

// --- docs/.npmrc (required for pnpm - does not use global auth for scoped registries) ---

function writeDocsNpmrc(token) {
  const docsDir = path.join(ROOT_DIR, 'docs');
  if (!fs.existsSync(docsDir)) return;

  const npmrcPath = path.join(docsDir, '.npmrc');
  const registryUrl = `https://${PRO_REGISTRY}/`;
  const content = `@awesome.me:registry=${registryUrl}
${AUTH_LINE}${token}
//${PRO_REGISTRY}/:always-auth=true
`;
  fs.writeFileSync(npmrcPath, content);
}

// --- Main ---

function main() {
  const { token, source, alreadyGlobal } = detectToken();

  if (!token) {
    console.error('\u274c No Web Awesome Pro token found\n');
    console.error('Configure your token using one of these methods:\n');
    console.error('1. Run this script after creating a .env file:');
    console.error(`   echo "${ENV_TOKEN_KEY}=your_token" > docs/.env`);
    console.error('   pnpm run setup:npmrc\n');
    console.error('2. Set it globally:');
    console.error(
      `   npm config set //${PRO_REGISTRY}/:_authToken your_token\n`,
    );
    console.error('3. Set environment variable:');
    console.error(`   export ${ENV_TOKEN_KEY}=your_token\n`);
    console.error('Get your token from: https://webawesome.com/login');
    process.exit(1);
  }

  // Write to global ~/.npmrc (unless already there)
  if (!alreadyGlobal) {
    writeTokenToGlobalNpmrc(token);
    console.log(`\u2705 Token from ${source} configured in global ~/.npmrc`);
  } else {
    console.log('\u2713 Token already in global ~/.npmrc');
  }

  // Always write to docs/.npmrc (pnpm requires auth in project .npmrc)
  writeDocsNpmrc(token);
  console.log('\u2713 docs/.npmrc updated (gitignored)');
  console.log('   You can now run: pnpm install');
}

main();
