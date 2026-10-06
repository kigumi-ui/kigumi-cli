/**
 * Failure-mode pin (F-X9).
 *
 * Three families of unit-tier failure injection, each scoped per test
 * with `vi.spyOn` and restored in `afterEach` via `vi.restoreAllMocks()`:
 *
 *   1. Disk failures: ENOSPC / EACCES part-way through `saveConfig`'s
 *      write propagate as thrown errors with the original `code`
 *      preserved, and leave the config file as it was (#171). No type
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
import { writeFile } from 'node:fs/promises';
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

/**
 * Fail the next `fs.writeFile` part-way, the way a full disk does: the first
 * bytes reach the file it was given, then the write rejects with `code`.
 * `writeFile` from `node:fs/promises` is not the spied function, so the
 * partial bytes really land.
 */
function failNextWritePartWay(code: string, message: string): void {
  const ioErr = Object.assign(new Error(`${code}: ${message}`), { code });
  vi.spyOn(fsExtra, 'writeFile').mockImplementationOnce(
    async (...args: unknown[]): Promise<void> => {
      const [file, data] = args as [string, string];
      await writeFile(file, data.slice(0, 40));
      throw ioErr;
    }
  );
}

describe('failure-modes: disk', () => {
  it.each([
    ['ENOSPC', 'no space left on device'],
    ['EACCES', 'permission denied'],
  ])(
    'saveConfig propagates %s with code preserved and leaves kigumi.config.json as it was',
    async (code, message) => {
      failNextWritePartWay(code, message);

      let caught: unknown;
      try {
        await saveConfig({ theme: { selected: 'brutalist' } }, testDir);
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(Error);
      expect((caught as NodeJS.ErrnoException).code).toBe(code);
      expect((caught as Error).message).toMatch(new RegExp(code));

      expect(
        await fsExtra.readJson(path.join(testDir, 'kigumi.config.json'))
      ).toEqual(baseConfig);
      expect(await fsExtra.readdir(testDir)).toEqual(['kigumi.config.json']);
    }
  );

  it('saveConfig into package.json#kigumi leaves package.json as it was when the write fails part-way', async () => {
    await fsExtra.remove(path.join(testDir, 'kigumi.config.json'));
    const packageJson = { name: 'host-project', kigumi: baseConfig };
    await fsExtra.writeJson(path.join(testDir, 'package.json'), packageJson);
    failNextWritePartWay('ENOSPC', 'no space left on device');

    await expect(
      saveConfig({ theme: { selected: 'brutalist' } }, testDir)
    ).rejects.toMatchObject({ code: 'ENOSPC' });

    expect(await fsExtra.readJson(path.join(testDir, 'package.json'))).toEqual(
      packageJson
    );
    expect(await fsExtra.readdir(testDir)).toEqual(['package.json']);
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
