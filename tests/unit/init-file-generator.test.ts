/**
 * generateProjectFiles Tests
 *
 * Unit-tests src/commands/init/file-generator.ts end-to-end against per-test
 * temp dirs. Real fs writes through regenerate.ts; the four config-mutator
 * functions in project-config.ts are spied so we don't have to scaffold full
 * vite.config.ts / tsconfig.json per case (those modules have their own
 * coverage in tests/unit/project-config*). The remaining project-config
 * exports stay live.
 *
 * Cluster S / PR-S4: switched the project-config partial factory mock
 * to per-test vi.spyOn on the namespace import.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateProjectFiles } from '../../src/commands/init/file-generator.js';
import * as projectConfig from '../../src/utils/project-config.js';
import { createTestOutput } from './_helpers/output.js';
import { createTestKigumiConfig } from './_helpers/kigumi-config.js';
import type { OutputInterface } from '../../src/output/types.js';
import type { ProjectInfo } from '../../src/utils/detect-framework.js';

function makeProjectInfo(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    framework: 'react',
    typescript: true,
    packageManager: 'npm',
    hasVite: true,
    isNext: false,
    sourceLayout: 'src',
    ...overrides,
  };
}

describe('generateProjectFiles', () => {
  let tempDir: string;
  let output: OutputInterface;

  beforeEach(async () => {
    vi.clearAllMocks();

    vi.spyOn(projectConfig, 'configureVitePathAliases').mockResolvedValue(true);
    vi.spyOn(projectConfig, 'configureTSConfig').mockResolvedValue(true);
    vi.spyOn(projectConfig, 'configureVueCustomElements').mockResolvedValue(
      true
    );
    vi.spyOn(projectConfig, 'configureVueTypes').mockResolvedValue(true);

    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-file-gen-test-'))
    );
    output = createTestOutput();

    // Minimal package.json so tier detection inside regenerate doesn't crash.
    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      name: 'test-project',
      version: '0.0.0',
    });
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  describe('Vite + free + react + ts', () => {
    it('writes kigumi.ts, theme.css, vite-env.d.ts, .gitignore, and a free-tier .npmrc', async () => {
      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
      });

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'free',
        proToken: undefined,
        output,
        projectInfo: makeProjectInfo(),
      });

      expect(await fs.pathExists(path.join(tempDir, 'src/lib/kigumi.ts'))).toBe(
        true
      );
      expect(
        await fs.pathExists(path.join(tempDir, 'src/styles/theme.css'))
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(tempDir, 'src/styles/layers.css'))
      ).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, 'src/vite-env.d.ts'))).toBe(
        true
      );
      expect(await fs.pathExists(path.join(tempDir, '.gitignore'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.env'))).toBe(false);

      const npmrc = await fs.readFile(path.join(tempDir, '.npmrc'), 'utf-8');
      expect(npmrc).toContain(
        '@awesome.me:registry=https://registry.npmjs.org/'
      );

      expect(projectConfig.configureVitePathAliases).toHaveBeenCalledTimes(1);
      expect(projectConfig.configureTSConfig).toHaveBeenCalledTimes(1);
      expect(projectConfig.configureVueCustomElements).not.toHaveBeenCalled();
      expect(projectConfig.configureVueTypes).not.toHaveBeenCalled();
    });
  });

  describe('Vite + pro + react + ts + proToken', () => {
    it('writes .env with the Pro token and points .npmrc at the Pro registry', async () => {
      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
      });

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'pro',
        proToken: 'wa_test_token',
        output,
        projectInfo: makeProjectInfo(),
      });

      const env = await fs.readFile(path.join(tempDir, '.env'), 'utf-8');
      expect(env).toContain('WEBAWESOME_NPM_TOKEN=wa_test_token');

      const npmrc = await fs.readFile(path.join(tempDir, '.npmrc'), 'utf-8');
      expect(npmrc).toContain(
        '@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro'
      );
    });
  });

  describe('Vite + free + vue + ts', () => {
    it('skips vite-env.d.ts and configures Vue isCustomElement + types', async () => {
      const config = createTestKigumiConfig({
        framework: 'vue',
        typescript: true,
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
      });

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'free',
        proToken: undefined,
        output,
        projectInfo: makeProjectInfo({ framework: 'vue' }),
      });

      expect(await fs.pathExists(path.join(tempDir, 'src/lib/kigumi.ts'))).toBe(
        true
      );
      expect(
        await fs.pathExists(path.join(tempDir, 'src/styles/theme.css'))
      ).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.npmrc'))).toBe(true);
      // Vue branch must not emit Vite/React JSX typings.
      expect(await fs.pathExists(path.join(tempDir, 'src/vite-env.d.ts'))).toBe(
        false
      );

      expect(projectConfig.configureVueCustomElements).toHaveBeenCalledTimes(1);
      expect(projectConfig.configureVueTypes).toHaveBeenCalledTimes(1);
    });
  });

  describe('Next App Router + react (src layout)', () => {
    it('writes src/web-awesome.d.ts and generates src/app/providers.tsx', async () => {
      // Pre-create the app/ directory so generateNextProviders can locate it.
      await fs.ensureDir(path.join(tempDir, 'src/app'));

      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
      });

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'free',
        proToken: undefined,
        output,
        projectInfo: makeProjectInfo({
          isNext: true,
          nextRouter: 'app',
          sourceLayout: 'src',
          hasVite: false,
        }),
      });

      expect(
        await fs.pathExists(path.join(tempDir, 'src/web-awesome.d.ts'))
      ).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, 'src/vite-env.d.ts'))).toBe(
        false
      );

      const providers = await fs.readFile(
        path.join(tempDir, 'src/app/providers.tsx'),
        'utf-8'
      );
      expect(providers).toContain("'use client'");
      expect(providers).toContain('@/lib/kigumi');
      expect(providers).toContain('export function KigumiProvider');

      // Next projects skip the Vite path-alias step.
      expect(projectConfig.configureVitePathAliases).not.toHaveBeenCalled();
      expect(projectConfig.configureTSConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('Next App Router + react (root layout)', () => {
    it('writes web-awesome.d.ts at the root and generates app/providers.tsx', async () => {
      await fs.ensureDir(path.join(tempDir, 'app'));

      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        utilsDir: 'lib',
        stylesDir: 'styles',
      });

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'free',
        proToken: undefined,
        output,
        projectInfo: makeProjectInfo({
          isNext: true,
          nextRouter: 'app',
          sourceLayout: 'root',
          hasVite: false,
        }),
      });

      expect(await fs.pathExists(path.join(tempDir, 'web-awesome.d.ts'))).toBe(
        true
      );
      expect(
        await fs.pathExists(path.join(tempDir, 'src/web-awesome.d.ts'))
      ).toBe(false);

      expect(await fs.pathExists(path.join(tempDir, 'app/providers.tsx'))).toBe(
        true
      );
    });
  });

  describe('Next Pages Router + react', () => {
    it('writes web-awesome.d.ts but does NOT generate providers.tsx', async () => {
      await fs.ensureDir(path.join(tempDir, 'src/pages'));

      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
      });

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'free',
        proToken: undefined,
        output,
        projectInfo: makeProjectInfo({
          isNext: true,
          nextRouter: 'pages',
          sourceLayout: 'src',
          hasVite: false,
        }),
      });

      expect(
        await fs.pathExists(path.join(tempDir, 'src/web-awesome.d.ts'))
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(tempDir, 'src/app/providers.tsx'))
      ).toBe(false);
      expect(await fs.pathExists(path.join(tempDir, 'app/providers.tsx'))).toBe(
        false
      );
    });
  });

  describe('preservation of existing files', () => {
    it('preserves an existing theme.css and emits the preservation message', async () => {
      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
      });

      const themePath = path.join(tempDir, 'src/styles/theme.css');
      const customContent =
        '/* user-customized theme: do not overwrite */\n:root { --wa-color-brand-60: #abcdef; }\n';
      await fs.ensureDir(path.dirname(themePath));
      await fs.writeFile(themePath, customContent);

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'free',
        proToken: undefined,
        output,
        projectInfo: makeProjectInfo(),
      });

      const after = await fs.readFile(themePath, 'utf-8');
      expect(after).toBe(customContent);

      const infoCalls = (
        output.info as ReturnType<typeof vi.fn>
      ).mock.calls.flat();
      expect(
        infoCalls.some(
          (m: unknown) =>
            typeof m === 'string' && m.includes('Existing theme.css found')
        )
      ).toBe(true);
    });

    it('preserves an existing layers.css when preserveLayersCSS is honored', async () => {
      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
      });

      const layersPath = path.join(tempDir, 'src/styles/layers.css');
      const customContent =
        '/* user-customized layers: do not overwrite */\n@layer base, theme;\n';
      await fs.ensureDir(path.dirname(layersPath));
      await fs.writeFile(layersPath, customContent);

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'free',
        proToken: undefined,
        output,
        projectInfo: makeProjectInfo(),
      });

      const after = await fs.readFile(layersPath, 'utf-8');
      expect(after).toBe(customContent);

      const infoCalls = (
        output.info as ReturnType<typeof vi.fn>
      ).mock.calls.flat();
      expect(
        infoCalls.some(
          (m: unknown) =>
            typeof m === 'string' && m.includes('Existing layers.css found')
        )
      ).toBe(true);
    });

    it('preserves an existing providers.tsx', async () => {
      await fs.ensureDir(path.join(tempDir, 'src/app'));
      const providersPath = path.join(tempDir, 'src/app/providers.tsx');
      const customContent =
        '// user-customized providers\nexport function KigumiProvider() { return null; }\n';
      await fs.writeFile(providersPath, customContent);

      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
      });

      await generateProjectFiles({
        cwd: tempDir,
        config,
        tier: 'free',
        proToken: undefined,
        output,
        projectInfo: makeProjectInfo({
          isNext: true,
          nextRouter: 'app',
          sourceLayout: 'src',
          hasVite: false,
        }),
      });

      const after = await fs.readFile(providersPath, 'utf-8');
      expect(after).toBe(customContent);

      const infoCalls = (
        output.info as ReturnType<typeof vi.fn>
      ).mock.calls.flat();
      expect(
        infoCalls.some(
          (m: unknown) =>
            typeof m === 'string' && m.includes('Existing providers.tsx found')
        )
      ).toBe(true);
    });
  });
});
