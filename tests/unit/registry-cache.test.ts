/**
 * Registry Cache Tests
 *
 * Tests for src/utils/registry-cache.ts — disk-based cache for
 * community registry files.
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

  it('caches nested paths without collision', async () => {
    await cache.setFile(testSource, 'react/Button/Button.tsx', 'react');
    await cache.setFile(testSource, 'vue/Button/Button.vue', 'vue');

    expect(await cache.getFile(testSource, 'react/Button/Button.tsx')).toBe(
      'react'
    );
    expect(await cache.getFile(testSource, 'vue/Button/Button.vue')).toBe(
      'vue'
    );
  });

  it('setFile overwrites a previously cached file', async () => {
    await cache.setFile(testSource, 'a.txt', 'first');
    await cache.setFile(testSource, 'a.txt', 'second');

    expect(await cache.getFile(testSource, 'a.txt')).toBe('second');
  });
});

// =============================================================================
// TTL Expiry
// =============================================================================

describe('RegistryCache — TTL expiry', () => {
  it('getFile returns null once the entry is older than the TTL', async () => {
    await cache.setFile(testSource, 'components/Button.tsx', 'cached');

    // Backdate the file past the TTL rather than mocking Date.now, so the
    // check runs against the real mtime the cache reads.
    const cachedPath = path.join(
      testDir,
      'test-registry-main',
      'files',
      'components/Button.tsx'
    );
    const stale = new Date(Date.now() - REGISTRY_CACHE_TTL_MS - 60_000);
    await fs.utimes(cachedPath, stale, stale);

    expect(await cache.getFile(testSource, 'components/Button.tsx')).toBeNull();
  });

  it('getFile still returns content just inside the TTL', async () => {
    await cache.setFile(testSource, 'components/Button.tsx', 'cached');

    const cachedPath = path.join(
      testDir,
      'test-registry-main',
      'files',
      'components/Button.tsx'
    );
    const fresh = new Date(Date.now() - REGISTRY_CACHE_TTL_MS + 60_000);
    await fs.utimes(cachedPath, fresh, fresh);

    expect(await cache.getFile(testSource, 'components/Button.tsx')).toBe(
      'cached'
    );
  });
});

// =============================================================================
// Branch isolation
// =============================================================================

describe('RegistryCache — branch isolation', () => {
  const mainBranch: GitHubRegistrySource = {
    kind: 'github',
    url: 'https://github.com/acme/registry',
    owner: 'acme',
    repo: 'registry',
    branch: 'main',
  };
  const stagingBranch: GitHubRegistrySource = {
    ...mainBranch,
    url: 'https://github.com/acme/registry/tree/staging',
    branch: 'staging',
  };

  it('does not serve one branch a file cached for another', async () => {
    await cache.setFile(mainBranch, 'components/Button.tsx', 'main version');

    expect(
      await cache.getFile(stagingBranch, 'components/Button.tsx')
    ).toBeNull();
    expect(await cache.getFile(mainBranch, 'components/Button.tsx')).toBe(
      'main version'
    );
  });

  it('keeps both branches when each caches the same path', async () => {
    await cache.setFile(mainBranch, 'Button.tsx', 'from main');
    await cache.setFile(stagingBranch, 'Button.tsx', 'from staging');

    expect(await cache.getFile(mainBranch, 'Button.tsx')).toBe('from main');
    expect(await cache.getFile(stagingBranch, 'Button.tsx')).toBe(
      'from staging'
    );
  });

  it('flattens slashes in branch names into a single directory', async () => {
    const featureBranch: GitHubRegistrySource = {
      ...mainBranch,
      branch: 'feat/new-components',
    };

    await cache.setFile(featureBranch, 'Button.tsx', 'from feature');

    expect(await cache.getFile(featureBranch, 'Button.tsx')).toBe(
      'from feature'
    );
    const entries = await fs.readdir(testDir);
    expect(entries).toContain('acme-registry-feat-new-components');
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
