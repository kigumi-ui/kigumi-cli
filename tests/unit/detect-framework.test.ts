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

  it('should return unknown for Svelte dependencies (Svelte not supported)', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { svelte: '^4.0.0' },
    });

    const { detectFramework } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectFramework(testDir)).toBe('unknown');
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
      nextRouter: undefined,
      sourceLayout: 'root',
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

  it('falls back to next.config file when deps are missing', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0' },
    });
    await fs.writeFile(
      path.join(testDir, 'next.config.ts'),
      'export default {};'
    );

    const { isNextProject } =
      await import('../../src/utils/detect-framework.js');
    expect(await isNextProject(testDir)).toBe(true);
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

  it("returns 'app' for app/ at root", async () => {
    await fs.ensureDir(path.join(testDir, 'app'));

    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('app');
  });

  it("returns 'app' for src/app/", async () => {
    await fs.ensureDir(path.join(testDir, 'src', 'app'));

    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('app');
  });

  it("returns 'pages' for pages/ at root", async () => {
    await fs.ensureDir(path.join(testDir, 'pages'));

    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('pages');
  });

  it("returns 'pages' for src/pages/", async () => {
    await fs.ensureDir(path.join(testDir, 'src', 'pages'));

    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('pages');
  });

  it("prefers 'app' when both app/ and pages/ exist", async () => {
    // Incremental-migration projects keep pages/ while adding app/.
    // Next itself gives App Router precedence for conflicting routes.
    await fs.ensureDir(path.join(testDir, 'app'));
    await fs.ensureDir(path.join(testDir, 'pages'));

    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('app');
  });

  it("returns 'unknown' when neither router dir is present", async () => {
    const { detectNextRouter } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectNextRouter(testDir)).toBe('unknown');
  });
});

describe('detectSourceLayout', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-detect-layout-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it("returns 'src' when src/app/ exists", async () => {
    await fs.ensureDir(path.join(testDir, 'src', 'app'));

    const { detectSourceLayout } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectSourceLayout(testDir)).toBe('src');
  });

  it("returns 'src' when src/main.tsx exists", async () => {
    await fs.ensureDir(path.join(testDir, 'src'));
    await fs.writeFile(path.join(testDir, 'src', 'main.tsx'), 'export {};');

    const { detectSourceLayout } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectSourceLayout(testDir)).toBe('src');
  });

  it("returns 'root' for a Next-no-src-dir layout", async () => {
    // create-next-app without --src-dir puts app/ at root, no src/ dir.
    await fs.ensureDir(path.join(testDir, 'app'));

    const { detectSourceLayout } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectSourceLayout(testDir)).toBe('root');
  });

  it("returns 'root' for an empty directory", async () => {
    const { detectSourceLayout } =
      await import('../../src/utils/detect-framework.js');
    expect(await detectSourceLayout(testDir)).toBe('root');
  });
});

describe('getProjectInfo — Next router + source layout', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-project-info-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('populates nextRouter=app + sourceLayout=src for App Router with src/', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { next: '^14.0.0', react: '^18.0.0' },
    });
    await fs.ensureDir(path.join(testDir, 'src', 'app'));

    const { getProjectInfo } =
      await import('../../src/utils/detect-framework.js');
    const info = await getProjectInfo(testDir);
    expect(info.isNext).toBe(true);
    expect(info.nextRouter).toBe('app');
    expect(info.sourceLayout).toBe('src');
  });

  it('populates nextRouter=pages + sourceLayout=root for Pages-no-src', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { next: '^14.0.0', react: '^18.0.0' },
    });
    await fs.ensureDir(path.join(testDir, 'pages'));

    const { getProjectInfo } =
      await import('../../src/utils/detect-framework.js');
    const info = await getProjectInfo(testDir);
    expect(info.isNext).toBe(true);
    expect(info.nextRouter).toBe('pages');
    expect(info.sourceLayout).toBe('root');
  });

  it('leaves nextRouter undefined for non-Next projects', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: { react: '^18.0.0', vite: '^5.0.0' },
    });
    await fs.ensureDir(path.join(testDir, 'src'));
    await fs.writeFile(path.join(testDir, 'src', 'main.tsx'), 'export {};');

    const { getProjectInfo } =
      await import('../../src/utils/detect-framework.js');
    const info = await getProjectInfo(testDir);
    expect(info.isNext).toBe(false);
    expect(info.nextRouter).toBeUndefined();
    expect(info.sourceLayout).toBe('src');
  });
});
