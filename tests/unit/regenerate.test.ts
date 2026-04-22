/**
 * Regenerate Utilities Tests
 *
 * Tests for src/utils/regenerate.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

vi.mock('../../src/utils/tier.js', () => ({
  detectTierSync: vi.fn().mockReturnValue('free'),
  getWebAwesomePackage: vi.fn().mockReturnValue('@awesome.me/webawesome'),
}));

import {
  regenerateKigumiSetup,
  generateLayersCSS,
  generateViteEnvDts,
  generateThemeCSS,
  generateGitIgnore,
} from '../../src/utils/regenerate.js';
import { WEB_AWESOME_FREE_PACKAGE } from '../../src/constants.js';
import { getWebAwesomePackage } from '../../src/utils/tier.js';

const config = {
  framework: 'react' as const,
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: {
    selected: 'default',
    palette: 'default',
    brandColor: 'blue',
  },
};

describe('regenerate utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-regenerate-test-')
    );
    vi.clearAllMocks();
    vi.mocked(getWebAwesomePackage).mockReturnValue('@awesome.me/webawesome');
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('regenerateKigumiSetup', () => {
    it('should generate kigumi.ts and layers.css in correct directories', async () => {
      const utilsDir = config.utilsDir;
      const stylesDir = config.stylesDir;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));

      await regenerateKigumiSetup(testDir, config, utilsDir);

      const kigumiPath = path.join(testDir, utilsDir, 'kigumi.ts');
      const layersPath = path.join(testDir, stylesDir, 'layers.css');

      expect(await fs.pathExists(kigumiPath)).toBe(true);
      expect(await fs.pathExists(layersPath)).toBe(true);
    });

    it('should respect preserveLayersCSS option when layers.css exists', async () => {
      const utilsDir = config.utilsDir;
      const stylesDir = config.stylesDir;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));

      // Pre-create layers.css with custom content
      const layersPath = path.join(testDir, stylesDir, 'layers.css');
      const customContent = '/* custom layers content */\n';
      await fs.writeFile(layersPath, customContent);

      const result = await regenerateKigumiSetup(
        testDir,
        config,
        utilsDir,
        undefined,
        { preserveLayersCSS: true }
      );

      // layers.css should NOT be overwritten
      const layersContent = await fs.readFile(layersPath, 'utf-8');
      expect(layersContent).toBe(customContent);
      expect(result.layersPreserved).toBe(true);
    });

    it('should generate layers.css when preserveLayersCSS is true but file does not exist', async () => {
      const utilsDir = config.utilsDir;
      const stylesDir = config.stylesDir;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));

      const result = await regenerateKigumiSetup(
        testDir,
        config,
        utilsDir,
        undefined,
        { preserveLayersCSS: true }
      );

      const layersPath = path.join(testDir, stylesDir, 'layers.css');
      expect(await fs.pathExists(layersPath)).toBe(true);
      expect(result.layersPreserved).toBe(false);
    });

    it('should use local import path for community themes', async () => {
      const utilsDir = config.utilsDir;
      const stylesDir = config.stylesDir;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));

      const communityConfig = {
        ...config,
        theme: {
          selected: 'my-theme',
          palette: 'default',
          brandColor: 'blue',
        },
        installedThemes: {
          'my-theme': { source: 'community' as const },
        },
      };

      await regenerateKigumiSetup(testDir, communityConfig, utilsDir);

      const layersPath = path.join(testDir, stylesDir, 'layers.css');
      const layersContent = await fs.readFile(layersPath, 'utf-8');
      // Community themes live as siblings of layers.css; use relative path
      // so CSS @import works under any bundler without tsconfig alias
      // resolution (Next Pages Router Webpack doesn't resolve @/ in CSS).
      expect(layersContent).toContain('./community-themes/my-theme.css');
      expect(layersContent).not.toContain(
        '@awesome.me/webawesome/dist/styles/themes/my-theme.css'
      );
    });

    it('should use package import for built-in themes', async () => {
      const utilsDir = config.utilsDir;
      const stylesDir = config.stylesDir;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));

      await regenerateKigumiSetup(testDir, config, utilsDir);

      const layersPath = path.join(testDir, stylesDir, 'layers.css');
      const layersContent = await fs.readFile(layersPath, 'utf-8');
      expect(layersContent).toContain(
        '@awesome.me/webawesome/dist/styles/themes/default.css'
      );
    });

    it('should include theme classes script when theme.selected is not none', async () => {
      const utilsDir = config.utilsDir;
      const stylesDir = config.stylesDir;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));

      await regenerateKigumiSetup(testDir, config, utilsDir);

      const kigumiPath = path.join(testDir, utilsDir, 'kigumi.ts');
      const content = await fs.readFile(kigumiPath, 'utf-8');
      expect(content).toContain('wa-theme-default');
      expect(content).toContain('wa-palette-default');
      expect(content).toContain('wa-brand-blue');
    });

    it('should NOT include theme classes when theme.selected is none', async () => {
      const utilsDir = config.utilsDir;
      const stylesDir = config.stylesDir;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));

      const noneConfig = {
        ...config,
        theme: {
          selected: 'none',
          palette: 'default',
          brandColor: 'blue',
        },
      };

      await regenerateKigumiSetup(testDir, noneConfig, utilsDir);

      const kigumiPath = path.join(testDir, utilsDir, 'kigumi.ts');
      const content = await fs.readFile(kigumiPath, 'utf-8');
      expect(content).not.toContain('wa-theme-');
      expect(content).not.toContain('wa-palette-');
      expect(content).not.toContain('wa-brand-');
    });

    it('should use tierOverride when provided instead of detecting', async () => {
      const utilsDir = config.utilsDir;
      const stylesDir = config.stylesDir;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));

      vi.mocked(getWebAwesomePackage).mockImplementation((tier) =>
        tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome'
      );

      await regenerateKigumiSetup(testDir, config, utilsDir, 'pro');

      const layersPath = path.join(testDir, stylesDir, 'layers.css');
      const layersContent = await fs.readFile(layersPath, 'utf-8');
      expect(layersContent).toContain('@awesome.me/webawesome-pro');
    });
  });

  describe('generateLayersCSS', () => {
    it('should include correct layer order', async () => {
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'default',
        'src/styles'
      );
      expect(content).toContain('@layer base, theme;');
    });

    it('should import built-in theme from package path', async () => {
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'tailspin',
        'src/styles'
      );
      expect(content).toContain(
        '@awesome.me/webawesome/dist/styles/themes/tailspin.css'
      );
    });

    it('should import community theme from local path', async () => {
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'my-community-theme',
        'src/styles',
        true
      );
      // Community themes are siblings of layers.css — use relative path.
      expect(content).toContain('./community-themes/my-community-theme.css');
      expect(content).not.toContain(
        '@awesome.me/webawesome/dist/styles/themes/my-community-theme.css'
      );
    });

    it('should use relative path for theme.css import', async () => {
      // theme.css is a sibling of layers.css, so a relative specifier
      // works in both Vite and Next (including Pages Router, where the
      // Webpack CSS loader does not resolve the `@/` tsconfig alias
      // inside `@import` statements).
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'default',
        'src/styles'
      );
      expect(content).toContain("./theme.css' layer(theme)");
      expect(content).not.toContain('@/styles/theme.css');
    });
  });

  describe('generateViteEnvDts', () => {
    it('should contain declare global (not declare module react)', async () => {
      const srcDir = 'src';
      await fs.ensureDir(path.join(testDir, srcDir));

      await generateViteEnvDts(testDir, srcDir);

      const content = await fs.readFile(
        path.join(testDir, srcDir, 'vite-env.d.ts'),
        'utf-8'
      );
      expect(content).toContain('declare global');
    });

    it('should interpolate package name correctly', async () => {
      const srcDir = 'src';
      await fs.ensureDir(path.join(testDir, srcDir));

      await generateViteEnvDts(testDir, srcDir, '@awesome.me/webawesome-pro');

      const content = await fs.readFile(
        path.join(testDir, srcDir, 'vite-env.d.ts'),
        'utf-8'
      );
      expect(content).toContain('@awesome.me/webawesome-pro');
      expect(content).toContain(
        '@awesome.me/webawesome-pro/dist/custom-elements-jsx.d.ts'
      );
    });

    it('should default to WEB_AWESOME_FREE_PACKAGE when no waPackage provided', async () => {
      const srcDir = 'src';
      await fs.ensureDir(path.join(testDir, srcDir));

      await generateViteEnvDts(testDir, srcDir);

      const content = await fs.readFile(
        path.join(testDir, srcDir, 'vite-env.d.ts'),
        'utf-8'
      );
      expect(content).toContain(WEB_AWESOME_FREE_PACKAGE);
    });
  });

  describe('generateThemeCSS', () => {
    it('should contain :root block', async () => {
      const content = await generateThemeCSS();
      expect(content).toContain(':root');
    });

    it('should contain placeholder CSS comment', async () => {
      const content = await generateThemeCSS();
      expect(content).toContain(
        '/* Your custom CSS variable overrides here */'
      );
    });
  });

  describe('generateGitIgnore', () => {
    it('should create .gitignore when it does not exist', async () => {
      await generateGitIgnore(testDir);

      const gitignorePath = path.join(testDir, '.gitignore');
      expect(await fs.pathExists(gitignorePath)).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('.env');
      expect(content).toContain('node_modules/');
    });

    it('should add .env entries to existing .gitignore that is missing them', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\ndist/\n');

      await generateGitIgnore(testDir);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('.env');
      expect(content).toContain('.env.local');
      expect(content).toContain('.env.*.local');
    });

    it('should not duplicate .env entries if already present', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      const existingContent = 'node_modules/\n.env\ndist/\n';
      await fs.writeFile(gitignorePath, existingContent);

      await generateGitIgnore(testDir);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      // Count occurrences of '.env' lines (not substrings like .env.local)
      const envMatches = content.match(/^\.env$/gm);
      expect(envMatches).toHaveLength(1);
    });

    it('should ignore .kigumi/foreign/ in a fresh .gitignore', async () => {
      await generateGitIgnore(testDir);
      const content = await fs.readFile(
        path.join(testDir, '.gitignore'),
        'utf-8'
      );
      expect(content).toContain('.kigumi/foreign/');
    });

    it('should add .kigumi/foreign/ to an existing .gitignore that is missing it', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n.env\ndist/\n');

      await generateGitIgnore(testDir);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('.kigumi/foreign/');
    });

    it('should not duplicate .kigumi/foreign/ if already present', async () => {
      const gitignorePath = path.join(testDir, '.gitignore');
      await fs.writeFile(
        gitignorePath,
        'node_modules/\n.env\n.kigumi/foreign/\n'
      );

      await generateGitIgnore(testDir);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      const matches = content.match(/^\.kigumi\/foreign\/$/gm);
      expect(matches).toHaveLength(1);
    });
  });
});
