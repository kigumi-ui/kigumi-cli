/**
 * Framework Plugin Contract Tests
 *
 * These tests ensure that all framework plugins correctly implement
 * the FrameworkPlugin interface and follow the contract.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { FrameworkRegistry } from '../../src/frameworks/index.js';
import type { FrameworkPlugin } from '../../src/frameworks/types.js';

describe('Framework Plugin Contract', () => {
  const frameworks = ['react', 'vue', 'angular', 'svelte'];

  it('should have at least one framework registered', () => {
    const registered = FrameworkRegistry.getSupportedFrameworks();
    expect(registered.length).toBeGreaterThan(0);
  });

  it('should support react, vue, angular, and svelte', () => {
    const registered = FrameworkRegistry.getSupportedFrameworks();
    expect(registered).toContain('react');
    expect(registered).toContain('vue');
    expect(registered).toContain('angular');
    expect(registered).toContain('svelte');
  });

  // Test each framework plugin
  describe.each(frameworks)('%s plugin', (frameworkName) => {
    let plugin: FrameworkPlugin;

    beforeAll(async () => {
      plugin = await FrameworkRegistry.getPlugin(frameworkName);
    });

    describe('Plugin Interface', () => {
      it('should have correct name', () => {
        expect(plugin.name).toBe(frameworkName);
      });

      it('should implement detect()', () => {
        expect(typeof plugin.detect).toBe('function');
      });

      it('should implement generateComponent()', () => {
        expect(typeof plugin.generateComponent).toBe('function');
      });

      it('should implement generateSetupFiles()', () => {
        expect(typeof plugin.generateSetupFiles).toBe('function');
      });

      it('should implement installDependencies()', () => {
        expect(typeof plugin.installDependencies).toBe('function');
      });

      it('should implement validateConfig()', () => {
        expect(typeof plugin.validateConfig).toBe('function');
      });
    });

    describe('detect() method', () => {
      it('should return DetectionResult with required fields', async () => {
        const result = await plugin.detect('/tmp/non-existent-project');

        expect(result).toHaveProperty('detected');
        expect(result).toHaveProperty('confidence');
        expect(typeof result.detected).toBe('boolean');

        if (result.detected) {
          expect(['high', 'medium', 'low']).toContain(result.confidence);
        }
      });

      it('should return false for non-existent directory', async () => {
        const result = await plugin.detect('/tmp/non-existent-project-xyz-123');
        expect(result.detected).toBe(false);
      });

      it('should handle errors gracefully', async () => {
        // Should not throw
        await expect(plugin.detect('/invalid/path')).resolves.toBeDefined();
      });
    });

    describe('validateConfig() method', () => {
      it('should return ValidationResult', () => {
        const result = plugin.validateConfig({});

        expect(result).toHaveProperty('valid');
        expect(typeof result.valid).toBe('boolean');
      });

      it('should accept minimal config', () => {
        const result = plugin.validateConfig({
          framework: frameworkName,
          typescript: true,
          componentsDir: 'src/components',
        });

        expect(result).toHaveProperty('valid');
      });

      it('should return errors array when invalid', () => {
        const result = plugin.validateConfig({
          framework: frameworkName,
          componentsDir: '', // Invalid
        });

        if (!result.valid) {
          expect(Array.isArray(result.errors)).toBe(true);
        }
      });
    });

    describe('getTypeScriptConfig() method', () => {
      it('should return object or undefined', () => {
        const config = plugin.getTypeScriptConfig?.();

        if (config !== undefined) {
          expect(typeof config).toBe('object');
        }
      });
    });

    describe('getBuildConfig() method', () => {
      it('should return object or undefined', () => {
        const config = plugin.getBuildConfig?.();

        if (config !== undefined) {
          expect(typeof config).toBe('object');
        }
      });
    });
  });

  describe('FrameworkRegistry', () => {
    it('should get plugin by name', async () => {
      const plugin = await FrameworkRegistry.getPlugin('react');
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('react');
    });

    it('should throw error for unsupported framework', async () => {
      await expect(
        FrameworkRegistry.getPlugin('unsupported-framework')
      ).rejects.toThrow(/Unsupported framework/);
    });

    it('should check if framework is supported', () => {
      expect(FrameworkRegistry.isSupported('react')).toBe(true);
      expect(FrameworkRegistry.isSupported('vue')).toBe(true);
      expect(FrameworkRegistry.isSupported('unsupported')).toBe(false);
    });

    it('should detect all frameworks', async () => {
      const results = await FrameworkRegistry.detectAll('/tmp/non-existent');

      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBeGreaterThan(0);

      for (const [name, result] of results) {
        expect(frameworks).toContain(name);
        expect(result).toHaveProperty('detected');
        expect(result).toHaveProperty('confidence');
      }
    });
  });
});
