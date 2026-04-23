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
import { DEFAULT_WEBAWESOME_VERSION } from '../../src/constants.js';

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
        framework: 'react',
        typescript: true,
        componentsDir: 'lib/components',
        theme: { selected: 'default', palette: 'mild', brandColor: 'green' },
      };
      await fs.writeJson(path.join(testDir, '.kigumirc'), testConfig);

      const config = loadConfig(testDir);
      expect(config?.framework).toBe('react');
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

      expect(config.theme.selected).toBe('awesome');
    });

    it('should deep merge partial theme, preserving un-specified defaults', async () => {
      // User only provides theme.selected; palette and brandColor must retain defaults.
      // This test FAILS with the old { ...DEFAULT_CONFIG, ...userConfig } shallow spread
      // and PASSES with mergeWithDefaults().
      const partialThemeConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'awesome',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        partialThemeConfig
      );

      const config = getConfig(testDir);

      expect(config.theme.selected).toBe('awesome');
      expect(config.theme.palette).toBe(DEFAULT_CONFIG.theme.palette);
      expect(config.theme.brandColor).toBe(DEFAULT_CONFIG.theme.brandColor);
    });

    it('should use all user-provided theme values when full theme is specified', async () => {
      const fullThemeConfig = {
        framework: 'vue',
        typescript: false,
        componentsDir: 'src/vue-ui',
        theme: {
          selected: 'brutal',
          palette: 'vibrant',
          brandColor: 'crimson',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        fullThemeConfig
      );

      const config = getConfig(testDir);

      expect(config.theme.selected).toBe('brutal');
      expect(config.theme.palette).toBe('vibrant');
      expect(config.theme.brandColor).toBe('crimson');
      expect(config.theme.palette).not.toBe(DEFAULT_CONFIG.theme.palette);
      expect(config.theme.brandColor).not.toBe(DEFAULT_CONFIG.theme.brandColor);
    });

    it('should retain default webAwesome.version when user config omits webAwesome', async () => {
      const noWebAwesomeConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        noWebAwesomeConfig
      );

      const config = getConfig(testDir);

      expect(config.webAwesome?.version).toBe(DEFAULT_WEBAWESOME_VERSION);
    });

    it('should deep merge partial webAwesome, preserving un-specified defaults', async () => {
      // User provides only cdnUrl; version must retain the default.
      // This is the exact F-004 pattern applied to webAwesome: with the old
      // shallow spread the entire webAwesome object would be replaced,
      // dropping version. With mergeWithDefaults, version survives.
      const partialWebAwesomeConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          cdnUrl: 'https://cdn.example.com',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        partialWebAwesomeConfig
      );

      const config = getConfig(testDir);

      expect(config.webAwesome?.cdnUrl).toBe('https://cdn.example.com');
      expect(config.webAwesome?.version).toBe(DEFAULT_WEBAWESOME_VERSION);
    });

    it('should deep merge partial aliases, preserving un-specified defaults', async () => {
      // User only overrides @/components; @/lib and @/styles must retain defaults.
      // Same F-004-class bug as theme: without deep merge the entire aliases
      // object would be replaced.
      const partialAliasesConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        aliases: {
          '@/components': './src/ui',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        partialAliasesConfig
      );

      const config = getConfig(testDir);

      expect(config.aliases?.['@/components']).toBe('./src/ui');
      expect(config.aliases?.['@/lib']).toBe(DEFAULT_CONFIG.aliases?.['@/lib']);
      expect(config.aliases?.['@/styles']).toBe(
        DEFAULT_CONFIG.aliases?.['@/styles']
      );
    });

    it('should use all user-provided alias values when all default keys are overridden', async () => {
      // Inverse of the partial-aliases test: user overrides all 3 default
      // keys. No default values should leak through.
      const fullAliasesConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        aliases: {
          '@/components': './app/ui',
          '@/lib': './app/lib',
          '@/styles': './app/styles',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        fullAliasesConfig
      );

      const config = getConfig(testDir);

      expect(config.aliases?.['@/components']).toBe('./app/ui');
      expect(config.aliases?.['@/lib']).toBe('./app/lib');
      expect(config.aliases?.['@/styles']).toBe('./app/styles');
      expect(config.aliases?.['@/components']).not.toBe(
        DEFAULT_CONFIG.aliases?.['@/components']
      );
      expect(config.aliases?.['@/lib']).not.toBe(
        DEFAULT_CONFIG.aliases?.['@/lib']
      );
      expect(config.aliases?.['@/styles']).not.toBe(
        DEFAULT_CONFIG.aliases?.['@/styles']
      );
    });

    it('should merge user-added alias keys with default keys', async () => {
      // User adds a new alias key (@/hooks) not in defaults. The new key
      // must be preserved AND all 3 default keys must also survive. This
      // is the realistic usage pattern -- consumers typically ADD aliases
      // rather than overriding defaults.
      const addedAliasConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        aliases: {
          '@/hooks': './src/hooks',
        },
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        addedAliasConfig
      );

      const config = getConfig(testDir);

      expect(config.aliases?.['@/hooks']).toBe('./src/hooks');
      expect(config.aliases?.['@/components']).toBe(
        DEFAULT_CONFIG.aliases?.['@/components']
      );
      expect(config.aliases?.['@/lib']).toBe(DEFAULT_CONFIG.aliases?.['@/lib']);
      expect(config.aliases?.['@/styles']).toBe(
        DEFAULT_CONFIG.aliases?.['@/styles']
      );
    });

    it('should strip unknown properties while preserving known ones', async () => {
      // getConfig() routes through kigumiConfigSchema.parse(), which drops
      // keys not declared in the schema. Document this behavior explicitly.
      // Positive control: known-in-schema properties on the same config must
      // survive, proving Zod strips selectively, not everything.
      const configWithExtras = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        customProperty: 'should be stripped by Zod',
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        configWithExtras
      );

      const config = getConfig(testDir);

      // Unknown property is stripped
      expect(config).not.toHaveProperty('customProperty');
      // Known properties survive
      expect(config.framework).toBe('react');
      expect(config.typescript).toBe(true);
      expect(config.componentsDir).toBe('src/components/ui');
      expect(config.theme.selected).toBe('default');
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
      expect(DEFAULT_CONFIG.webAwesome?.version).toBe(
        DEFAULT_WEBAWESOME_VERSION
      );
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
