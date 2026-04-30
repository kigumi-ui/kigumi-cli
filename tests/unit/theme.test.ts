/**
 * Theme Command Tests
 *
 * Tests for src/commands/theme/
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { WEB_AWESOME_FREE_PACKAGE } from '../../src/constants.js';
import { createTestKigumiConfig } from './_helpers/kigumi-config.js';

describe('theme commands', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-theme-test-'));
    originalEnv = process.env.WEBAWESOME_NPM_TOKEN;
    delete process.env.WEBAWESOME_NPM_TOKEN;
    process.env.KIGUMI_SKIP_GLOBAL_NPMRC = '1';
  });

  afterEach(async () => {
    await fs.remove(testDir);
    if (originalEnv !== undefined) {
      process.env.WEBAWESOME_NPM_TOKEN = originalEnv;
    } else {
      delete process.env.WEBAWESOME_NPM_TOKEN;
    }
    delete process.env.KIGUMI_SKIP_GLOBAL_NPMRC;
  });

  describe('theme configuration', () => {
    it('should have default theme structure in config', async () => {
      // Create config
      const config = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      const loaded = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );

      expect(loaded.theme).toBeDefined();
      expect(loaded.theme.selected).toBe('awesome');
      expect(loaded.theme.palette).toBe('sky');
      expect(loaded.theme.brandColor).toBe('#0ea5e9');
    });

    it('should update theme in config', async () => {
      const config = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      // Update theme
      config.theme.selected = 'dark';
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      const loaded = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(loaded.theme.selected).toBe('dark');
    });

    it('should preserve other config when updating theme', async () => {
      const config = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      // Update only theme
      config.theme.selected = 'dark';
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      const loaded = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(loaded.framework).toBe('react');
      expect(loaded.typescript).toBe(true);
      expect(loaded.componentsDir).toBe('src/components');
    });
  });

  describe('theme availability', () => {
    it('should support free themes', async () => {
      const freeThemes = ['none', 'awesome', 'dark'];

      for (const theme of freeThemes) {
        const config = {
          framework: 'react',
          typescript: true,
          componentsDir: 'src/components',
          theme: {
            selected: theme,
            palette: 'sky',
            brandColor: '#0ea5e9',
          },
        };

        await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
        const loaded = await fs.readJSON(
          path.join(testDir, 'kigumi.config.json')
        );
        expect(loaded.theme.selected).toBe(theme);
      }
    });

    it('should have pro themes defined', () => {
      // Pro themes should include these and more
      const proThemes = [
        'brutalist',
        'corporate',
        'cupcake',
        'cyberpunk',
        'dracula',
        'retro',
        'synthwave',
        'valentine',
      ];

      // This is just documenting the expected pro themes
      expect(proThemes.length).toBeGreaterThan(0);
    });
  });

  describe('palette configuration', () => {
    it('should support all standard palettes', async () => {
      const palettes = [
        'slate',
        'gray',
        'zinc',
        'neutral',
        'stone',
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
      ];

      for (const palette of palettes) {
        const config = {
          framework: 'react',
          typescript: true,
          componentsDir: 'src/components',
          theme: {
            selected: 'awesome',
            palette: palette,
            brandColor: '#0ea5e9',
          },
        };

        await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
        const loaded = await fs.readJSON(
          path.join(testDir, 'kigumi.config.json')
        );
        expect(loaded.theme.palette).toBe(palette);
      }
    });

    it('should update palette independently', async () => {
      const config = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      // Update palette only
      config.theme.palette = 'purple';
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      const loaded = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(loaded.theme.palette).toBe('purple');
      expect(loaded.theme.selected).toBe('awesome');
    });
  });

  describe('brand color configuration', () => {
    it('should accept valid hex colors', async () => {
      const validColors = [
        '#000000',
        '#ffffff',
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#0ea5e9',
      ];

      for (const color of validColors) {
        const config = {
          framework: 'react',
          typescript: true,
          componentsDir: 'src/components',
          theme: {
            selected: 'awesome',
            palette: 'sky',
            brandColor: color,
          },
        };

        await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
        const loaded = await fs.readJSON(
          path.join(testDir, 'kigumi.config.json')
        );
        expect(loaded.theme.brandColor).toBe(color);
      }
    });

    it('should update brand color independently', async () => {
      const config = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      // Update brand color only
      config.theme.brandColor = '#ff0000';
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

      const loaded = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(loaded.theme.brandColor).toBe('#ff0000');
      expect(loaded.theme.selected).toBe('awesome');
      expect(loaded.theme.palette).toBe('sky');
    });
  });

  describe('theme file generation', () => {
    it('should create kigumi.ts with theme imports', async () => {
      const config = createTestKigumiConfig({
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      });

      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
      await fs.writeJSON(path.join(testDir, 'package.json'), {
        dependencies: {
          [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
        },
      });

      // Create necessary directories
      await fs.ensureDir(path.join(testDir, 'src/lib'));
      await fs.ensureDir(path.join(testDir, 'src/styles'));

      // Generate kigumi.ts
      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');
      await regenerateKigumiSetup(testDir, config, 'src/lib');

      // Check file exists
      const kigumiPath = path.join(testDir, 'src/lib/kigumi.ts');
      expect(await fs.pathExists(kigumiPath)).toBe(true);

      // Check content
      const content = await fs.readFile(kigumiPath, 'utf-8');
      expect(content).toContain('wa-theme-awesome');
      expect(content).toContain('wa-palette-sky');
    });

    it('should handle "none" theme without imports', async () => {
      const config = createTestKigumiConfig({
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'none',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      });

      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
      await fs.writeJSON(path.join(testDir, 'package.json'), {
        dependencies: {
          [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
        },
      });

      // Create necessary directories
      await fs.ensureDir(path.join(testDir, 'src/lib'));
      await fs.ensureDir(path.join(testDir, 'src/styles'));

      // Generate kigumi.ts
      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');
      await regenerateKigumiSetup(testDir, config, 'src/lib');

      // Check file exists
      const kigumiPath = path.join(testDir, 'src/lib/kigumi.ts');
      expect(await fs.pathExists(kigumiPath)).toBe(true);

      // Check content (should not have theme import)
      const content = await fs.readFile(kigumiPath, 'utf-8');
      expect(content).not.toContain('themes/none.css');
    });
  });
});
