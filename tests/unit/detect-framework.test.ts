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
      metaFramework: 'vite',
      hasVite: true,
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
    expect(info.metaFramework).toBe('none');
    expect(info.hasVite).toBe(false);
  });

  it('should detect Next.js meta-framework', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0', next: '^15.0.0' },
    });

    const { getProjectInfo } =
      await import('../../src/utils/detect-framework.js');
    const info = await getProjectInfo(testDir);

    expect(info.framework).toBe('react');
    expect(info.metaFramework).toBe('next');
    expect(info.hasVite).toBe(false);
  });
});

describe('detectMetaFramework', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-detect-meta-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('detects Next from dependency', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { next: '^15.0.0', react: '^18.0.0' },
    });
    const { detectMetaFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectMetaFramework(testDir)).toBe('next');
  });

  it('detects Next from next.config.js without dependency', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0' },
    });
    await fs.writeFile(
      path.join(testDir, 'next.config.js'),
      'module.exports = {};'
    );
    const { detectMetaFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectMetaFramework(testDir)).toBe('next');
  });

  it('detects Next from next.config.ts', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {});
    await fs.writeFile(
      path.join(testDir, 'next.config.ts'),
      'export default {};'
    );
    const { detectMetaFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectMetaFramework(testDir)).toBe('next');
  });

  it('detects Next from next.config.mjs', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {});
    await fs.writeFile(
      path.join(testDir, 'next.config.mjs'),
      'export default {};'
    );
    const { detectMetaFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectMetaFramework(testDir)).toBe('next');
  });

  it('detects Vite from dependency', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { vite: '^5.0.0', react: '^18.0.0' },
    });
    const { detectMetaFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectMetaFramework(testDir)).toBe('vite');
  });

  it('prefers Next over Vite when both present', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { next: '^15.0.0', vite: '^5.0.0' },
    });
    const { detectMetaFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectMetaFramework(testDir)).toBe('next');
  });

  it('returns none for plain project', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0' },
    });
    const { detectMetaFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectMetaFramework(testDir)).toBe('none');
  });

  it('returns none when package.json missing', async () => {
    const { detectMetaFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectMetaFramework(testDir)).toBe('none');
  });
});

describe('detectNextRouter', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-detect-router-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('detects app router from app/ directory', async () => {
    await fs.ensureDir(path.join(testDir, 'app'));
    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('app');
  });

  it('detects app router from src/app/ directory', async () => {
    await fs.ensureDir(path.join(testDir, 'src/app'));
    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('app');
  });

  it('detects pages router from pages/ directory', async () => {
    await fs.ensureDir(path.join(testDir, 'pages'));
    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('pages');
  });

  it('detects pages router from src/pages/ directory', async () => {
    await fs.ensureDir(path.join(testDir, 'src/pages'));
    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('pages');
  });

  it('prefers app router when both present', async () => {
    await fs.ensureDir(path.join(testDir, 'app'));
    await fs.ensureDir(path.join(testDir, 'pages'));
    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('app');
  });

  it('returns unknown when neither exists', async () => {
    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('unknown');
  });
});
