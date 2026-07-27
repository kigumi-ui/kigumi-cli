/**
 * Registry Cache
 *
 * Caches registry.json and component files on disk to avoid
 * re-fetching on every `kigumi add --from` invocation.
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { KIGUMI_CACHE_DIR, REGISTRY_CACHE_TTL_MS } from '../constants.js';
import type { CommunityRegistry } from '../schemas/community-registry.js';
import type { GitHubRegistrySource } from './github-fetcher.js';

interface CacheMetadata {
  fetchedAt: number;
  version: string;
}

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
 * Get the cache directory for a specific registry
 */
function getCacheDir(source: GitHubRegistrySource): string {
  return path.join(
    os.homedir(),
    KIGUMI_CACHE_DIR,
    'registries',
    getCacheKey(source)
  );
}

/**
 * Registry cache for storing fetched registry data on disk
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

  /**
   * Get cached registry.json if it exists and is fresh
   */
  async getRegistry(
    source: GitHubRegistrySource
  ): Promise<CommunityRegistry | null> {
    const dir = this.getDir(source);
    const registryPath = path.join(dir, 'registry.json');
    const metaPath = path.join(dir, 'meta.json');

    if (
      !(await fs.pathExists(registryPath)) ||
      !(await fs.pathExists(metaPath))
    ) {
      return null;
    }

    try {
      const meta: CacheMetadata = await fs.readJSON(metaPath);

      // Check TTL
      if (Date.now() - meta.fetchedAt > REGISTRY_CACHE_TTL_MS) {
        return null; // Expired
      }

      return await fs.readJSON(registryPath);
    } catch (_error) {
      return null;
    }
  }

  /**
   * Cache a registry.json
   */
  async setRegistry(
    source: GitHubRegistrySource,
    registry: CommunityRegistry
  ): Promise<void> {
    const dir = this.getDir(source);
    await fs.ensureDir(dir);

    const meta: CacheMetadata = {
      fetchedAt: Date.now(),
      version: registry.version,
    };

    await Promise.all([
      fs.writeJSON(path.join(dir, 'registry.json'), registry, { spaces: 2 }),
      fs.writeJSON(path.join(dir, 'meta.json'), meta, { spaces: 2 }),
    ]);
  }

  /**
   * Get a cached file
   */
  async getFile(
    source: GitHubRegistrySource,
    filePath: string
  ): Promise<string | null> {
    const dir = this.getDir(source);
    const cachedPath = path.join(dir, 'files', filePath);

    if (!(await fs.pathExists(cachedPath))) {
      return null;
    }

    try {
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
    const dir = this.getDir(source);
    const cachedPath = path.join(dir, 'files', filePath);

    await fs.ensureDir(path.dirname(cachedPath));
    await fs.writeFile(cachedPath, content);
  }

  /**
   * Invalidate cache for a specific registry
   */
  async invalidate(source: GitHubRegistrySource): Promise<void> {
    const dir = this.getDir(source);
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
    }
  }

  /**
   * Invalidate all cached registries
   */
  async invalidateAll(): Promise<void> {
    if (await fs.pathExists(this.baseDir)) {
      await fs.remove(this.baseDir);
    }
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

export { getCacheDir };
