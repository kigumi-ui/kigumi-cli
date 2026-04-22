/**
 * Integration Tests for kigumi init
 *
 * Tests the real CLI flow in temporary directories.
 * No mocks - actual filesystem operations.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanup,
  createTempProject,
  fileExists,
  readFile,
  runKigumi,
  writeFile,
} from './helpers.js';

describe('kigumi init', () => {
  let testDir: string;

  // Ensure CLI is built before running integration tests
  beforeAll(async () => {
    const fs = await import('fs-extra');
    const cliExists = await fs.pathExists('dist/index.js');
    if (!cliExists) {
      throw new Error(
        'CLI not built. Run `npm run build` before integration tests.'
      );
    }
  });

  afterEach(async () => {
    if (testDir) {
      await cleanup(testDir);
    }
  });

  describe('file generation', () => {
    it('generates required files for React + Vite project', async () => {
      testDir = await createTempProject('react-vite');

      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Should exit successfully
      expect(result.exitCode).toBe(0);

      // Check generated files
      expect(await fileExists(testDir, 'kigumi.config.json')).toBe(true);
      expect(await fileExists(testDir, 'src/lib/kigumi.ts')).toBe(true);
      expect(await fileExists(testDir, 'src/styles/theme.css')).toBe(true);
      expect(await fileExists(testDir, 'src/styles/layers.css')).toBe(true);
      expect(await fileExists(testDir, '.npmrc')).toBe(true);
    });

    it('generates config with correct structure', async () => {
      testDir = await createTempProject('react-vite');

      await runKigumi(testDir, ['init', '--no-install', '-y']);

      const configContent = await readFile(testDir, 'kigumi.config.json');
      const config = JSON.parse(configContent);

      expect(config).toHaveProperty('framework', 'react');
      expect(config).toHaveProperty('typescript', true);
      expect(config).toHaveProperty('theme');
      expect(config.theme).toHaveProperty('selected');
      expect(config.theme).toHaveProperty('palette');
      expect(config.theme).toHaveProperty('brandColor');
    });

    it('generates required files for Next.js project', async () => {
      testDir = await createTempProject('next-app');

      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      expect(result.exitCode).toBe(0);

      // Core Kigumi files
      expect(await fileExists(testDir, 'kigumi.config.json')).toBe(true);
      expect(await fileExists(testDir, 'src/lib/kigumi.ts')).toBe(true);
      expect(await fileExists(testDir, 'src/styles/theme.css')).toBe(true);
      expect(await fileExists(testDir, 'src/styles/layers.css')).toBe(true);

      // Next-specific outputs
      expect(await fileExists(testDir, 'src/app/providers.tsx')).toBe(true);
      expect(await fileExists(testDir, 'src/web-awesome.d.ts')).toBe(true);

      // Files that must NOT be produced for Next
      expect(await fileExists(testDir, 'src/vite-env.d.ts')).toBe(false);
      expect(await fileExists(testDir, 'vite.config.ts')).toBe(false);

      // kigumi.ts must be a Client Module
      const kigumi = await readFile(testDir, 'src/lib/kigumi.ts');
      expect(kigumi.startsWith("'use client';")).toBe(true);

      // providers.tsx must also be a Client Module and import kigumi
      const providers = await readFile(testDir, 'src/app/providers.tsx');
      expect(providers.startsWith("'use client';")).toBe(true);
      expect(providers).toContain('@/lib/kigumi');
      expect(providers).toContain('KigumiProvider');

      // web-awesome.d.ts must not reference vite/client
      const dts = await readFile(testDir, 'src/web-awesome.d.ts');
      expect(dts).not.toContain('vite/client');
    });
  });

  describe('file preservation', () => {
    it('preserves existing theme.css on re-init', async () => {
      testDir = await createTempProject('react-vite');

      // First init
      await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Modify theme.css with custom content
      const customContent = '/* My custom styles */\n:root { --custom: red; }';
      await writeFile(testDir, 'src/styles/theme.css', customContent);

      // Re-init
      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Should preserve custom content
      const themeContent = await readFile(testDir, 'src/styles/theme.css');
      expect(themeContent).toBe(customContent);

      // Should show preservation message
      expect(result.stdout).toContain('Existing theme.css found');
    });

    it('preserves existing layers.css on re-init', async () => {
      testDir = await createTempProject('react-vite');

      // First init
      await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Modify layers.css with custom content
      const customContent = '/* My custom layers */\n@layer custom, base;';
      await writeFile(testDir, 'src/styles/layers.css', customContent);

      // Re-init
      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Should preserve custom content
      const layersContent = await readFile(testDir, 'src/styles/layers.css');
      expect(layersContent).toBe(customContent);

      // Should show preservation message
      expect(result.stdout).toContain('Existing layers.css found');
    });

    it('regenerates kigumi.ts on re-init', async () => {
      testDir = await createTempProject('react-vite');

      // First init
      await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Modify kigumi.ts
      await writeFile(testDir, 'src/lib/kigumi.ts', '// Should be overwritten');

      // Re-init
      await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Should be regenerated (not preserved)
      const content = await readFile(testDir, 'src/lib/kigumi.ts');
      expect(content).toContain('auto-generated by Kigumi CLI');
      expect(content).not.toContain('Should be overwritten');
    });
  });

  describe('tier detection', () => {
    it('defaults to free tier when no token', async () => {
      testDir = await createTempProject('react-vite');

      await runKigumi(testDir, ['init', '--no-install', '-y']);

      const npmrcContent = await readFile(testDir, '.npmrc');
      expect(npmrcContent).toContain('registry.npmjs.org');
      expect(npmrcContent).not.toContain('cloudsmith');
    });
  });
});
