/**
 * Dependency Checks Tests
 *
 * Tests for src/checks/dependency-checks.ts
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import {
  NodeModulesExistsCheck,
  DependencyInstalledCheck,
  PackageJsonDependencyCheck,
} from '../../src/checks/dependency-checks.js';
import { CheckSeverity } from '../../src/checks/types.js';

async function withTmpDir(fn: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-dep-'));
  try {
    await fn(dir);
  } finally {
    await fs.remove(dir);
  }
}

describe('NodeModulesExistsCheck', () => {
  const check = new NodeModulesExistsCheck();

  it('warns when node_modules missing', async () => {
    await withTmpDir(async (dir) => {
      const r = await check.run({ cwd: dir });
      expect(r.passed).toBe(false);
      expect(r.severity).toBe(CheckSeverity.WARNING);
    });
  });

  it('passes when node_modules exists', async () => {
    await withTmpDir(async (dir) => {
      await fs.ensureDir(path.join(dir, 'node_modules'));
      const r = await check.run({ cwd: dir });
      expect(r.passed).toBe(true);
    });
  });
});

describe('DependencyInstalledCheck', () => {
  it('fails when package not in node_modules', async () => {
    await withTmpDir(async (dir) => {
      const check = new DependencyInstalledCheck('react');
      const r = await check.run({ cwd: dir });
      expect(r.passed).toBe(false);
    });
  });

  it('passes when package exists in node_modules', async () => {
    await withTmpDir(async (dir) => {
      await fs.ensureDir(path.join(dir, 'node_modules', 'react'));
      const check = new DependencyInstalledCheck('react');
      const r = await check.run({ cwd: dir });
      expect(r.passed).toBe(true);
    });
  });
});

describe('PackageJsonDependencyCheck', () => {
  it('fails when package.json missing', async () => {
    await withTmpDir(async (dir) => {
      const check = new PackageJsonDependencyCheck('react');
      const r = await check.run({ cwd: dir });
      expect(r.passed).toBe(false);
      expect(r.severity).toBe(CheckSeverity.ERROR);
    });
  });

  it('fails when dep not in package.json', async () => {
    await withTmpDir(async (dir) => {
      await fs.writeJSON(path.join(dir, 'package.json'), { dependencies: {} });
      const check = new PackageJsonDependencyCheck('react');
      const r = await check.run({ cwd: dir });
      expect(r.passed).toBe(false);
    });
  });

  it('passes when dep in dependencies', async () => {
    await withTmpDir(async (dir) => {
      await fs.writeJSON(path.join(dir, 'package.json'), {
        dependencies: { react: '^18' },
      });
      const check = new PackageJsonDependencyCheck('react');
      const r = await check.run({ cwd: dir });
      expect(r.passed).toBe(true);
    });
  });

  it('passes when dep in devDependencies', async () => {
    await withTmpDir(async (dir) => {
      await fs.writeJSON(path.join(dir, 'package.json'), {
        devDependencies: { vitest: '^1' },
      });
      const check = new PackageJsonDependencyCheck('vitest');
      const r = await check.run({ cwd: dir });
      expect(r.passed).toBe(true);
    });
  });
});
