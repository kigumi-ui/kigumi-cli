/**
 * Failure-mode pin (F-X9).
 *
 * Three families of unit-tier failure injection, each scoped per test
 * with `vi.spyOn` and restored in `afterEach` via `vi.restoreAllMocks()`:
 *
 *   1. Disk failures: ENOSPC / EACCES on `fs.writeJson` propagate as
 *      thrown errors with the original `code` preserved. No type
 *      promotion (cluster A did not promote these to a typed error
 *      class; T pins current behavior).
 *   2. GitHub fetcher 401/403/429: `fetchFile` throws a plain `Error`
 *      whose message contains "Authentication failed" or
 *      "Failed to fetch ... <status>". Cluster A intentionally did not
 *      promote these to `AuthenticationError` / `RegistryError`; T pins
 *      the message-substring contract. Promotion is a future concern.
 *   3. Network unreachable: `globalThis.fetch` rejecting with a
 *      `TypeError` (Node's fetch failure shape) propagates from
 *      `fetchFile` as the same `TypeError`.
 *
 * `vi.spyOn` does not match `scripts/check-mock-budget.ts`'s `/vi\.mock/g`
 * regex, so the budget gate stays at the post-Cluster-S value of 16.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fsExtra from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { saveConfig } from '../../src/utils/config.js';
import { fetchFile } from '../../src/utils/github-fetcher.js';
import type { GitHubRegistrySource } from '../../src/utils/github-fetcher.js';

let testDir: string;

const baseConfig = {
  framework: 'react' as const,
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
};

const githubSource: GitHubRegistrySource = {
  kind: 'github',
  url: 'https://github.com/example/registry',
  owner: 'example',
  repo: 'registry',
  branch: 'main',
};

beforeEach(async () => {
  testDir = await fsExtra.mkdtemp(path.join(os.tmpdir(), 'kigumi-failure-'));
  await fsExtra.writeJson(path.join(testDir, 'kigumi.config.json'), baseConfig);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fsExtra.remove(testDir);
});

describe('failure-modes: disk', () => {
  it('saveConfig propagates ENOSPC from writeJson with code preserved', async () => {
    const ioErr = Object.assign(new Error('ENOSPC: no space left on device'), {
      code: 'ENOSPC',
    });
    vi.spyOn(fsExtra, 'writeJson').mockRejectedValueOnce(ioErr);

    let caught: unknown;
    try {
      await saveConfig({ theme: { selected: 'brutalist' } }, testDir);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as NodeJS.ErrnoException).code).toBe('ENOSPC');
    expect((caught as Error).message).toMatch(/ENOSPC/);
  });

  it('saveConfig propagates EACCES from writeJson with code preserved', async () => {
    const ioErr = Object.assign(new Error('EACCES: permission denied'), {
      code: 'EACCES',
    });
    vi.spyOn(fsExtra, 'writeJson').mockRejectedValueOnce(ioErr);

    let caught: unknown;
    try {
      await saveConfig({ theme: { selected: 'brutalist' } }, testDir);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as NodeJS.ErrnoException).code).toBe('EACCES');
    expect((caught as Error).message).toMatch(/EACCES/);
  });
});

describe('failure-modes: github fetcher (HTTP)', () => {
  it('fetchFile throws on 403 with "Authentication failed" in the message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 403, statusText: 'Forbidden' })
    );

    await expect(fetchFile(githubSource, 'registry.json')).rejects.toThrow(
      /Authentication failed/
    );
  });

  it('fetchFile throws on 401 with "Authentication failed" in the message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 401, statusText: 'Unauthorized' })
    );

    await expect(fetchFile(githubSource, 'registry.json')).rejects.toThrow(
      /Authentication failed/
    );
  });

  it('fetchFile throws on 429 with the status code in the message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 429, statusText: 'Too Many Requests' })
    );

    await expect(fetchFile(githubSource, 'registry.json')).rejects.toThrow(
      /429/
    );
  });

  it('fetchFile throws on 404 with "File not found" in the message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 404, statusText: 'Not Found' })
    );

    await expect(fetchFile(githubSource, 'missing.json')).rejects.toThrow(
      /File not found/
    );
  });
});

describe('failure-modes: network', () => {
  it('fetchFile rethrows a TypeError when fetch rejects with ECONNREFUSED', async () => {
    const networkErr = Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('connect ECONNREFUSED 140.82.112.4:443'), {
        code: 'ECONNREFUSED',
      }),
    });
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(networkErr);

    let caught: unknown;
    try {
      await fetchFile(githubSource, 'registry.json');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(TypeError);
    expect((caught as TypeError).message).toBe('fetch failed');
    expect(((caught as TypeError).cause as NodeJS.ErrnoException).code).toBe(
      'ECONNREFUSED'
    );
  });
});
