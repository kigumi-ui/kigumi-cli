/**
 * Regenerate Utilities Tests
 *
 * Tests for src/utils/regenerate.ts
 *
 * Cluster S, F-126: drops the tier module-level mock entirely.
 * regenerateKigumiSetup takes the tier as a required argument (issue #121:
 * commands detect it before their first write), so every test passes it.
 * getWebAwesomePackage is a pure function returning the WA constants the
 * tests already assert against, so no mock is needed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { writeTierFixture } from './_helpers/tier.js';

import {
  regenerateKigumiSetup,
  generateLayersCSS,
  generateViteEnvDts,
  generateThemeCSS,
  generateGitIgnore,
} from '../../src/utils/regenerate.js';
import { WEB_AWESOME_FREE_PACKAGE } from '../../src/constants.js';
import { TIER_RESTRICTIONS } from '../../src/utils/tier-restrictions.js';

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
    // A free package.json keeps the project realistic; isNextProject reads it.
    await writeTierFixture(testDir, 'free');
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

      await regenerateKigumiSetup(testDir, config, utilsDir, 'free');

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
        'free',
        { preserveLayersCSS: true }
      );

      // layers.css should NOT be overwritten
      const layersContent = await fs.readFile(layersPath, 'utf-8');
      expect(layersContent).toBe(customContent);
      expect(result.layersPreserved).toBe(true);
    });

    it('creates overrides.css next to the layers.css it writes, and keeps an existing one', async () => {
      // Every theme, brand and palette change rewrites layers.css, which
      // imports overrides.css: a project without one would stop building.
      const { utilsDir, stylesDir } = config;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));
      const overridesPath = path.join(testDir, stylesDir, 'overrides.css');

      const first = await regenerateKigumiSetup(
        testDir,
        config,
        utilsDir,
        'free'
      );
      expect(first.overrides).toEqual({ created: true, layers: 'present' });
      expect(await fs.pathExists(overridesPath)).toBe(true);

      const mine = '.Card { border: 0 }';
      await fs.writeFile(overridesPath, mine);
      const second = await regenerateKigumiSetup(
        testDir,
        config,
        utilsDir,
        'free'
      );
      expect(second.overrides.created).toBe(false);
      expect(await fs.readFile(overridesPath, 'utf-8')).toBe(mine);
    });

    it('adds the overrides layer to a layers.css it preserves', async () => {
      // init keeps an existing layers.css; one from before the overrides
      // layer must still import overrides.css, or rules there never load.
      const { utilsDir, stylesDir } = config;
      await fs.ensureDir(path.join(testDir, utilsDir));
      await fs.ensureDir(path.join(testDir, stylesDir));
      const layersPath = path.join(testDir, stylesDir, 'layers.css');
      await fs.writeFile(
        layersPath,
        "@layer base, theme;\n@import './theme.css' layer(theme);\n"
      );

      const result = await regenerateKigumiSetup(
        testDir,
        config,
        utilsDir,
        'free',
        { preserveLayersCSS: true }
      );

      expect(result.layersPreserved).toBe(true);
      expect(result.overrides.layers).toBe('added');
      const content = await fs.readFile(layersPath, 'utf-8');
      expect(content).toContain('@layer base, theme, overrides;');
      expect(content).toContain("@import './overrides.css' layer(overrides);");
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
        'free',
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

      await regenerateKigumiSetup(testDir, communityConfig, utilsDir, 'free');

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

      await regenerateKigumiSetup(testDir, config, utilsDir, 'free');

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

      await regenerateKigumiSetup(testDir, config, utilsDir, 'free');

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

      await regenerateKigumiSetup(testDir, noneConfig, utilsDir, 'free');

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

      await regenerateKigumiSetup(testDir, config, utilsDir, 'pro');

      const layersPath = path.join(testDir, stylesDir, 'layers.css');
      const layersContent = await fs.readFile(layersPath, 'utf-8');
      expect(layersContent).toContain('@awesome.me/webawesome-pro');
    });
  });

  describe('regenerateKigumiSetup and a palette the tier lacks', () => {
    // A Pro palette left in the config after a move to Free names a file
    // the Free package does not ship: importing it would fail the build.
    it('imports the default palette instead', async () => {
      await fs.ensureDir(path.join(testDir, config.utilsDir));
      await fs.ensureDir(path.join(testDir, config.stylesDir));
      await regenerateKigumiSetup(
        testDir,
        { ...config, theme: { ...config.theme, palette: 'rudimentary' } },
        config.utilsDir,
        'free'
      );
      const content = await fs.readFile(
        path.join(testDir, config.stylesDir, 'layers.css'),
        'utf-8'
      );
      expect(content).toContain(
        "@import '@awesome.me/webawesome/dist/styles/color/palettes/default.css' layer(base);"
      );
      expect(content).not.toContain('rudimentary');
    });
  });

  describe('regenerateKigumiSetup with layers.css preserved (init)', () => {
    // Issue #174: init keeps an existing layers.css, which may predate the
    // palette import or name the palette the project had before.
    const PRESERVED = `@layer base, theme, overrides;

@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);
/* my own rules */
@import './theme.css' layer(theme);
@import './overrides.css' layer(overrides);
`;

    async function initWith(palette: string) {
      await fs.ensureDir(path.join(testDir, config.utilsDir));
      await fs.ensureDir(path.join(testDir, config.stylesDir));
      const layersPath = path.join(testDir, config.stylesDir, 'layers.css');
      await fs.writeFile(layersPath, PRESERVED);
      const result = await regenerateKigumiSetup(
        testDir,
        { ...config, theme: { ...config.theme, palette } },
        config.utilsDir,
        'free',
        { preserveLayersCSS: true }
      );
      return { result, content: await fs.readFile(layersPath, 'utf-8') };
    }

    it('adds the configured palette import and keeps the rest', async () => {
      const { result, content } = await initWith('bright');

      expect(result.layersPreserved).toBe(true);
      expect(result.palette).toBe('added');
      expect(content).toContain('/* my own rules */');
      expect(content).toContain(
        "@import '@awesome.me/webawesome/dist/styles/color/palettes/bright.css' layer(base);"
      );
    });

    it('reports a layers.css that already imports it as present', async () => {
      await initWith('bright');
      const again = await regenerateKigumiSetup(
        testDir,
        { ...config, theme: { ...config.theme, palette: 'bright' } },
        config.utilsDir,
        'free',
        { preserveLayersCSS: true }
      );
      expect(again.palette).toBe('present');
    });
  });

  describe('generateLayersCSS', () => {
    it('should include correct layer order', async () => {
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'default',
        'default',
        'src/styles'
      );
      expect(content).toContain('@layer base, theme, overrides;');
    });

    it('imports overrides.css into the overrides layer, after theme.css', async () => {
      // ADR 0009: custom CSS lives in its own file and layer, so it beats
      // theme.css whatever their specificity.
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'default',
        'default',
        'src/styles'
      );
      const theme = content.indexOf("@import './theme.css' layer(theme);");
      const overrides = content.indexOf(
        "@import './overrides.css' layer(overrides);"
      );
      expect(theme).toBeGreaterThan(-1);
      expect(overrides).toBeGreaterThan(theme);
    });

    it('should import built-in theme from package path', async () => {
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'tailspin',
        'default',
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
        'default',
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
        'default',
        'src/styles'
      );
      expect(content).toContain("./theme.css' layer(theme)");
      expect(content).not.toContain('@/styles/theme.css');
    });

    // Issue #174: Web Awesome's palettes other than `default` are scoped to
    // `.wa-palette-<name>`, so the class kigumi.ts sets does nothing unless
    // layers.css loads the palette's stylesheet.
    it('imports the configured palette into the base layer, after the theme', async () => {
      const content = await generateLayersCSS(
        '@awesome.me/webawesome-pro',
        'default',
        'rudimentary',
        'src/styles'
      );
      const theme = content.indexOf(
        "@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base);"
      );
      const palette = content.indexOf(
        "@import '@awesome.me/webawesome-pro/dist/styles/color/palettes/rudimentary.css' layer(base);"
      );
      expect(theme).toBeGreaterThan(-1);
      expect(palette).toBeGreaterThan(theme);
      expect(palette).toBeLessThan(content.indexOf("@import './theme.css'"));
    });

    it('imports the palette from the package for a community theme', async () => {
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'my-community-theme',
        'bright',
        'src/styles',
        true
      );
      expect(content).toContain(
        "@import '@awesome.me/webawesome/dist/styles/color/palettes/bright.css' layer(base);"
      );
    });

    it('imports the palette without a layer on the Pages Router', async () => {
      const content = await generateLayersCSS(
        '@awesome.me/webawesome',
        'default',
        'shoelace',
        'src/styles',
        false,
        'pages'
      );
      expect(content).toContain(
        "@import '@awesome.me/webawesome/dist/styles/color/palettes/shoelace.css';"
      );
    });

    it('points every Free palette at a stylesheet the package ships', async () => {
      for (const palette of TIER_RESTRICTIONS.palettes.free) {
        const content = await generateLayersCSS(
          WEB_AWESOME_FREE_PACKAGE,
          'default',
          palette,
          'src/styles'
        );
        const specifier = new RegExp(
          `@import '(${WEB_AWESOME_FREE_PACKAGE}/[^']*/${palette}\\.css)'`
        ).exec(content)?.[1];
        expect(specifier, palette).toBeDefined();
        expect(
          await fs.pathExists(path.join('node_modules', specifier as string)),
          specifier
        ).toBe(true);
      }
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

    // Every test above calls `ensureDir` first, which is why none of them
    // caught issue #48: they satisfy the precondition that production does not.
    // `init` writes this file into a directory it never creates, so a project
    // whose target directory does not exist yet crashes with ENOENT.
    it('creates the target directory when it does not exist', async () => {
      // No ensureDir: this is the state a real project is in.
      await generateViteEnvDts(testDir, 'src');

      const content = await fs.readFile(
        path.join(testDir, 'src', 'vite-env.d.ts'),
        'utf-8'
      );
      expect(content).toContain('declare global');
    });

    it('writes to the project root when the layout has no src directory', async () => {
      // A root-layout project (App.tsx beside package.json). `srcDir` is '',
      // so the file belongs next to package.json, not under src/.
      await generateViteEnvDts(testDir, '');

      const content = await fs.readFile(
        path.join(testDir, 'vite-env.d.ts'),
        'utf-8'
      );
      expect(content).toContain('declare global');
      expect(await fs.pathExists(path.join(testDir, 'src'))).toBe(false);
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

    // `init --token` writes the Pro token into .env. The check used to be a
    // substring test, so `.env.local` or `!.env.example` alone left .env
    // committable.
    it.each([
      ['.env.local only', 'node_modules/\n.env.local\n'],
      ['a negated example file', 'node_modules/\n!.env.example\n'],
      ['a nested path', 'config/.env\n'],
      ['a directory-only pattern', '.env/\n'],
      ['.env un-ignored again', '.env\n!.env\n'],
      ['a commented-out entry', '# .env\n'],
    ])(
      'should add .env when the .gitignore has %s',
      async (_label, existing) => {
        const gitignorePath = path.join(testDir, '.gitignore');
        await fs.writeFile(gitignorePath, existing);

        await generateGitIgnore(testDir);

        const content = await fs.readFile(gitignorePath, 'utf-8');
        expect(content.startsWith(existing)).toBe(true);
        const added = content.slice(existing.length).split('\n');
        expect(added).toContain('.env');
        // The companion entries the file already has are not added twice.
        for (const entry of ['.env.local', '.env.*.local']) {
          if (existing.split('\n').includes(entry)) {
            expect(added).not.toContain(entry);
          }
        }
      }
    );

    it.each([
      ['.env', '.env\n'],
      ['/.env', '/.env\n'],
      ['.env*', '.env*\n'],
      ['*.env', '*.env\n'],
      ['**/.env', '**/.env\n'],
      ['.env with a later unrelated negation', '.env\n!.env.example\n'],
    ])(
      'should not add .env when %s already ignores it',
      async (_label, existing) => {
        const gitignorePath = path.join(testDir, '.gitignore');
        await fs.writeFile(gitignorePath, existing);

        await generateGitIgnore(testDir);

        const content = await fs.readFile(gitignorePath, 'utf-8');
        expect(content.slice(existing.length)).not.toMatch(/^\.env$/m);
      }
    );

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
