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
  PackageJsonExistsCheck,
  GitIgnoreExistsCheck,
} from '../../src/checks/config-checks.js';
import { CheckSeverity } from '../../src/checks/types.js';

const baseConfig = {
  framework: 'react' as const,
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: {
    selected: 'default',
    palette: 'default',
    brandColor: 'blue',
  },
};

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

  it('fails when no config file exists at any supported path', async () => {
    await withTmpDir(async (dir) => {
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(false);
      expect(result.severity).toBe(CheckSeverity.ERROR);
    });
  });

  it.each([
    'kigumi.config.json',
    'kigumi-components.json',
    'kigumi.json',
    '.kigumirc',
    '.kigumirc.json',
  ])('passes when config exists at %s', async (filename) => {
    await withTmpDir(async (dir) => {
      await fs.writeJSON(path.join(dir, filename), baseConfig);
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(true);
      expect(result.message).toContain(filename);
    });
  });

  it('passes when config lives under package.json#kigumi', async () => {
    await withTmpDir(async (dir) => {
      await fs.writeJSON(path.join(dir, 'package.json'), {
        name: 'host',
        kigumi: baseConfig,
      });
      const result = await check.run({ cwd: dir });
      expect(result.passed).toBe(true);
      expect(result.message).toContain('package.json');
    });
  });

  it('fails when only the parent directory has a config (monorepo isolation)', async () => {
    await withTmpDir(async (parent) => {
      await fs.writeJSON(path.join(parent, 'kigumi.config.json'), baseConfig);
      const child = path.join(parent, 'packages', 'foo');
      await fs.ensureDir(child);
      const result = await check.run({ cwd: child });
      expect(result.passed).toBe(false);
    });
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
