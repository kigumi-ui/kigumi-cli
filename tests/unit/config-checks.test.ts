/**
 * Config Checks Tests
 *
 * Tests for src/checks/config-checks.ts
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import {
  ConfigExistsCheck,
  ConfigValidCheck,
  PackageJsonExistsCheck,
  GitIgnoreExistsCheck,
} from '../../src/checks/config-checks.js';
import { CheckSeverity } from '../../src/checks/types.js';

async function withTmpDir(fn: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-test-'));
  try {
    await fn(dir);
  } finally {
    await fs.remove(dir);
  }
}

describe('ConfigExistsCheck', () => {
  const check = new ConfigExistsCheck();

  it('fails when config is missing', async () => {
    await withTmpDir(async (dir) => {
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(false);
      expect(result.severity).toBe(CheckSeverity.ERROR);
    });
  });

  it('passes when config exists', async () => {
    await withTmpDir(async (dir) => {
      await fs.writeJSON(path.join(dir, 'kigumi.config.json'), {});
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(true);
    });
  });
});

describe('ConfigValidCheck', () => {
  const check = new ConfigValidCheck();

  it('fails when config is not loaded', async () => {
    const result = await check.run({ cwd: '/tmp' });
    expect(result.passed).toBe(false);
  });

  it('passes when config is provided', async () => {
    const result = await check.run({ cwd: '/tmp', config: {} as never });
    expect(result.passed).toBe(true);
  });
});

describe('PackageJsonExistsCheck', () => {
  const check = new PackageJsonExistsCheck();

  it('fails when package.json is missing', async () => {
    await withTmpDir(async (dir) => {
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(false);
      expect(result.severity).toBe(CheckSeverity.ERROR);
    });
  });

  it('passes when package.json exists', async () => {
    await withTmpDir(async (dir) => {
      await fs.writeJSON(path.join(dir, 'package.json'), { name: 'test' });
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(true);
    });
  });
});

describe('GitIgnoreExistsCheck', () => {
  const check = new GitIgnoreExistsCheck();

  it('warns when .gitignore is missing', async () => {
    await withTmpDir(async (dir) => {
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(false);
      expect(result.severity).toBe(CheckSeverity.WARNING);
    });
  });

  it('passes when .gitignore exists', async () => {
    await withTmpDir(async (dir) => {
      await fs.writeFile(path.join(dir, '.gitignore'), 'node_modules');
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(true);
    });
  });
});
