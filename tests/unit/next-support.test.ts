/**
 * Next.js Support Tests
 *
 * Validates the detection-driven branches added for Next.js App Router:
 * - `generateComponent` prepends `'use client'` when `next` is in deps
 * - `regenerateKigumiSetup` writes kigumi.ts starting with `'use client'`
 * - `generateNextEnvDts` emits JSX types without the `vite/client` reference
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { DEFAULT_CONFIG } from '../../src/schemas/config.js';

describe('next.js support', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-next-support-'))
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  async function writeNextProject(): Promise<void> {
    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      name: 'test-next',
      version: '1.0.0',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        next: '^14.0.0',
      },
    });
  }

  async function writeVitReactProject(): Promise<void> {
    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      name: 'test-vite',
      version: '1.0.0',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        vite: '^5.0.0',
      },
    });
  }

  describe('generateComponent', () => {
    it("prepends 'use client' in a Next.js project", async () => {
      await writeNextProject();

      const { generateComponent, clearTemplateCache } =
        await import('../../src/utils/template.js');
      const { getComponent } = await import('../../src/utils/registry.js');
      clearTemplateCache();

      const button = getComponent('button');
      expect(button).toBeDefined();

      const rendered = await generateComponent(
        button!,
        DEFAULT_CONFIG,
        true,
        tempDir,
        'free'
      );

      expect(rendered.startsWith("'use client';")).toBe(true);
    });

    it("does not prepend 'use client' in a Vite + React project", async () => {
      await writeVitReactProject();

      const { generateComponent, clearTemplateCache } =
        await import('../../src/utils/template.js');
      const { getComponent } = await import('../../src/utils/registry.js');
      clearTemplateCache();

      const button = getComponent('button');
      const rendered = await generateComponent(
        button!,
        DEFAULT_CONFIG,
        true,
        tempDir,
        'free'
      );

      expect(rendered.startsWith("'use client';")).toBe(false);
    });
  });

  describe('regenerateKigumiSetup', () => {
    it("writes kigumi.ts starting with 'use client' in Next.js projects", async () => {
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const kigumiTs = await fs.readFile(
        path.join(tempDir, 'src', 'lib', 'kigumi.ts'),
        'utf-8'
      );
      expect(kigumiTs.startsWith("'use client';")).toBe(true);
    });

    it("does not prepend 'use client' in non-Next projects", async () => {
      await writeVitReactProject();
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const kigumiTs = await fs.readFile(
        path.join(tempDir, 'src', 'lib', 'kigumi.ts'),
        'utf-8'
      );
      expect(kigumiTs.startsWith("'use client';")).toBe(false);
    });
  });

  describe('generateNextEnvDts', () => {
    it('emits web-awesome.d.ts without the vite/client reference', async () => {
      await fs.ensureDir(path.join(tempDir, 'src'));

      const { generateNextEnvDts } =
        await import('../../src/utils/regenerate.js');

      await generateNextEnvDts(tempDir, 'src', '@awesome.me/webawesome');

      const dts = await fs.readFile(
        path.join(tempDir, 'src', 'web-awesome.d.ts'),
        'utf-8'
      );

      expect(dts).not.toContain('vite/client');
      expect(dts).toContain('declare global');
      expect(dts).toContain('CustomElements');
      expect(dts).toContain('CustomCssProperties');
    });

    it('writes to the project root when srcDir is empty', async () => {
      const { generateNextEnvDts } =
        await import('../../src/utils/regenerate.js');

      await generateNextEnvDts(tempDir, '', '@awesome.me/webawesome');

      expect(await fs.pathExists(path.join(tempDir, 'web-awesome.d.ts'))).toBe(
        true
      );
    });
  });
});
