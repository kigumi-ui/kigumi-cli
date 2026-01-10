/**
 * Framework Detection Tests
 *
 * Tests framework auto-detection logic, including edge cases
 * like multi-framework projects and confidence scoring.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FrameworkRegistry } from '../../src/frameworks/index.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Framework Detection', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `kigumi-test-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  async function createPackageJson(deps: Record<string, string>) {
    await fs.writeJson(path.join(testDir, 'package.json'), {
      name: 'test-project',
      version: '1.0.0',
      dependencies: deps.dependencies || {},
      devDependencies: deps.devDependencies || {},
    });
  }

  describe('React Detection', () => {
    it('should detect React with high confidence (React + ReactDOM + Vite)', async () => {
      await createPackageJson({
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        devDependencies: {
          vite: '^5.0.0',
          '@vitejs/plugin-react': '^4.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('react');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('high');
    });

    it('should detect React with medium confidence (React + ReactDOM only)', async () => {
      await createPackageJson({
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin?.name).toBe('react');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('medium');
    });

    it('should detect React with low confidence (React only)', async () => {
      await createPackageJson({
        dependencies: {
          react: '^18.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin?.name).toBe('react');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('low');
    });
  });

  describe('Vue Detection', () => {
    it('should detect Vue with high confidence (Vue + Vite)', async () => {
      await createPackageJson({
        dependencies: {
          vue: '^3.0.0',
        },
        devDependencies: {
          vite: '^5.0.0',
          '@vitejs/plugin-vue': '^4.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('vue');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('high');
    });

    it('should detect Vue with medium confidence (Vue only)', async () => {
      await createPackageJson({
        dependencies: {
          vue: '^3.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin?.name).toBe('vue');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('medium');
    });
  });

  describe('Angular Detection', () => {
    it('should detect Angular with high confidence', async () => {
      await createPackageJson({
        dependencies: {
          '@angular/core': '^17.0.0',
          '@angular/common': '^17.0.0',
        },
        devDependencies: {
          '@angular/cli': '^17.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('angular');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('high');
    });

    it('should detect Angular with medium confidence', async () => {
      await createPackageJson({
        dependencies: {
          '@angular/core': '^17.0.0',
          '@angular/common': '^17.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin?.name).toBe('angular');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('medium');
    });
  });

  describe('Svelte Detection', () => {
    it('should detect Svelte with high confidence (Svelte + SvelteKit)', async () => {
      await createPackageJson({
        dependencies: {
          svelte: '^4.0.0',
        },
        devDependencies: {
          '@sveltejs/kit': '^2.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('svelte');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('high');
    });

    it('should detect Svelte with medium confidence (Svelte only)', async () => {
      await createPackageJson({
        dependencies: {
          svelte: '^4.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin?.name).toBe('svelte');

      const result = await plugin!.detect(testDir);
      expect(result.confidence).toBe('medium');
    });
  });

  describe('Edge Cases', () => {
    it('should return null for no framework', async () => {
      await createPackageJson({
        dependencies: {
          lodash: '^4.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin).toBeNull();
    });

    it('should return null for empty project', async () => {
      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin).toBeNull();
    });

    it('should handle multi-framework projects (React + Vue)', async () => {
      await createPackageJson({
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          vue: '^3.0.0',
        },
        devDependencies: {
          vite: '^5.0.0',
          '@vitejs/plugin-react': '^4.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      expect(plugin).toBeDefined();

      // Should pick the one with higher confidence (React in this case)
      expect(['react', 'vue']).toContain(plugin?.name);
    });

    it('should extract version from package.json', async () => {
      await createPackageJson({
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      const result = await plugin!.detect(testDir);

      expect(result.version).toBe('18.2.0');
    });

    it('should include detection details', async () => {
      await createPackageJson({
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        devDependencies: {
          vite: '^5.0.0',
          '@vitejs/plugin-react': '^4.0.0',
        },
      });

      const plugin = await FrameworkRegistry.detectFramework(testDir);
      const result = await plugin!.detect(testDir);

      expect(result.details).toBeDefined();
      expect(result.details?.packageJsonDeps).toBeDefined();
      expect(result.details?.configFiles).toBeDefined();
    });
  });

  describe('detectAll()', () => {
    it('should return detection results for all frameworks', async () => {
      await createPackageJson({
        dependencies: {
          react: '^18.0.0',
        },
      });

      const results = await FrameworkRegistry.detectAll(testDir);

      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBe(4); // react, vue, angular, svelte

      // React should be detected
      const reactResult = results.get('react');
      expect(reactResult).toBeDefined();
      expect(reactResult?.detected).toBe(true);

      // Others should not be detected
      const vueResult = results.get('vue');
      expect(vueResult?.detected).toBe(false);

      const angularResult = results.get('angular');
      expect(angularResult?.detected).toBe(false);

      const svelteResult = results.get('svelte');
      expect(svelteResult?.detected).toBe(false);
    });
  });
});
