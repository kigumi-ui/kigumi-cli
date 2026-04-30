/**
 * Registry Cache Tests
 *
 * Tests for src/utils/registry-cache.ts — disk-based cache for
 * community registry data and component files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  RegistryCache,
  getRegistryCache,
  resetRegistryCache,
} from '../../src/utils/registry-cache.js';
import { REGISTRY_CACHE_TTL_MS } from '../../src/constants.js';
import type { GitHubRegistrySource } from '../../src/utils/github-fetcher.js';
import type { Framework } from '../../src/schemas/config.js';
import type { CommunityRegistry } from '../../src/schemas/community-registry.js';

// =============================================================================
// Shared Fixtures
// =============================================================================

let testDir: string;
let cache: RegistryCache;

const testSource: GitHubRegistrySource = {
  kind: 'github',
  url: 'https://github.com/test/registry',
  owner: 'test',
  repo: 'registry',
  branch: 'main',
};

const testRegistry: CommunityRegistry = {
  name: 'Test Registry',
  version: '1.0.0',
  frameworks: ['react'] as Framework[],
  components: {},
  themes: {},
};

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-cache-test-'));
  cache = new RegistryCache(testDir);
});

afterEach(async () => {
  vi.restoreAllMocks();
  resetRegistryCache();
  await fs.remove(testDir);
});

// =============================================================================
// Cache Hit / Miss
// =============================================================================

describe('RegistryCache — cache hit/miss', () => {
  it('getRegistry returns null when cache is empty', async () => {
    const result = await cache.getRegistry(testSource);
    expect(result).toBeNull();
  });

  it('setRegistry then getRegistry returns the data', async () => {
    await cache.setRegistry(testSource, testRegistry);
    const result = await cache.getRegistry(testSource);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Test Registry');
    expect(result!.version).toBe('1.0.0');
    expect(result!.components).toEqual({});
    expect(result!.themes).toEqual({});
  });

  it('getFile returns null when not cached', async () => {
    const result = await cache.getFile(testSource, 'components/Button.tsx');
    expect(result).toBeNull();
  });

  it('setFile then getFile returns content', async () => {
    const content = 'export const Button = () => <button>Click</button>';
    await cache.setFile(testSource, 'components/Button.tsx', content);

    const result = await cache.getFile(testSource, 'components/Button.tsx');
    expect(result).toBe(content);
  });
});

// =============================================================================
// TTL Expiry
// =============================================================================

describe('RegistryCache — TTL expiry', () => {
  it('getRegistry returns null when cache is expired', async () => {
    const now = Date.now();

    // Set the registry at "now"
    vi.spyOn(Date, 'now').mockReturnValue(now);
    await cache.setRegistry(testSource, testRegistry);

    // Advance time past the TTL
    vi.spyOn(Date, 'now').mockReturnValue(now + REGISTRY_CACHE_TTL_MS + 1);
    const result = await cache.getRegistry(testSource);

    expect(result).toBeNull();
  });
});

// =============================================================================
// invalidate
// =============================================================================

describe('RegistryCache — invalidate', () => {
  it('invalidate(source) removes only that source cache', async () => {
    const otherSource: GitHubRegistrySource = {
      kind: 'github',
      url: 'https://github.com/other/components',
      owner: 'other',
      repo: 'components',
      branch: 'main',
    };

    const otherRegistry: CommunityRegistry = {
      name: 'Other Registry',
      version: '2.0.0',
      frameworks: ['vue'] as Framework[],
      components: {},
      themes: {},
    };

    await cache.setRegistry(testSource, testRegistry);
    await cache.setRegistry(otherSource, otherRegistry);

    await cache.invalidate(testSource);

    // testSource should be gone
    const testResult = await cache.getRegistry(testSource);
    expect(testResult).toBeNull();

    // otherSource should still exist
    const otherResult = await cache.getRegistry(otherSource);
    expect(otherResult).not.toBeNull();
    expect(otherResult!.name).toBe('Other Registry');
  });

  it('after invalidate, getRegistry returns null', async () => {
    await cache.setRegistry(testSource, testRegistry);
    await cache.invalidate(testSource);

    const result = await cache.getRegistry(testSource);
    expect(result).toBeNull();
  });
});

// =============================================================================
// invalidateAll
// =============================================================================

describe('RegistryCache — invalidateAll', () => {
  it('invalidateAll removes all cached registries', async () => {
    const sourceA: GitHubRegistrySource = {
      kind: 'github',
      url: 'https://github.com/a/repo',
      owner: 'a',
      repo: 'repo',
      branch: 'main',
    };
    const sourceB: GitHubRegistrySource = {
      kind: 'github',
      url: 'https://github.com/b/repo',
      owner: 'b',
      repo: 'repo',
      branch: 'main',
    };

    const registryA = { ...testRegistry, name: 'Registry A' };
    const registryB = { ...testRegistry, name: 'Registry B' };

    await cache.setRegistry(sourceA, registryA);
    await cache.setRegistry(sourceB, registryB);

    await cache.invalidateAll();

    const resultA = await cache.getRegistry(sourceA);
    const resultB = await cache.getRegistry(sourceB);
    expect(resultA).toBeNull();
    expect(resultB).toBeNull();
  });

  it('after invalidateAll, getRegistry for any source returns null', async () => {
    await cache.setRegistry(testSource, testRegistry);
    await cache.invalidateAll();

    const result = await cache.getRegistry(testSource);
    expect(result).toBeNull();
  });
});

// =============================================================================
// Corrupted meta.json
// =============================================================================

describe('RegistryCache — corrupted meta.json', () => {
  it('getRegistry returns null for invalid JSON in meta.json (does not throw)', async () => {
    // Write a valid registry.json but corrupt meta.json
    const dir = path.join(testDir, 'test-registry');
    await fs.ensureDir(dir);
    await fs.writeJSON(path.join(dir, 'registry.json'), testRegistry, {
      spaces: 2,
    });
    await fs.writeFile(path.join(dir, 'meta.json'), '{ broken json !!!');

    const result = await cache.getRegistry(testSource);
    expect(result).toBeNull();
  });
});

// =============================================================================
// Singleton
// =============================================================================

describe('getRegistryCache / resetRegistryCache — singleton', () => {
  it('getRegistryCache returns same instance', () => {
    const a = getRegistryCache();
    const b = getRegistryCache();
    expect(a).toBe(b);
  });

  it('resetRegistryCache then getRegistryCache returns new instance', () => {
    const first = getRegistryCache();
    resetRegistryCache();
    const second = getRegistryCache();

    expect(second).not.toBe(first);
    expect(second).toBeInstanceOf(RegistryCache);
  });
});
