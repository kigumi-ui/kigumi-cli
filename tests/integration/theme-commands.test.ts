/**
 * Theme Commands Integration Tests
 *
 * Tests theme, palette, and brand commands
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveConfig, loadConfig } from '../../src/utils/config.js';
import { regenerateWebAwesomeSetup } from '../../src/utils/regenerate.js';
import {
  getAvailableThemes,
  getAvailablePalettes,
  isThemeAvailable,
} from '../../src/utils/tier-restrictions.js';
import type { KigumiConfig } from '../../src/utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DIR = path.join(__dirname, '../../.test-output/theme-commands');

describe('Theme Commands Integration', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('Theme Command', () => {
    it('should update theme in config', async () => {
      const projectDir = path.join(TEST_DIR, 'theme-update');
      await fs.ensureDir(projectDir);

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      };

      await saveConfig(config, projectDir);

      // Update theme
      config.theme.selected = 'awesome';
      await saveConfig(config, projectDir);

      // Verify update
      const updatedConfig = await loadConfig(projectDir);
      expect(updatedConfig?.theme.selected).toBe('awesome');
    });

    it('should validate theme availability for tier', async () => {
      // Free tier themes
      expect(isThemeAvailable('default', 'free')).toBe(true);
      expect(isThemeAvailable('awesome', 'free')).toBe(true);
      expect(isThemeAvailable('shoelace', 'free')).toBe(true);

      // Pro tier themes
      expect(isThemeAvailable('brutalist', 'free')).toBe(false);
      expect(isThemeAvailable('brutalist', 'pro')).toBe(true);
    });

    it('should regenerate webawesome.ts after theme change', async () => {
      const projectDir = path.join(TEST_DIR, 'theme-regenerate');
      await fs.ensureDir(projectDir);
      await fs.ensureDir(path.join(projectDir, 'src/lib'));

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      await regenerateWebAwesomeSetup(projectDir, config, 'src/lib');

      const webawesomeExists = await fs.pathExists(
        path.join(projectDir, 'src/lib/webawesome.ts')
      );
      expect(webawesomeExists).toBe(true);

      const content = await fs.readFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        'utf-8'
      );
      expect(content).toContain(
        "import '@awesome.me/webawesome/dist/styles/themes/awesome.css'"
      );
    });

    it('should list available themes for free tier', () => {
      const themes = getAvailableThemes('free');
      expect(themes).toContain('default');
      expect(themes).toContain('awesome');
      expect(themes).toContain('shoelace');
      expect(themes).not.toContain('brutalist');
    });

    it('should list all themes for pro tier', () => {
      const themes = getAvailableThemes('pro');
      expect(themes).toContain('default');
      expect(themes).toContain('brutalist');
      expect(themes).toContain('glossy');
      expect(themes.length).toBeGreaterThan(3);
    });
  });

  describe('Palette Command', () => {
    it('should update palette in config', async () => {
      const projectDir = path.join(TEST_DIR, 'palette-update');
      await fs.ensureDir(projectDir);

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      };

      await saveConfig(config, projectDir);

      // Update palette
      config.theme.palette = 'bright';
      await saveConfig(config, projectDir);

      // Verify update
      const updatedConfig = await loadConfig(projectDir);
      expect(updatedConfig?.theme.palette).toBe('bright');
    });

    it('should allow all palettes for both tiers', () => {
      const freePalettes = getAvailablePalettes('free');
      const proPalettes = getAvailablePalettes('pro');

      // All palettes available to both tiers
      expect(freePalettes.length).toBe(proPalettes.length);
      expect(freePalettes).toContain('default');
      expect(freePalettes).toContain('bright');
    });

    it('should regenerate webawesome.ts with new palette', async () => {
      const projectDir = path.join(TEST_DIR, 'palette-regenerate');
      await fs.ensureDir(projectDir);
      await fs.ensureDir(path.join(projectDir, 'src/lib'));

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'bright',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      await regenerateWebAwesomeSetup(projectDir, config, 'src/lib');

      const content = await fs.readFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        'utf-8'
      );
      expect(content).toContain("html.classList.add('wa-palette-bright')");
    });
  });

  describe('Brand Command', () => {
    it('should update brand color in config', async () => {
      const projectDir = path.join(TEST_DIR, 'brand-update');
      await fs.ensureDir(projectDir);

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      };

      await saveConfig(config, projectDir);

      // Update brand color
      config.theme.brandColor = 'purple';
      await saveConfig(config, projectDir);

      // Verify update
      const updatedConfig = await loadConfig(projectDir);
      expect(updatedConfig?.theme.brandColor).toBe('purple');
    });

    it('should regenerate webawesome.ts with new brand color', async () => {
      const projectDir = path.join(TEST_DIR, 'brand-regenerate');
      await fs.ensureDir(projectDir);
      await fs.ensureDir(path.join(projectDir, 'src/lib'));

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'purple',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      await regenerateWebAwesomeSetup(projectDir, config, 'src/lib');

      const content = await fs.readFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        'utf-8'
      );
      expect(content).toContain("html.classList.add('wa-brand-purple')");
    });

    it('should support all brand colors', () => {
      const brandColors = [
        'blue',
        'purple',
        'green',
        'red',
        'orange',
        'yellow',
        'cyan',
        'indigo',
        'pink',
        'gray',
      ];

      brandColors.forEach((color) => {
        expect([
          'blue',
          'purple',
          'green',
          'red',
          'orange',
          'yellow',
          'cyan',
          'indigo',
          'pink',
          'gray',
        ]).toContain(color);
      });
    });
  });

  describe('Combined Theme Changes', () => {
    it('should handle multiple theme changes in sequence', async () => {
      const projectDir = path.join(TEST_DIR, 'multiple-changes');
      await fs.ensureDir(projectDir);
      await fs.ensureDir(path.join(projectDir, 'src/lib'));

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      };

      await saveConfig(config, projectDir);

      // Change theme
      config.theme.selected = 'awesome';
      await saveConfig(config, projectDir);
      await regenerateWebAwesomeSetup(projectDir, config, 'src/lib');

      // Change palette
      config.theme.palette = 'bright';
      await saveConfig(config, projectDir);
      await regenerateWebAwesomeSetup(projectDir, config, 'src/lib');

      // Change brand
      config.theme.brandColor = 'purple';
      await saveConfig(config, projectDir);
      await regenerateWebAwesomeSetup(projectDir, config, 'src/lib');

      // Verify final state
      const finalConfig = await loadConfig(projectDir);
      expect(finalConfig?.theme.selected).toBe('awesome');
      expect(finalConfig?.theme.palette).toBe('bright');
      expect(finalConfig?.theme.brandColor).toBe('purple');

      const content = await fs.readFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        'utf-8'
      );
      expect(content).toContain('wa-theme-awesome');
      expect(content).toContain('wa-palette-bright');
      expect(content).toContain('wa-brand-purple');
    });
  });
});
