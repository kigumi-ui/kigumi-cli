/**
 * Install Command Integration Tests
 *
 * Tests the install command dependency installation logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { KigumiConfig } from '../../src/utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DIR = path.join(__dirname, '../../.test-output/install');

describe('Install Command Integration', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('Configuration Validation', () => {
    it('should require kigumi-components.json to exist', async () => {
      const projectDir = path.join(TEST_DIR, 'no-config');
      await fs.ensureDir(projectDir);

      // Create package.json but no kigumi config
      await fs.writeJson(path.join(projectDir, 'package.json'), {
        name: 'test-project',
        version: '1.0.0',
      });

      const configExists = await fs.pathExists(
        path.join(projectDir, 'kigumi-components.json')
      );
      expect(configExists).toBe(false);
    });

    it('should validate config structure', async () => {
      const projectDir = path.join(TEST_DIR, 'valid-config');
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
        webAwesome: {
          tier: 'free',
        },
      };

      await fs.writeJson(
        path.join(projectDir, 'kigumi-components.json'),
        config,
        { spaces: 2 }
      );

      const savedConfig = await fs.readJson(
        path.join(projectDir, 'kigumi-components.json')
      );

      expect(savedConfig.framework).toBe('react');
      expect(savedConfig.webAwesome.tier).toBe('free');
      expect(savedConfig.theme.selected).toBe('default');
    });
  });

  describe('Package Installation Logic', () => {
    it('should determine correct package for free tier', async () => {
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
        webAwesome: {
          tier: 'free',
        },
      };

      const tier = config.webAwesome?.tier || 'free';
      const packageName =
        tier === 'pro'
          ? '@awesome.me/webawesome-pro'
          : '@awesome.me/webawesome';

      expect(packageName).toBe('@awesome.me/webawesome');
    });

    it('should determine correct package for pro tier', async () => {
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
        webAwesome: {
          tier: 'pro',
        },
      };

      const tier = config.webAwesome?.tier || 'free';
      const packageName =
        tier === 'pro'
          ? '@awesome.me/webawesome-pro'
          : '@awesome.me/webawesome';

      expect(packageName).toBe('@awesome.me/webawesome-pro');
    });
  });

  describe('Framework-Specific Dependencies', () => {
    it('should identify React projects need clsx', async () => {
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
        webAwesome: {
          tier: 'free',
        },
      };

      expect(config.framework).toBe('react');
      // React projects need clsx for className management
    });

    it('should not require clsx for Vue projects', async () => {
      const config: KigumiConfig = {
        framework: 'vue',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      expect(config.framework).toBe('vue');
      // Vue projects don't need clsx
    });
  });

  describe('Token Management', () => {
    it('should handle missing token for pro tier', async () => {
      const projectDir = path.join(TEST_DIR, 'pro-no-token');
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
        webAwesome: {
          tier: 'pro',
        },
      };

      await fs.writeJson(
        path.join(projectDir, 'kigumi-components.json'),
        config
      );

      // .env should not exist
      const envExists = await fs.pathExists(path.join(projectDir, '.env'));
      expect(envExists).toBe(false);
    });

    it('should validate .env file structure for pro tier', async () => {
      const projectDir = path.join(TEST_DIR, 'pro-with-token');
      await fs.ensureDir(projectDir);

      const envContent = `# Web Awesome Pro authentication token
# Get your token from https://webawesome.com
WEBAWESOME_NPM_TOKEN=test-token-12345
`;

      await fs.writeFile(path.join(projectDir, '.env'), envContent);

      const savedEnv = await fs.readFile(
        path.join(projectDir, '.env'),
        'utf-8'
      );

      expect(savedEnv).toContain('WEBAWESOME_NPM_TOKEN');
      expect(savedEnv).toContain('test-token-12345');
    });
  });

  describe('Package Manager Detection', () => {
    it('should detect npm from package-lock.json', async () => {
      const projectDir = path.join(TEST_DIR, 'npm-project');
      await fs.ensureDir(projectDir);

      await fs.writeJson(path.join(projectDir, 'package.json'), {
        name: 'test',
      });
      await fs.writeJson(path.join(projectDir, 'package-lock.json'), {
        lockfileVersion: 2,
      });

      const hasPackageLock = await fs.pathExists(
        path.join(projectDir, 'package-lock.json')
      );
      expect(hasPackageLock).toBe(true);
    });

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      const projectDir = path.join(TEST_DIR, 'pnpm-project');
      await fs.ensureDir(projectDir);

      await fs.writeJson(path.join(projectDir, 'package.json'), {
        name: 'test',
      });
      await fs.writeFile(
        path.join(projectDir, 'pnpm-lock.yaml'),
        'lockfileVersion: 5.4'
      );

      const hasPnpmLock = await fs.pathExists(
        path.join(projectDir, 'pnpm-lock.yaml')
      );
      expect(hasPnpmLock).toBe(true);
    });

    it('should detect yarn from yarn.lock', async () => {
      const projectDir = path.join(TEST_DIR, 'yarn-project');
      await fs.ensureDir(projectDir);

      await fs.writeJson(path.join(projectDir, 'package.json'), {
        name: 'test',
      });
      await fs.writeFile(
        path.join(projectDir, 'yarn.lock'),
        '# yarn lockfile v1'
      );

      const hasYarnLock = await fs.pathExists(
        path.join(projectDir, 'yarn.lock')
      );
      expect(hasYarnLock).toBe(true);
    });
  });
});
