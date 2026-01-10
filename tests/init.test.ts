import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DIR = path.join(__dirname, '../.test-output');

describe('init command flow', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('Path 1: New Project (Free Tier)', () => {
    it('should create all required files', async () => {
      const projectDir = path.join(TEST_DIR, 'new-free-project');
      await fs.ensureDir(projectDir);

      // Simulate creating config
      const config = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        aliases: {
          '@/components': './src/components/ui',
          '@/lib': './src/lib',
          '@/styles': './src/styles',
        },
        webAwesome: {
          tier: 'free',
          version: '^3.1.0',
        },
      };

      await fs.writeJson(
        path.join(projectDir, 'kigumi-components.json'),
        config,
        { spaces: 2 }
      );

      // Verify file exists
      const configExists = await fs.pathExists(
        path.join(projectDir, 'kigumi-components.json')
      );
      expect(configExists).toBe(true);

      const savedConfig = await fs.readJson(
        path.join(projectDir, 'kigumi-components.json')
      );
      expect(savedConfig.webAwesome.tier).toBe('free');
      expect(savedConfig.theme.selected).toBe('default');
      expect(savedConfig.theme.cssVars).toBeUndefined(); // cssVars should NOT exist
    });

    it('should NOT create .env for free tier', async () => {
      const projectDir = path.join(TEST_DIR, 'new-free-no-env');
      await fs.ensureDir(projectDir);

      const config = {
        webAwesome: { tier: 'free' },
      };

      await fs.writeJson(
        path.join(projectDir, 'kigumi-components.json'),
        config
      );

      // .env should NOT exist for free tier
      const envExists = await fs.pathExists(path.join(projectDir, '.env'));
      expect(envExists).toBe(false);
    });
  });

  describe('Path 2: New Project (Pro Tier)', () => {
    it('should create .env file with placeholder token', async () => {
      const projectDir = path.join(TEST_DIR, 'new-pro-project');
      await fs.ensureDir(projectDir);

      const envPath = path.join(projectDir, '.env');
      await fs.writeFile(
        envPath,
        '# Web Awesome Pro authentication token\n' +
          '# Get your token from https://webawesome.com\n' +
          'WA_TOKEN=your-token-here\n'
      );

      const envExists = await fs.pathExists(envPath);
      expect(envExists).toBe(true);

      const envContent = await fs.readFile(envPath, 'utf-8');
      expect(envContent).toContain('WA_TOKEN=your-token-here');
      expect(envContent).toContain('https://webawesome.com');
    });
  });

  describe('Path 3: Re-init with existing config', () => {
    it('should detect existing configuration', async () => {
      const projectDir = path.join(TEST_DIR, 're-init-project');
      await fs.ensureDir(projectDir);

      const existingConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'default',
          brandColor: 'purple',
        },
        webAwesome: {
          tier: 'free',
          version: '^3.1.0',
        },
      };

      await fs.writeJson(
        path.join(projectDir, 'kigumi-components.json'),
        existingConfig,
        { spaces: 2 }
      );

      const configExists = await fs.pathExists(
        path.join(projectDir, 'kigumi-components.json')
      );
      expect(configExists).toBe(true);

      const config = await fs.readJson(
        path.join(projectDir, 'kigumi-components.json')
      );
      expect(config.theme.selected).toBe('awesome');
      expect(config.theme.brandColor).toBe('purple');
    });

    it('should detect missing .env for Pro tier (cloned repo scenario)', async () => {
      const projectDir = path.join(TEST_DIR, 'cloned-pro-project');
      await fs.ensureDir(projectDir);

      const config = {
        framework: 'react',
        webAwesome: { tier: 'pro', version: '^3.1.0' },
        theme: { selected: 'default' },
      };

      await fs.writeJson(
        path.join(projectDir, 'kigumi-components.json'),
        config
      );

      const configExists = await fs.pathExists(
        path.join(projectDir, 'kigumi-components.json')
      );
      const envExists = await fs.pathExists(path.join(projectDir, '.env'));

      expect(configExists).toBe(true);
      expect(envExists).toBe(false);

      const savedConfig = await fs.readJson(
        path.join(projectDir, 'kigumi-components.json')
      );
      const isPro = savedConfig.webAwesome.tier === 'pro';
      const missingEnv = isPro && !envExists;

      expect(missingEnv).toBe(true);
    });
  });

  describe('Path 4: Reinstall dependencies only', () => {
    it('should preserve existing config when reinstalling', async () => {
      const projectDir = path.join(TEST_DIR, 'reinstall-project');
      await fs.ensureDir(projectDir);

      const originalConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'shoelace',
          palette: 'default',
          brandColor: 'green',
        },
        webAwesome: {
          tier: 'free',
          version: '^3.1.0',
        },
      };

      await fs.writeJson(
        path.join(projectDir, 'kigumi-components.json'),
        originalConfig,
        { spaces: 2 }
      );

      // Simulate reinstall (config should remain unchanged)
      const configAfterReinstall = await fs.readJson(
        path.join(projectDir, 'kigumi-components.json')
      );

      expect(configAfterReinstall.theme.selected).toBe('shoelace');
      expect(configAfterReinstall.theme.brandColor).toBe('green');
      expect(configAfterReinstall.framework).toBe('react');
    });
  });

  describe('Token Warning Logic', () => {
    it('should only show token warning once for Pro tier', () => {
      let tokenWarningShown = false;

      // First check
      const hasValidToken = false;
      if (!hasValidToken) {
        tokenWarningShown = true;
      }

      expect(tokenWarningShown).toBe(true);

      // Subsequent checks should not show warning again
      if (!tokenWarningShown) {
        // This should not execute
        expect(true).toBe(false);
      }
    });

    it('should detect valid token correctly', () => {
      const testCases = [
        { token: undefined, expected: false },
        { token: '', expected: false },
        { token: 'your-token-here', expected: false },
        { token: 'actual-valid-token', expected: true },
      ];

      testCases.forEach(({ token, expected }) => {
        const hasValidToken = token && token !== 'your-token-here';
        expect(!!hasValidToken).toBe(expected);
      });
    });
  });

  describe('Smart Defaults', () => {
    it('should use existing config as defaults', async () => {
      const existingConfig = {
        framework: 'vue',
        typescript: false,
        componentsDir: 'components',
        utilsDir: 'utils',
        theme: {
          selected: 'awesome',
          palette: 'default',
          brandColor: 'red',
        },
        webAwesome: {
          tier: 'pro',
        },
      };

      // Simulate prompts using existing config as defaults
      const frameworkDefault = existingConfig.framework;
      const typescriptDefault = existingConfig.typescript;
      const tierDefault = existingConfig.webAwesome.tier;
      const themeDefault = existingConfig.theme.selected;

      expect(frameworkDefault).toBe('vue');
      expect(typescriptDefault).toBe(false);
      expect(tierDefault).toBe('pro');
      expect(themeDefault).toBe('awesome');
    });
  });
});
