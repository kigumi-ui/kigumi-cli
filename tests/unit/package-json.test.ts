/**
 * package.json Reader Tests (issue #99)
 *
 * src/utils/package-json.ts is the reader for tier and project detection.
 * These tests pin its contract (missing file -> empty map, unreadable ->
 * PackageJsonReadError, not a JSON object -> PackageJsonInvalidError) and what
 * each caller does with those errors, so a caller that starts swallowing or
 * leaking one of them fails here.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  readDependencies,
  readDependenciesSync,
} from '../../src/utils/package-json.js';
import {
  detectFramework,
  isNextProject,
} from '../../src/utils/detect-framework.js';
import { detectTier, detectTierSync } from '../../src/utils/tier.js';
import { MIN_TOKEN_LENGTH } from '../../src/constants.js';
import {
  PackageJsonInvalidError,
  PackageJsonReadError,
} from '../../src/errors/index.js';

describe('readDependencies / readDependenciesSync', () => {
  let testDir: string;
  let packageJsonPath: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-pkg-deps-'));
    packageJsonPath = path.join(testDir, 'package.json');
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  async function both(): Promise<unknown[]> {
    const results: unknown[] = [];
    for (const read of [
      () => readDependencies(testDir),
      async () => readDependenciesSync(testDir),
    ]) {
      try {
        results.push(await read());
      } catch (error) {
        results.push(error);
      }
    }
    return results;
  }

  it('returns an empty map when package.json is missing', async () => {
    expect(await both()).toEqual([{}, {}]);
  });

  it('merges dependencies and devDependencies, devDependencies winning', async () => {
    await fs.writeJSON(packageJsonPath, {
      dependencies: { react: '^19.0.0', shared: '1.0.0' },
      devDependencies: { vite: '^7.0.0', shared: '2.0.0' },
    });
    const expected = { react: '^19.0.0', vite: '^7.0.0', shared: '2.0.0' };
    expect(await both()).toEqual([expected, expected]);
  });

  it('throws PackageJsonReadError for a directory at package.json', async () => {
    await fs.mkdir(packageJsonPath);
    for (const result of await both()) {
      expect(result).toBeInstanceOf(PackageJsonReadError);
      expect((result as PackageJsonReadError).context.details).toMatchObject({
        filePath: packageJsonPath,
        code: 'EISDIR',
      });
    }
  });

  it.each([
    ['a syntax error', '{ "name": "broken", }'],
    ['null', 'null'],
    ['a number', '42'],
    ['an array', '[]'],
  ])('throws PackageJsonInvalidError for %s', async (_label, content) => {
    await fs.writeFile(packageJsonPath, content);
    for (const result of await both()) {
      expect(result).toBeInstanceOf(PackageJsonInvalidError);
      expect((result as PackageJsonInvalidError).context.details).toEqual({
        filePath: packageJsonPath,
      });
    }
  });
});

describe('what each caller does with a broken package.json', () => {
  let testDir: string;
  let packageJsonPath: string;
  const originalToken = process.env.WEBAWESOME_NPM_TOKEN;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-pkg-callers-'));
    packageJsonPath = path.join(testDir, 'package.json');
  });

  afterEach(async () => {
    if (originalToken === undefined) delete process.env.WEBAWESOME_NPM_TOKEN;
    else process.env.WEBAWESOME_NPM_TOKEN = originalToken;
    await fs.remove(testDir);
  });

  it('detectFramework surfaces invalid JSON as PackageJsonInvalidError', async () => {
    await fs.writeFile(packageJsonPath, '{ "name": "broken", }');
    await expect(detectFramework(testDir)).rejects.toBeInstanceOf(
      PackageJsonInvalidError
    );
  });

  it('detectFramework still returns "unknown" when package.json is missing', async () => {
    expect(await detectFramework(testDir)).toBe('unknown');
  });

  // 'pro' can only come from the token here, so it proves the fall-through
  // reached token detection instead of stopping on the broken file.
  it('tier detection falls through to the token when package.json is null', async () => {
    await fs.writeFile(packageJsonPath, 'null');
    process.env.WEBAWESOME_NPM_TOKEN = 'x'.repeat(MIN_TOKEN_LENGTH);
    expect(await detectTier(testDir)).toBe('pro');
    expect(detectTierSync(testDir)).toBe('pro');
  });

  it.each([
    ['invalid JSON', 'invalid'],
    ['a directory at package.json', 'directory'],
  ])(
    'isNextProject falls back to next.config.* on %s',
    async (_label, kind) => {
      if (kind === 'directory') await fs.mkdir(packageJsonPath);
      else await fs.writeFile(packageJsonPath, '{ "name": "broken", }');

      expect(await isNextProject(testDir)).toBe(false);
      await fs.writeFile(path.join(testDir, 'next.config.js'), '');
      expect(await isNextProject(testDir)).toBe(true);
    }
  );
});
