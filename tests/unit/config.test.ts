/**
 * Configuration Tests
 *
 * Tests for src/utils/config.ts:
 * - loadConfig() - Load configuration from project (raw + filepath)
 * - saveConfig() - Patch primitive that writes back to discovered filepath
 * - getConfig() - Get resolved configuration with defaults + strict validation
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
import {
  ConfigInvalidError,
  ConfigNotFoundError,
} from '../../src/errors/config.js';

type DiskConfig = Partial<KigumiConfig> & Record<string, unknown>;

const baseConfig: DiskConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  theme: {
    selected: 'default',
    palette: 'default',
    brandColor: 'blue',
  },
};

describe('config management', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-config-test-'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('loadConfig', () => {
    it('should return null when no config file exists', () => {
      expect(loadConfig(testDir)).toBeNull();
    });

    it('should load kigumi.config.json with filepath', async () => {
      const onDisk: DiskConfig = {
        ...baseConfig,
        framework: 'react',
        theme: { selected: 'awesome', palette: 'bright', brandColor: 'purple' },
      };
      const filepath = path.join(testDir, 'kigumi.config.json');
      await fs.writeJson(filepath, onDisk);

      const loaded = loadConfig(testDir);
      expect(loaded).not.toBeNull();
      expect(loaded?.filepath).toBe(filepath);
      expect((loaded?.config as DiskConfig).framework).toBe('react');
      expect((loaded?.config as DiskConfig).theme).toEqual(onDisk.theme);
    });

    it('should load kigumi-components.json (legacy name)', async () => {
      const onDisk: DiskConfig = { ...baseConfig, framework: 'vue' };
      await fs.writeJson(path.join(testDir, 'kigumi-components.json'), onDisk);

      const loaded = loadConfig(testDir);
      expect((loaded?.config as DiskConfig).framework).toBe('vue');
      expect(path.basename(loaded?.filepath ?? '')).toBe(
        'kigumi-components.json'
      );
    });

    it('should prioritize kigumi.config.json over legacy name', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), {
        ...baseConfig,
        framework: 'react',
      });
      await fs.writeJson(path.join(testDir, 'kigumi-components.json'), {
        ...baseConfig,
        framework: 'vue',
      });

      const loaded = loadConfig(testDir);
      expect((loaded?.config as DiskConfig).framework).toBe('react');
      expect(path.basename(loaded?.filepath ?? '')).toBe('kigumi.config.json');
    });

    it.each([
      ['kigumi.json', baseConfig],
      ['.kigumirc', baseConfig],
      ['.kigumirc.json', baseConfig],
    ])('should load config from %s', async (filename, onDisk) => {
      await fs.writeJson(path.join(testDir, filename), onDisk);
      const loaded = loadConfig(testDir);
      expect(loaded).not.toBeNull();
      expect((loaded?.config as DiskConfig).framework).toBe('react');
    });

    it('should load config from package.json kigumi key', async () => {
      const packageJson = {
        name: 'test-project',
        kigumi: { ...baseConfig, framework: 'angular' },
      };
      await fs.writeJson(path.join(testDir, 'package.json'), packageJson);

      const loaded = loadConfig(testDir);
      expect((loaded?.config as DiskConfig).framework).toBe('angular');
      expect(path.basename(loaded?.filepath ?? '')).toBe('package.json');
    });

    it('should not walk to ancestor directories (stopDir = cwd)', async () => {
      const parent = await fs.mkdtemp(
        path.join(os.tmpdir(), 'kigumi-config-mono-')
      );
      try {
        await fs.writeJson(path.join(parent, 'kigumi.config.json'), baseConfig);
        const child = path.join(parent, 'packages', 'foo');
        await fs.ensureDir(child);

        expect(loadConfig(child)).toBeNull();
      } finally {
        await fs.remove(parent);
      }
    });
  });

  describe('saveConfig', () => {
    it('should write the patch back to the discovered filepath', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), baseConfig);

      await saveConfig({ kigumiVersion: '0.20.0' }, testDir);

      const saved = (await fs.readJson(
        path.join(testDir, 'kigumi.config.json')
      )) as DiskConfig;
      expect(saved.framework).toBe('react');
      expect(saved.kigumiVersion).toBe('0.20.0');
    });

    it('should write back to legacy filename, not create kigumi.config.json', async () => {
      await fs.writeJson(
        path.join(testDir, 'kigumi-components.json'),
        baseConfig
      );

      await saveConfig({ kigumiVersion: '0.20.0' }, testDir);

      expect(
        await fs.pathExists(path.join(testDir, 'kigumi.config.json'))
      ).toBe(false);
      const saved = (await fs.readJson(
        path.join(testDir, 'kigumi-components.json')
      )) as DiskConfig;
      expect(saved.kigumiVersion).toBe('0.20.0');
    });

    it('should preserve sibling top-level keys when writing package.json#kigumi', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      await fs.writeJson(packageJsonPath, {
        name: 'host-project',
        version: '1.0.0',
        dependencies: { vue: '^3.0.0' },
        kigumi: baseConfig,
      });

      await saveConfig({ kigumiVersion: '0.20.0' }, testDir);

      const saved = (await fs.readJson(packageJsonPath)) as Record<
        string,
        unknown
      >;
      expect(saved.name).toBe('host-project');
      expect(saved.version).toBe('1.0.0');
      expect(saved.dependencies).toEqual({ vue: '^3.0.0' });
      expect((saved.kigumi as DiskConfig).kigumiVersion).toBe('0.20.0');
    });

    it('should not re-inject defaults the user removed', async () => {
      const slim: DiskConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      };
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), slim);

      await saveConfig({ kigumiVersion: '0.20.0' }, testDir);

      const saved = (await fs.readJson(
        path.join(testDir, 'kigumi.config.json')
      )) as DiskConfig;
      expect(saved).not.toHaveProperty('utilsDir');
      expect(saved).not.toHaveProperty('stylesDir');
      expect(saved).not.toHaveProperty('webAwesome');
      expect(saved.kigumiVersion).toBe('0.20.0');
    });

    it('should one-level merge nested theme without dropping sibling keys', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), baseConfig);

      await saveConfig({ theme: { selected: 'awesome' } }, testDir);

      const saved = (await fs.readJson(
        path.join(testDir, 'kigumi.config.json')
      )) as DiskConfig;
      expect(saved.theme).toEqual({
        selected: 'awesome',
        palette: 'default',
        brandColor: 'blue',
      });
    });

    it('should one-level merge nested webAwesome without dropping sibling keys', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), {
        ...baseConfig,
        webAwesome: { version: '^3.1.0' },
      });

      await saveConfig({ webAwesome: { version: '^3.2.0' } }, testDir);

      const saved = (await fs.readJson(
        path.join(testDir, 'kigumi.config.json')
      )) as DiskConfig;
      expect(saved.webAwesome).toEqual({ version: '^3.2.0' });
    });

    it('should format JSON with 2-space indentation', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), baseConfig);

      await saveConfig({ kigumiVersion: '0.20.0' }, testDir);

      const content = await fs.readFile(
        path.join(testDir, 'kigumi.config.json'),
        'utf-8'
      );
      expect(content).toContain('  "framework"');
    });

    it('should throw ConfigNotFoundError when no config file is on disk', async () => {
      await expect(
        saveConfig({ kigumiVersion: '0.20.0' }, testDir)
      ).rejects.toBeInstanceOf(ConfigNotFoundError);
    });
  });

  describe('getConfig', () => {
    it('should throw ConfigNotFoundError when no config file exists', () => {
      expect(() => getConfig(testDir)).toThrow(ConfigNotFoundError);
    });

    it('should merge user config with defaults', async () => {
      const partialConfig: DiskConfig = {
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
      expect(config.framework).toBe('vue');
      expect(config.typescript).toBe(false);
      expect(config.componentsDir).toBe('src/vue-components');
      expect(config.theme.selected).toBe('awesome');
    });

    it('should fill default utilsDir/stylesDir when omitted on disk', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), baseConfig);

      const config = getConfig(testDir);
      expect(config.utilsDir).toBe(DEFAULT_CONFIG.utilsDir);
      expect(config.stylesDir).toBe(DEFAULT_CONFIG.stylesDir);
    });

    it('should retain default webAwesome.version when user omits webAwesome', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), baseConfig);

      const config = getConfig(testDir);
      expect(config.webAwesome?.version).toBe(DEFAULT_WEBAWESOME_VERSION);
    });

    it('should throw ConfigInvalidError on unrecognized top-level keys (typo defense)', async () => {
      const typoConfig = { ...baseConfig, framwork: 'vue' };
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), typoConfig);

      let caught: unknown;
      try {
        getConfig(testDir);
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(ConfigInvalidError);
      const errors = (caught as ConfigInvalidError).context.details
        ?.errors as string[];
      expect(errors.some((e) => e.includes('framwork'))).toBe(true);
    });

    it('should silently fill from DEFAULT_CONFIG on empty config object', async () => {
      // `{}` round-trips through mergeWithDefaults and produces DEFAULT_CONFIG.
      // This is intentional: a user writing `{}` is not breaking strict mode
      // (no unknown keys, no invalid values), so the lifecycle stays happy.
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), {});

      const config = getConfig(testDir);
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should throw ConfigInvalidError on invalid framework value', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), {
        ...baseConfig,
        framework: 'svelte',
      });

      expect(() => getConfig(testDir)).toThrow(ConfigInvalidError);
    });

    it('should preserve all DEFAULT_CONFIG properties', () => {
      expect(DEFAULT_CONFIG.framework).toBe('react');
      expect(DEFAULT_CONFIG.typescript).toBe(true);
      expect(DEFAULT_CONFIG.componentsDir).toBe('src/components/ui');
      expect(DEFAULT_CONFIG.utilsDir).toBe('src/lib');
      expect(DEFAULT_CONFIG.stylesDir).toBe('src/styles');
      expect(DEFAULT_CONFIG.theme.selected).toBe('default');
      expect(DEFAULT_CONFIG.theme.palette).toBe('default');
      expect(DEFAULT_CONFIG.theme.brandColor).toBe('blue');
      expect(DEFAULT_CONFIG.webAwesome?.version).toBe(
        DEFAULT_WEBAWESOME_VERSION
      );
    });
  });

  describe('round-trip lifecycle', () => {
    it('should round-trip a patch through .kigumirc without creating a parallel file', async () => {
      const filepath = path.join(testDir, '.kigumirc');
      await fs.writeJson(filepath, baseConfig);

      await saveConfig({ kigumiVersion: '0.20.0' }, testDir);

      const reloaded = loadConfig(testDir);
      expect(path.basename(reloaded?.filepath ?? '')).toBe('.kigumirc');
      expect(
        await fs.pathExists(path.join(testDir, 'kigumi.config.json'))
      ).toBe(false);
      expect((reloaded?.config as DiskConfig).kigumiVersion).toBe('0.20.0');
    });

    it('should round-trip through package.json#kigumi without disturbing siblings', async () => {
      const filepath = path.join(testDir, 'package.json');
      await fs.writeJson(filepath, {
        name: 'host',
        scripts: { build: 'tsc' },
        kigumi: baseConfig,
      });

      await saveConfig(
        {
          theme: { selected: 'brutal', palette: 'vibrant', brandColor: 'red' },
        },
        testDir
      );

      const reloaded = await fs.readJson(filepath);
      expect(reloaded.name).toBe('host');
      expect(reloaded.scripts).toEqual({ build: 'tsc' });
      expect(reloaded.kigumi.theme).toEqual({
        selected: 'brutal',
        palette: 'vibrant',
        brandColor: 'red',
      });
    });
  });

  describe('edge cases', () => {
    it('should return raw payload from loadConfig on empty config object', async () => {
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), {});
      const loaded = loadConfig(testDir);
      expect(loaded?.config).toEqual({});
    });

    it('should throw on malformed JSON via cosmiconfig', async () => {
      await fs.writeFile(
        path.join(testDir, 'kigumi.config.json'),
        '{ invalid json }'
      );
      expect(() => loadConfig(testDir)).toThrow();
    });

    it('should preserve unknown keys in the raw loadConfig result (validation happens in getConfig)', async () => {
      const configWithExtras: DiskConfig = {
        ...baseConfig,
        unknownField: 'preserved at load level',
      };
      await fs.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        configWithExtras
      );

      const loaded = loadConfig(testDir);
      expect(loaded?.config).toHaveProperty(
        'unknownField',
        'preserved at load level'
      );
    });
  });
});
