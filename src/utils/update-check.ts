/**
 * CLI Update Check
 *
 * Lightweight, non-blocking check for newer CLI versions on npm.
 * Uses native fetch (Node 20+) with a short timeout and 24h local cache
 * to avoid hammering the registry. Silently skips in CI or non-TTY.
 *
 * @public
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  CLI_VERSION,
  KIGUMI_CACHE_DIR,
  NPM_REGISTRY_URL,
  UPDATE_CHECK_CACHE_TTL_MS,
  UPDATE_CHECK_TIMEOUT_MS,
  UPDATE_CHECK_CACHE_FILE,
  GITHUB_REPO_URL,
} from '../constants.js';

export interface UpdateCheckResult {
  /** Latest version available on npm */
  latestVersion: string;
  /** Currently running version */
  currentVersion: string;
}

interface CacheEntry {
  latestVersion: string;
  checkedAt: number;
}

/**
 * Compare two semver strings.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function getCachePath(): string {
  return join(homedir(), KIGUMI_CACHE_DIR, UPDATE_CHECK_CACHE_FILE);
}

function readCache(): CacheEntry | null {
  try {
    const raw = readFileSync(getCachePath(), 'utf-8');
    const data = JSON.parse(raw) as CacheEntry;
    if (data.latestVersion && typeof data.checkedAt === 'number') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    const cachePath = getCachePath();
    const cacheDir = join(homedir(), KIGUMI_CACHE_DIR);
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cachePath, JSON.stringify(entry));
  } catch {
    // Cache write failure is not critical
  }
}

function shouldSkip(): boolean {
  // Skip in CI environments
  if (process.env.CI) return true;

  // Skip when explicitly opted out
  if (process.env.NO_UPDATE_CHECK) return true;

  // Skip when not a TTY (piped output)
  if (!process.stdout.isTTY) return true;

  return false;
}

/**
 * Check if a newer version of the CLI is available.
 *
 * Returns update info if a newer version exists, null otherwise.
 * Never throws — all errors are silently swallowed.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult | null> {
  if (shouldSkip()) return null;

  try {
    // Check cache first
    const cached = readCache();
    if (cached && Date.now() - cached.checkedAt < UPDATE_CHECK_CACHE_TTL_MS) {
      if (compareSemver(cached.latestVersion, CLI_VERSION) > 0) {
        return {
          latestVersion: cached.latestVersion,
          currentVersion: CLI_VERSION,
        };
      }
      return null;
    }

    // Fetch latest version from npm
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      UPDATE_CHECK_TIMEOUT_MS
    );

    const response = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = (await response.json()) as { version?: string };
    const latestVersion = data.version;

    if (!latestVersion || typeof latestVersion !== 'string') return null;

    // Cache the result
    writeCache({ latestVersion, checkedAt: Date.now() });

    if (compareSemver(latestVersion, CLI_VERSION) > 0) {
      return { latestVersion, currentVersion: CLI_VERSION };
    }

    return null;
  } catch {
    // Network errors, timeouts, parse errors — all silently ignored
    return null;
  }
}

/**
 * Format the update notification message for display.
 */
export function formatUpdateNotification(result: UpdateCheckResult): string {
  const { currentVersion, latestVersion } = result;
  const releaseUrl = `${GITHUB_REPO_URL}/releases`;

  const lines = [
    '',
    `  Update available: ${currentVersion} \u2192 ${latestVersion}`,
    '',
    '  Run: npx kigumi@latest',
    `  Changelog: ${releaseUrl}`,
    '',
    '  Then run: npx kigumi upgrade',
    '  to update your project config',
    '',
  ];

  const maxLen = Math.max(...lines.map((l) => l.length));
  const top = '\u256D' + '\u2500'.repeat(maxLen + 1) + '\u256E';
  const bottom = '\u2570' + '\u2500'.repeat(maxLen + 1) + '\u256F';
  const padded = lines.map(
    (l) => '\u2502' + l + ' '.repeat(maxLen - l.length) + ' \u2502'
  );

  return [top, ...padded, bottom].join('\n');
}
