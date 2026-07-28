/**
 * Registry Cache
 *
 * Caches community registry files on disk so repeated `kigumi add --from`
 * runs against the same registry do not re-download every file.
 *
 * Entries expire after `REGISTRY_CACHE_TTL_MS`. Without an expiry a component
 * fetched once would be served from disk forever, and users would silently
 * keep installing a stale copy after the registry moved on.
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { KIGUMI_CACHE_DIR, REGISTRY_CACHE_TTL_MS } from '../constants.js';
import type { GitHubRegistrySource } from './github-fetcher.js';

/**
 * Build the on-disk cache key for a registry source.
 *
 * The branch is part of the key: two branches of the same repository are
 * distinct registries and must not share cached files. Slashes in branch
 * names (`feat/foo`) are flattened so the key stays a single directory.
 */
function getCacheKey(source: GitHubRegistrySource): string {
  const branch = source.branch.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${source.owner}-${source.repo}-${branch}`;
}

/**
 * Registry cache for storing fetched registry files on disk
 */
export class RegistryCache {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir =
      baseDir || path.join(os.homedir(), KIGUMI_CACHE_DIR, 'registries');
  }

  private getDir(source: GitHubRegistrySource): string {
    return path.join(this.baseDir, getCacheKey(source));
  }

  private getFilePath(source: GitHubRegistrySource, filePath: string): string {
    return path.join(this.getDir(source), 'files', filePath);
  }

  /**
   * Get a cached file, or null when it is absent or older than the TTL.
   */
  async getFile(
    source: GitHubRegistrySource,
    filePath: string
  ): Promise<string | null> {
    const cachedPath = this.getFilePath(source, filePath);

    try {
      const stats = await fs.stat(cachedPath);
      if (Date.now() - stats.mtimeMs > REGISTRY_CACHE_TTL_MS) {
        return null;
      }
      return await fs.readFile(cachedPath, 'utf-8');
    } catch (_error) {
      return null;
    }
  }

  /**
   * Cache a file
   */
  async setFile(
    source: GitHubRegistrySource,
    filePath: string,
    content: string
  ): Promise<void> {
    const cachedPath = this.getFilePath(source, filePath);

    await fs.ensureDir(path.dirname(cachedPath));
    await fs.writeFile(cachedPath, content);
  }
}

/** Default singleton cache instance */
let defaultCache: RegistryCache | undefined;

export function getRegistryCache(): RegistryCache {
  if (!defaultCache) {
    defaultCache = new RegistryCache();
  }
  return defaultCache;
}

/**
 * Reset the default cache instance (for testing)
 */
export function resetRegistryCache(): void {
  defaultCache = undefined;
}
