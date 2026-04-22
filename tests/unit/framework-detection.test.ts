/**
 * Framework Detection Tests
 *
 * Tests for the framework plugin detection system:
 * - ReactPlugin.detect() — React project detection and confidence levels
 * - VuePlugin.detect() — Vue project detection and confidence levels
 * - FrameworkRegistry.detectFramework() — auto-detection across all frameworks
 * - FrameworkRegistry.detectAll() — detection results for all frameworks
 * - Error handling — corrupted package.json, missing files
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('framework detection', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-framework-test-')
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.resetModules();
  });

  /**
   * Write a package.json with the given dependencies
   */
  async function writePackageJson(
    deps: Record<string, string> = {},
    devDeps: Record<string, string> = {}
  ): Promise<void> {
    await fs.writeJson(path.join(tempDir, 'package.json'), {
      name: 'test-project',
      version: '1.0.0',
      dependencies: deps,
      devDependencies: devDeps,
    });
  }

  describe('ReactPlugin.detect()', () => {
    it('should detect React with high confidence (react + react-dom + vite)', async () => {
      await writePackageJson(
        { react: '^18.2.0', 'react-dom': '^18.2.0' },
        { vite: '^5.0.0', '@vitejs/plugin-react': '^4.0.0' }
      );

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.version).toBe('18.2.0');
    });

    it('should detect React with high confidence (react + react-dom + react-scripts)', async () => {
      await writePackageJson({
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '^5.0.0',
      });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('should detect React with medium confidence (react + react-dom only)', async () => {
      await writePackageJson({
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    it('should detect React with low confidence (react only, no react-dom)', async () => {
      await writePackageJson({ react: '^18.2.0' });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBe('low');
    });

    it('should detect React via @types/react in devDependencies', async () => {
      await writePackageJson({}, { '@types/react': '^18.2.0' });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
    });

    it('should not detect React when absent', async () => {
      await writePackageJson({ lodash: '^4.17.21' });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(false);
      expect(result.confidence).toBe('low');
    });

    it('should strip version prefix from detected version', async () => {
      await writePackageJson({ react: '~17.0.2', 'react-dom': '~17.0.2' });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.version).toBe('17.0.2');
    });

    it('should include detection details', async () => {
      await writePackageJson(
        { react: '^18.2.0', 'react-dom': '^18.2.0' },
        { vite: '^5.0.0', '@vitejs/plugin-react': '^4.0.0' }
      );

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.details).toBeDefined();
      expect(result.details?.packageJsonDeps).toContain('react');
      expect(result.details?.configFiles).toContain('vite.config.ts');
    });

    it('should return tsconfig.json in configFiles when no vite plugin', async () => {
      await writePackageJson({
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '^5.0.0',
      });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.details?.configFiles).toContain('tsconfig.json');
    });

    it('should detect Next.js with high confidence (react + react-dom + next)', async () => {
      await writePackageJson({
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        next: '^14.0.0',
      });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.details?.packageJsonDeps).toContain('next');
    });

    it('should include next.config.ts in configFiles for Next.js projects', async () => {
      await writePackageJson({
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        next: '^14.0.0',
      });
      // No actual next.config.* file exists — detector should still return a sensible default
      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.details?.configFiles).toContain('next.config.ts');
    });

    it('should pick the existing next.config flavor when present', async () => {
      await writePackageJson({
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        next: '^14.0.0',
      });
      await fs.writeFile(
        path.join(tempDir, 'next.config.mjs'),
        'export default {};'
      );

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.details?.configFiles).toEqual(['next.config.mjs']);
    });
  });

  describe('VuePlugin.detect()', () => {
    it('should detect Vue with high confidence (vue + vite + plugin-vue)', async () => {
      await writePackageJson(
        { vue: '^3.4.0' },
        { vite: '^5.0.0', '@vitejs/plugin-vue': '^5.0.0' }
      );

      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.version).toBe('3.4.0');
    });

    it('should detect Vue with medium confidence (vue only)', async () => {
      await writePackageJson({ vue: '^3.4.0' });

      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    it('should not detect Vue when absent', async () => {
      await writePackageJson({ express: '^4.18.0' });

      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(false);
      expect(result.confidence).toBe('low');
    });

    it('should strip version prefix from detected version', async () => {
      await writePackageJson({ vue: '~3.3.0' });

      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = await plugin.detect(tempDir);

      expect(result.version).toBe('3.3.0');
    });

    it('should include vite.config.ts in configFiles when vite detected', async () => {
      await writePackageJson(
        { vue: '^3.4.0' },
        { vite: '^5.0.0', '@vitejs/plugin-vue': '^5.0.0' }
      );

      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = await plugin.detect(tempDir);

      expect(result.details?.configFiles).toContain('vite.config.ts');
    });

    it('should return empty configFiles when no vite', async () => {
      await writePackageJson({ vue: '^3.4.0' });

      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = await plugin.detect(tempDir);

      expect(result.details?.configFiles).toEqual([]);
    });
  });

  describe('no package.json', () => {
    it('should return not detected for React when no package.json', async () => {
      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(false);
      expect(result.confidence).toBe('low');
    });

    it('should return not detected for Vue when no package.json', async () => {
      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(false);
      expect(result.confidence).toBe('low');
    });
  });

  describe('corrupted package.json', () => {
    it('should throw on corrupted package.json for React detection', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        '{ invalid json without closing'
      );

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();

      await expect(plugin.detect(tempDir)).rejects.toThrow();
    });

    it('should throw on corrupted package.json for Vue detection', async () => {
      await fs.writeFile(path.join(tempDir, 'package.json'), 'not json at all');

      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();

      await expect(plugin.detect(tempDir)).rejects.toThrow();
    });
  });

  describe('FrameworkRegistry', () => {
    describe('getSupportedFrameworks()', () => {
      it('should list all registered frameworks', async () => {
        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const frameworks = FrameworkRegistry.getSupportedFrameworks();

        expect(frameworks).toContain('react');
        expect(frameworks).toContain('vue');
        expect(frameworks).toContain('angular');
        expect(frameworks).toContain('svelte');
      });
    });

    describe('isSupported()', () => {
      it('should return true for registered frameworks', async () => {
        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');

        expect(FrameworkRegistry.isSupported('react')).toBe(true);
        expect(FrameworkRegistry.isSupported('vue')).toBe(true);
      });

      it('should return false for unknown frameworks', async () => {
        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');

        expect(FrameworkRegistry.isSupported('jquery')).toBe(false);
        expect(FrameworkRegistry.isSupported('')).toBe(false);
      });
    });

    describe('getPlugin()', () => {
      it('should load React plugin', async () => {
        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const plugin = await FrameworkRegistry.getPlugin('react');

        expect(plugin.name).toBe('react');
      });

      it('should load Vue plugin', async () => {
        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const plugin = await FrameworkRegistry.getPlugin('vue');

        expect(plugin.name).toBe('vue');
      });

      it('should throw for unsupported framework', async () => {
        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');

        await expect(FrameworkRegistry.getPlugin('ember')).rejects.toThrow(
          'Unsupported framework: ember'
        );
      });

      it('should include supported list in error message', async () => {
        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');

        await expect(FrameworkRegistry.getPlugin('ember')).rejects.toThrow(
          /Supported frameworks:/
        );
      });
    });

    describe('detectFramework()', () => {
      it('should detect React in a React project', async () => {
        await writePackageJson(
          { react: '^18.2.0', 'react-dom': '^18.2.0' },
          { vite: '^5.0.0', '@vitejs/plugin-react': '^4.0.0' }
        );

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const plugin = await FrameworkRegistry.detectFramework(tempDir);

        expect(plugin).not.toBeNull();
        expect(plugin?.name).toBe('react');
      });

      it('should detect Vue in a Vue project', async () => {
        await writePackageJson(
          { vue: '^3.4.0' },
          { vite: '^5.0.0', '@vitejs/plugin-vue': '^5.0.0' }
        );

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const plugin = await FrameworkRegistry.detectFramework(tempDir);

        expect(plugin).not.toBeNull();
        expect(plugin?.name).toBe('vue');
      });

      it('should return null for unknown project', async () => {
        await writePackageJson({ express: '^4.18.0' });

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const plugin = await FrameworkRegistry.detectFramework(tempDir);

        expect(plugin).toBeNull();
      });

      it('should return null when no package.json exists', async () => {
        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const plugin = await FrameworkRegistry.detectFramework(tempDir);

        expect(plugin).toBeNull();
      });

      it('should pick highest confidence when multiple frameworks detected', async () => {
        // React with high confidence, Vue with medium confidence
        await writePackageJson(
          {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            vue: '^3.4.0',
          },
          {
            vite: '^5.0.0',
            '@vitejs/plugin-react': '^4.0.0',
          }
        );

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const plugin = await FrameworkRegistry.detectFramework(tempDir);

        // React should win because it has high confidence (react + react-dom + vite plugin)
        // Vue has medium confidence (vue only, no @vitejs/plugin-vue)
        expect(plugin).not.toBeNull();
        expect(plugin?.name).toBe('react');
      });
    });

    describe('detectAll()', () => {
      it('should return results for all registered frameworks', async () => {
        await writePackageJson({ react: '^18.2.0', 'react-dom': '^18.2.0' });

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const results = await FrameworkRegistry.detectAll(tempDir);

        // Should have entries for react and vue at minimum
        expect(results.has('react')).toBe(true);
        expect(results.has('vue')).toBe(true);
      });

      it('should show React as detected and Vue as not detected', async () => {
        await writePackageJson({ react: '^18.2.0', 'react-dom': '^18.2.0' });

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const results = await FrameworkRegistry.detectAll(tempDir);

        const reactResult = results.get('react');
        const vueResult = results.get('vue');

        expect(reactResult?.detected).toBe(true);
        expect(vueResult?.detected).toBe(false);
      });

      it('should detect both React and Vue in a mixed project', async () => {
        await writePackageJson(
          {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            vue: '^3.4.0',
          },
          {
            vite: '^5.0.0',
            '@vitejs/plugin-react': '^4.0.0',
            '@vitejs/plugin-vue': '^5.0.0',
          }
        );

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const results = await FrameworkRegistry.detectAll(tempDir);

        expect(results.get('react')?.detected).toBe(true);
        expect(results.get('vue')?.detected).toBe(true);
      });

      it('should show no frameworks detected in a plain Node project', async () => {
        await writePackageJson({ express: '^4.18.0', lodash: '^4.17.21' });

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const results = await FrameworkRegistry.detectAll(tempDir);

        const reactResult = results.get('react');
        const vueResult = results.get('vue');

        expect(reactResult?.detected).toBe(false);
        expect(vueResult?.detected).toBe(false);
      });

      it('should handle missing plugins gracefully with low confidence fallback', async () => {
        await writePackageJson({ express: '^4.18.0' });

        const { FrameworkRegistry } =
          await import('../../src/frameworks/index.js');
        const results = await FrameworkRegistry.detectAll(tempDir);

        // Angular and Svelte plugins do not exist yet, so detectAll
        // should set them to { detected: false, confidence: 'low' }
        const angularResult = results.get('angular');
        const svelteResult = results.get('svelte');

        expect(angularResult?.detected).toBe(false);
        expect(angularResult?.confidence).toBe('low');
        expect(svelteResult?.detected).toBe(false);
        expect(svelteResult?.confidence).toBe('low');
      });
    });
  });

  describe('plugin properties', () => {
    it('React plugin should have name "react"', async () => {
      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();

      expect(plugin.name).toBe('react');
    });

    it('Vue plugin should have name "vue"', async () => {
      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();

      expect(plugin.name).toBe('vue');
    });
  });

  describe('validateConfig()', () => {
    it('React plugin should warn about non-standard componentsDir', async () => {
      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = plugin.validateConfig({ componentsDir: 'lib/widgets' });

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });

    it('React plugin should not warn about standard componentsDir', async () => {
      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = plugin.validateConfig({
        componentsDir: 'src/components/ui',
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('Vue plugin should warn about non-standard utilsDir', async () => {
      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = plugin.validateConfig({ utilsDir: 'helpers' });

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });

    it('Vue plugin should not warn about standard utilsDir', async () => {
      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const result = plugin.validateConfig({ utilsDir: 'src/composables' });

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('getTypeScriptConfig()', () => {
    it('React plugin should return jsx: react-jsx', async () => {
      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const tsConfig = plugin.getTypeScriptConfig();

      const compilerOptions = tsConfig.compilerOptions as Record<
        string,
        unknown
      >;
      expect(compilerOptions.jsx).toBe('react-jsx');
    });

    it('Vue plugin should return jsx: preserve', async () => {
      const { VuePlugin } = await import('../../src/frameworks/vue/index.js');
      const plugin = new VuePlugin();
      const tsConfig = plugin.getTypeScriptConfig();

      const compilerOptions = tsConfig.compilerOptions as Record<
        string,
        unknown
      >;
      expect(compilerOptions.jsx).toBe('preserve');
    });
  });

  describe('edge cases', () => {
    it('should handle empty dependencies gracefully', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'empty-project',
        version: '1.0.0',
      });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(false);
    });

    it('should handle package.json with only devDependencies', async () => {
      await writePackageJson({}, { react: '^18.2.0', 'react-dom': '^18.2.0' });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
    });

    it('should handle version without prefix', async () => {
      await writePackageJson({ react: '18.2.0', 'react-dom': '18.2.0' });

      const { ReactPlugin } =
        await import('../../src/frameworks/react/index.js');
      const plugin = new ReactPlugin();
      const result = await plugin.detect(tempDir);

      expect(result.detected).toBe(true);
      expect(result.version).toBe('18.2.0');
    });
  });
});
