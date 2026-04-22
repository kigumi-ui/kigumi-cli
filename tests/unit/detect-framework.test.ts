/**
 * Framework Detection Tests
 *
 * Tests for src/utils/detect-framework.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('detectFramework', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-detect-fw-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should detect React from dependencies', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0' },
    });

    const { detectFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectFramework(testDir)).toBe('react');
  });

  it('should detect React from @types/react', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      devDependencies: { '@types/react': '^18.0.0' },
    });

    const { detectFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectFramework(testDir)).toBe('react');
  });

  it('should detect Vue from dependencies', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { vue: '^3.0.0' },
    });

    const { detectFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectFramework(testDir)).toBe('vue');
  });

  it('should detect Svelte from dependencies', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { svelte: '^4.0.0' },
    });

    const { detectFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectFramework(testDir)).toBe('svelte');
  });

  it('should detect Angular from dependencies', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { '@angular/core': '^17.0.0' },
    });

    const { detectFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectFramework(testDir)).toBe('angular');
  });

  it('should return unknown when no framework detected', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { express: '^4.0.0' },
    });

    const { detectFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectFramework(testDir)).toBe('unknown');
  });

  it('should return unknown when no package.json exists', async () => {
    const { detectFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectFramework(testDir)).toBe('unknown');
  });
});

describe('detectTypeScript', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-detect-ts-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should detect TypeScript from tsconfig.json', async () => {
    await fs.writeFile(path.join(testDir, 'tsconfig.json'), '{}');

    const { detectTypeScript } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectTypeScript(testDir)).toBe(true);
  });

  it('should detect TypeScript from dependency', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      devDependencies: { typescript: '^5.0.0' },
    });

    const { detectTypeScript } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectTypeScript(testDir)).toBe(true);
  });

  it('should return false when no TypeScript indicators', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0' },
    });

    const { detectTypeScript } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectTypeScript(testDir)).toBe(false);
  });
});

describe('detectPackageManager', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-detect-pm-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should detect pnpm from pnpm-lock.yaml', async () => {
    await fs.writeFile(path.join(testDir, 'pnpm-lock.yaml'), '');

    const { detectPackageManager } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectPackageManager(testDir)).toBe('pnpm');
  });

  it('should detect yarn from yarn.lock', async () => {
    await fs.writeFile(path.join(testDir, 'yarn.lock'), '');

    const { detectPackageManager } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectPackageManager(testDir)).toBe('yarn');
  });

  it('should detect bun from bun.lockb', async () => {
    await fs.writeFile(path.join(testDir, 'bun.lockb'), '');

    const { detectPackageManager } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectPackageManager(testDir)).toBe('bun');
  });

  it('should default to npm when no lockfile found', async () => {
    const { detectPackageManager } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectPackageManager(testDir)).toBe('npm');
  });
});

describe('getProjectInfo', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-project-info-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should return complete project info', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0', vite: '^5.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    });
    await fs.writeFile(path.join(testDir, 'pnpm-lock.yaml'), '');
    await fs.writeFile(path.join(testDir, 'tsconfig.json'), '{}');

    const { getProjectInfo } =
      await import('../../src/utils/detect-framework.js');
    const info = await getProjectInfo(testDir);

    expect(info).toEqual({
      framework: 'react',
      typescript: true,
      packageManager: 'pnpm',
      hasVite: true,
      isNext: false,
    });
  });

  it('should handle minimal project', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {},
    });

    const { getProjectInfo } =
      await import('../../src/utils/detect-framework.js');
    const info = await getProjectInfo(testDir);

    expect(info.framework).toBe('unknown');
    expect(info.typescript).toBe(false);
    expect(info.packageManager).toBe('npm');
    expect(info.hasVite).toBe(false);
    expect(info.isNext).toBe(false);
  });

  it('should set isNext: true when next is a dependency', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        next: '^14.0.0',
      },
    });

    const { getProjectInfo } =
      await import('../../src/utils/detect-framework.js');
    const info = await getProjectInfo(testDir);

    expect(info.framework).toBe('react');
    expect(info.isNext).toBe(true);
  });

  it('should set isNext: false when next is absent', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
    });

    const { getProjectInfo } =
      await import('../../src/utils/detect-framework.js');
    const info = await getProjectInfo(testDir);

    expect(info.isNext).toBe(false);
  });
});

describe('isNextProject', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-detect-next-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('returns true when next is in dependencies', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { next: '^14.0.0' },
    });

    const { isNextProject } =
      await import('../../src/utils/detect-framework.js');
    expect(await isNextProject(testDir)).toBe(true);
  });

  it('returns true when next is in devDependencies', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      devDependencies: { next: '^14.0.0' },
    });

    const { isNextProject } =
      await import('../../src/utils/detect-framework.js');
    expect(await isNextProject(testDir)).toBe(true);
  });

  it('returns false when next is absent', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0' },
    });

    const { isNextProject } =
      await import('../../src/utils/detect-framework.js');
    expect(await isNextProject(testDir)).toBe(false);
  });

  it('returns false when package.json is missing', async () => {
    const { isNextProject } =
      await import('../../src/utils/detect-framework.js');
    expect(await isNextProject(testDir)).toBe(false);
  });

  it('returns false when package.json is corrupt', async () => {
    await fs.writeFile(path.join(testDir, 'package.json'), '{ not valid');

    const { isNextProject } =
      await import('../../src/utils/detect-framework.js');
    expect(await isNextProject(testDir)).toBe(false);
  });
});
