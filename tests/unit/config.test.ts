/**
 * Configuration Tests
 *
 * Tests for src/utils/config.ts:
 * - loadConfig() - Load configuration from project
 * - saveConfig() - Save configuration to project
 * - getConfig() - Get configuration with defaults
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  loadConfig,
  saveConfig,
  getConfig,
  DEFAULT_CONFIG,
  type KigumiConfig,
} from '../../src/utils/config.js';

describe('config management', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-config-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(testDir);
  });

  describe('loadConfig', () => {
    it('should return null when no config file exists', () => {
      const config = loadConfig(testDir);
      expect(config).toBeNull();
    });

    it('should load kigumi.config.json (preferred name)', async () => {
      const testConfig: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'awesome',
          palette: 'bright',
          brandColor: 'purple',
        },
      };
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), testConfig);

      const config = loadConfig(testDir);
      expect(config).not.toBeNull();
      expect(config?.framework).toBe('react');
      expect(config?.theme.selected).toBe('awesome');
    });

    it('should load kigumi-components.json (legacy name)', async () => {
      const testConfig = {
        framework: 'vue',
        typescript: false,
        componentsDir: 'src/ui',
        theme: {
          selected: 'shoelace',
          palette: 'default',
          brandColor: 'blue',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi-components.json'),
        testConfig
      );

      const config = loadConfig(testDir);
      expect(config).not.toBeNull();
      expect(config?.framework).toBe('vue');
    });

    it('should prioritize kigumi.config.json over legacy name', async () => {
      // Create both files with different content
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
      });
      await fs.writeJson(path.join(testDir, 'kigumi-components.json'), {
        framework: 'vue', // Different!
        typescript: false,
        componentsDir: 'src/ui',
        theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
      });

      const config = loadConfig(testDir);
      expect(config?.framework).toBe('react'); // Should use kigumi.config.json
    });

    it('should load config from .kigumirc', async () => {
      const testConfig = {
        framework: 'svelte',
        typescript: true,
        componentsDir: 'lib/components',
        theme: { selected: 'default', palette: 'mild', brandColor: 'green' },
      };
      await fs.writeJson(path.join(testDir, '.kigumirc'), testConfig);

      const config = loadConfig(testDir);
      expect(config?.framework).toBe('svelte');
    });

    it('should load config from package.json kigumi key', async () => {
      const packageJson = {
        name: 'test-project',
        kigumi: {
          framework: 'angular',
          typescript: true,
          componentsDir: 'src/app/components',
          theme: { selected: 'default', palette: 'elegant', brandColor: 'red' },
        },
      };
      await fs.writeJson(path.join(testDir, 'package.json'), packageJson);

      const config = loadConfig(testDir);
      expect(config?.framework).toBe('angular');
    });
  });

  describe('saveConfig', () => {
    it('should save config to kigumi.config.json', async () => {
      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'bright',
          brandColor: 'purple',
        },
        webAwesome: {
          version: '^3.1.0',
        },
      };

      await saveConfig(config, testDir);

      const savedPath = path.join(testDir, 'kigumi.config.json');
      expect(await fs.pathExists(savedPath)).toBe(true);

      const savedConfig = await fs.readJson(savedPath);
      expect(savedConfig.framework).toBe('react');
      expect(savedConfig.theme.selected).toBe('awesome');
    });

    it('should format JSON with 2-space indentation', async () => {
      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
      };

      await saveConfig(config, testDir);

      const content = await fs.readFile(
        path.join(testDir, 'kigumi.config.json'),
        'utf-8'
      );
      // Check for 2-space indentation
      expect(content).toContain('  "framework"');
    });

    it('should overwrite existing config', async () => {
      const config1: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
      };
      const config2: KigumiConfig = {
        framework: 'vue', // Changed!
        typescript: false, // Changed!
        componentsDir: 'src/ui', // Changed!
        theme: { selected: 'awesome', palette: 'bright', brandColor: 'purple' },
      };

      await saveConfig(config1, testDir);
      await saveConfig(config2, testDir);

      const savedConfig = await fs.readJson(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.framework).toBe('vue');
      expect(savedConfig.typescript).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return DEFAULT_CONFIG when no config file exists', () => {
      const config = getConfig(testDir);
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should merge user config with defaults', async () => {
      // Partial config - missing some fields
      const partialConfig = {
        framework: 'vue',
        typescript: false,
        componentsDir: 'src/vue-components',
        theme: {
          selected: 'awesome',
          palette: 'bright',
          brandColor: 'green',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        partialConfig
      );

      const config = getConfig(testDir);

      // User values should override defaults
      expect(config.framework).toBe('vue');
      expect(config.typescript).toBe(false);
      expect(config.componentsDir).toBe('src/vue-components');

      // Note: Simple spread merge doesn't deep merge nested objects
      // The theme object from user config replaces the default entirely
      expect(config.theme.selected).toBe('awesome');
    });

    it('should preserve all DEFAULT_CONFIG properties', () => {
      // Verify DEFAULT_CONFIG structure
      expect(DEFAULT_CONFIG.framework).toBe('react');
      expect(DEFAULT_CONFIG.typescript).toBe(true);
      expect(DEFAULT_CONFIG.componentsDir).toBe('src/components/ui');
      expect(DEFAULT_CONFIG.utilsDir).toBe('src/lib');
      expect(DEFAULT_CONFIG.theme.selected).toBe('default');
      expect(DEFAULT_CONFIG.theme.palette).toBe('default');
      expect(DEFAULT_CONFIG.theme.brandColor).toBe('blue');
      expect(DEFAULT_CONFIG.aliases).toBeDefined();
      expect(DEFAULT_CONFIG.webAwesome?.version).toBe('^3.1.0');
    });
  });

  describe('edge cases', () => {
    it('should handle empty config file gracefully', async () => {
      // Write empty JSON object
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), {});

      const config = loadConfig(testDir);
      expect(config).toEqual({});
    });

    it('should handle malformed JSON gracefully', async () => {
      // Write invalid JSON
      await fs.writeFile(
        path.join(testDir, 'kigumi.config.json'),
        '{ invalid json }'
      );

      // cosmiconfig should throw or return null
      expect(() => loadConfig(testDir)).toThrow();
    });

    it('should handle config with extra properties', async () => {
      const configWithExtras = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
        customProperty: 'should be preserved',
        anotherExtra: { nested: true },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        configWithExtras
      );

      const config = loadConfig(testDir);
      expect(config).toHaveProperty('customProperty', 'should be preserved');
      expect(config).toHaveProperty('anotherExtra');
    });
  });
});
