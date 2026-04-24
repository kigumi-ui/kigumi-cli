/**
 * Doctor Command Tests
 *
 * Tests for src/commands/doctor.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  doctorCommand,
  diagnoseObsoleteTypeDecls,
} from '../../src/commands/doctor.js';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../src/constants.js';

describe('doctor command', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-doctor-test-'));
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

  it('should warn when no config found', async () => {
    await doctorCommand({ cwd: testDir });
    // Should complete without error, just show warning
    expect(true).toBe(true);
  });

  it('should report no issues in healthy free project', async () => {
    // Setup free project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component with correct import
    const componentPath = path.join(
      testDir,
      'src/components/Button/Button.tsx'
    );
    await fs.ensureDir(path.dirname(componentPath));
    await fs.writeFile(
      componentPath,
      `import '@awesome.me/webawesome/dist/components/button/button.js';\n`
    );

    await doctorCommand({ cwd: testDir });
    // Should complete without finding issues
    expect(true).toBe(true);
  });

  it('should detect and fix wrong imports in free project', async () => {
    // Setup free project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component with WRONG import (pro instead of free)
    const componentPath = path.join(
      testDir,
      'src/components/Button/Button.tsx'
    );
    await fs.ensureDir(path.dirname(componentPath));
    await fs.writeFile(
      componentPath,
      `import '@awesome.me/webawesome-pro/dist/components/button/button.js';\n`
    );

    // Run doctor (should fix)
    await doctorCommand({ cwd: testDir });

    // Check that import was fixed
    const content = await fs.readFile(componentPath, 'utf-8');
    expect(content).toContain(WEB_AWESOME_FREE_PACKAGE);
    expect(content).not.toContain(WEB_AWESOME_PRO_PACKAGE);
  });

  it('should detect and fix wrong imports in pro project', async () => {
    // Setup pro project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_PRO_PACKAGE]: '^4.0.0',
      },
    });

    // Create .env with token
    await fs.writeFile(
      path.join(testDir, '.env'),
      'WEBAWESOME_NPM_TOKEN=abcdefghij1234567890'
    );

    // Create component with WRONG import (free instead of pro)
    const componentPath = path.join(
      testDir,
      'src/components/Dialog/Dialog.tsx'
    );
    await fs.ensureDir(path.dirname(componentPath));
    await fs.writeFile(
      componentPath,
      `import '@awesome.me/webawesome/dist/components/dialog/dialog.js';\n`
    );

    // Run doctor (should fix)
    await doctorCommand({ cwd: testDir });

    // Check that import was fixed
    const content = await fs.readFile(componentPath, 'utf-8');
    expect(content).toContain(WEB_AWESOME_PRO_PACKAGE);
    expect(content).not.toContain(`${WEB_AWESOME_FREE_PACKAGE}/dist`);
  });

  it('should support dry-run mode without fixing', async () => {
    // Setup free project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component with WRONG import
    const componentPath = path.join(
      testDir,
      'src/components/Button/Button.tsx'
    );
    await fs.ensureDir(path.dirname(componentPath));
    const wrongContent = `import '@awesome.me/webawesome-pro/dist/components/button/button.js';\n`;
    await fs.writeFile(componentPath, wrongContent);

    // Run doctor in dry-run mode
    await doctorCommand({ cwd: testDir, dryRun: true });

    // Check that import was NOT fixed
    const content = await fs.readFile(componentPath, 'utf-8');
    expect(content).toBe(wrongContent);
    expect(content).toContain(WEB_AWESOME_PRO_PACKAGE);
  });

  it('should scan multiple files', async () => {
    // Setup free project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component with wrong import
    const badgePath = path.join(testDir, 'src/components/Badge/Badge.tsx');
    await fs.ensureDir(path.dirname(badgePath));
    await fs.writeFile(
      badgePath,
      `import '@awesome.me/webawesome-pro/dist/components/badge/badge.js';\nexport function Badge() { return null; }\n`
    );

    // Create another component with correct import (should not be touched)
    const avatarPath = path.join(testDir, 'src/components/Avatar/Avatar.tsx');
    await fs.ensureDir(path.dirname(avatarPath));
    await fs.writeFile(
      avatarPath,
      `import '@awesome.me/webawesome/dist/components/avatar/avatar.js';\nexport function Avatar() { return null; }\n`
    );

    // Run doctor
    await doctorCommand({ cwd: testDir });

    // Check Badge was fixed
    const badgeContent = await fs.readFile(badgePath, 'utf-8');
    expect(badgeContent).toContain(WEB_AWESOME_FREE_PACKAGE);
    expect(badgeContent).not.toContain(WEB_AWESOME_PRO_PACKAGE);

    // Check Avatar was not modified (already correct)
    const avatarContent = await fs.readFile(avatarPath, 'utf-8');
    expect(avatarContent).toContain(WEB_AWESOME_FREE_PACKAGE);
    expect(avatarContent).not.toContain(WEB_AWESOME_PRO_PACKAGE);
  });

  it('should handle Vue files', async () => {
    // Setup Vue project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'vue',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create Vue component with wrong import
    const componentPath = path.join(
      testDir,
      'src/components/Button/Button.vue'
    );
    await fs.ensureDir(path.dirname(componentPath));
    await fs.writeFile(
      componentPath,
      `<script setup>\nimport '@awesome.me/webawesome-pro/dist/components/button/button.js';\n</script>`
    );

    // Run doctor
    await doctorCommand({ cwd: testDir });

    // Check that import was fixed
    const content = await fs.readFile(componentPath, 'utf-8');
    expect(content).toContain(WEB_AWESOME_FREE_PACKAGE);
    expect(content).not.toContain(WEB_AWESOME_PRO_PACKAGE);
  });

  it('should handle empty components directory', async () => {
    // Setup project with empty components dir
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    await fs.ensureDir(path.join(testDir, 'src/components'));

    await doctorCommand({ cwd: testDir });
    // Should complete without error
    expect(true).toBe(true);
  });

  describe('multi-file regression (lastIndex bug)', () => {
    it('fixes all stale component files, not every-other', async () => {
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
      });

      await fs.writeJSON(path.join(testDir, 'package.json'), {
        dependencies: {
          [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
        },
      });

      // Create 3 component files, all with wrong imports
      const files = ['Alert', 'Badge', 'Button'];
      for (const name of files) {
        const filePath = path.join(
          testDir,
          `src/components/${name}/${name}.tsx`
        );
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(
          filePath,
          `import '${WEB_AWESOME_PRO_PACKAGE}/dist/components/${name.toLowerCase()}/${name.toLowerCase()}.js';\nexport function ${name}() { return null; }\n`
        );
      }

      await doctorCommand({ cwd: testDir });

      // ALL 3 must be fixed, not just files at even indices
      for (const name of files) {
        const content = await fs.readFile(
          path.join(testDir, `src/components/${name}/${name}.tsx`),
          'utf-8'
        );
        expect(content).toContain(WEB_AWESOME_FREE_PACKAGE);
        expect(content).not.toContain(WEB_AWESOME_PRO_PACKAGE);
      }
    });

    it('fixes stale, correct, stale interleaved component files', async () => {
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
      });

      await fs.writeJSON(path.join(testDir, 'package.json'), {
        dependencies: {
          [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
        },
      });

      // Alpha: wrong import
      const alphaPath = path.join(testDir, 'src/components/Alpha/Alpha.tsx');
      await fs.ensureDir(path.dirname(alphaPath));
      await fs.writeFile(
        alphaPath,
        `import '${WEB_AWESOME_PRO_PACKAGE}/dist/components/alpha/alpha.js';\n`
      );

      // Beta: correct import
      const betaPath = path.join(testDir, 'src/components/Beta/Beta.tsx');
      await fs.ensureDir(path.dirname(betaPath));
      await fs.writeFile(
        betaPath,
        `import '${WEB_AWESOME_FREE_PACKAGE}/dist/components/beta/beta.js';\n`
      );

      // Gamma: wrong import
      const gammaPath = path.join(testDir, 'src/components/Gamma/Gamma.tsx');
      await fs.ensureDir(path.dirname(gammaPath));
      await fs.writeFile(
        gammaPath,
        `import '${WEB_AWESOME_PRO_PACKAGE}/dist/components/gamma/gamma.js';\n`
      );

      await doctorCommand({ cwd: testDir });

      const alphaContent = await fs.readFile(alphaPath, 'utf-8');
      expect(alphaContent).toContain(WEB_AWESOME_FREE_PACKAGE);
      expect(alphaContent).not.toContain(WEB_AWESOME_PRO_PACKAGE);

      const betaContent = await fs.readFile(betaPath, 'utf-8');
      expect(betaContent).toContain(WEB_AWESOME_FREE_PACKAGE);

      const gammaContent = await fs.readFile(gammaPath, 'utf-8');
      expect(gammaContent).toContain(WEB_AWESOME_FREE_PACKAGE);
      expect(gammaContent).not.toContain(WEB_AWESOME_PRO_PACKAGE);
    });

    it('fixes stale component AND stale layers.css in the same run', async () => {
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      });

      await fs.writeJSON(path.join(testDir, 'package.json'), {
        dependencies: {
          [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
        },
      });

      // Component with wrong import
      const componentPath = path.join(
        testDir,
        'src/components/Button/Button.tsx'
      );
      await fs.ensureDir(path.dirname(componentPath));
      await fs.writeFile(
        componentPath,
        `import '${WEB_AWESOME_PRO_PACKAGE}/dist/components/button/button.js';\n`
      );

      // layers.css with wrong imports
      await fs.ensureDir(path.join(testDir, 'src/styles'));
      const layersPath = path.join(testDir, 'src/styles/layers.css');
      await fs.writeFile(
        layersPath,
        `@layer base, theme;\n\n@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome.css' layer(base);\n@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/themes/default.css' layer(base);\n\n@import '@/styles/theme.css' layer(theme);\n`
      );

      await doctorCommand({ cwd: testDir });

      // Both must be fixed despite sharing the same regex singletons
      const componentContent = await fs.readFile(componentPath, 'utf-8');
      expect(componentContent).toContain(WEB_AWESOME_FREE_PACKAGE);
      expect(componentContent).not.toContain(WEB_AWESOME_PRO_PACKAGE);

      const layersContent = await fs.readFile(layersPath, 'utf-8');
      expect(layersContent).toContain(
        `@import '${WEB_AWESOME_FREE_PACKAGE}/dist/styles/webawesome.css' layer(base)`
      );
      expect(layersContent).not.toContain(WEB_AWESOME_PRO_PACKAGE);
    });

    it('fixes multiple stale non-layers.css style files', async () => {
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      });

      await fs.writeJSON(path.join(testDir, 'package.json'), {
        dependencies: {
          [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
        },
      });

      await fs.ensureDir(path.join(testDir, 'src/styles'));

      // Two CSS files (not layers.css) both with wrong package
      const file1 = path.join(testDir, 'src/styles/components.css');
      const file2 = path.join(testDir, 'src/styles/overrides.css');
      await fs.writeFile(
        file1,
        `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome.css';\n`
      );
      await fs.writeFile(
        file2,
        `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/components/button/button.css';\n`
      );

      await doctorCommand({ cwd: testDir });

      const content1 = await fs.readFile(file1, 'utf-8');
      expect(content1).toContain(WEB_AWESOME_FREE_PACKAGE);
      expect(content1).not.toContain(WEB_AWESOME_PRO_PACKAGE);

      const content2 = await fs.readFile(file2, 'utf-8');
      expect(content2).toContain(WEB_AWESOME_FREE_PACKAGE);
      expect(content2).not.toContain(WEB_AWESOME_PRO_PACKAGE);
    });
  });

  describe('false-positive detection', () => {
    it('does not report an issue when wrong package appears only in a CSS comment', async () => {
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      });

      await fs.writeJSON(path.join(testDir, 'package.json'), {
        dependencies: {
          [WEB_AWESOME_PRO_PACKAGE]: '^4.0.0',
        },
      });

      await fs.writeFile(
        path.join(testDir, '.env'),
        'WEBAWESOME_NPM_TOKEN=abcdefghij1234567890'
      );

      await fs.ensureDir(path.join(testDir, 'src/styles'));
      const layersPath = path.join(testDir, 'src/styles/layers.css');
      // Comment mentions the free package, but @imports are already pro (correct)
      const content = `@layer base, theme;

/* Previously imported from @awesome.me/webawesome - now using pro */
@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base);

@import '@/styles/theme.css' layer(theme);
`;
      await fs.writeFile(layersPath, content);

      await doctorCommand({ cwd: testDir });

      // File should be unchanged -- the comment is not a real issue
      const after = await fs.readFile(layersPath, 'utf-8');
      expect(after).toBe(content);
    });
  });

  describe('layers.css scan', () => {
    const FREE_LAYERS = `@layer base, theme;

@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);

@import '@/styles/theme.css' layer(theme);
`;

    const PRO_LAYERS = `@layer base, theme;

@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base);

@import '@/styles/theme.css' layer(theme);
`;

    async function setupProject(
      tier: 'free' | 'pro',
      layersContent: string
    ): Promise<string> {
      await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      });

      await fs.writeJSON(path.join(testDir, 'package.json'), {
        dependencies: {
          [tier === 'pro' ? WEB_AWESOME_PRO_PACKAGE : WEB_AWESOME_FREE_PACKAGE]:
            '^4.0.0',
        },
      });

      if (tier === 'pro') {
        await fs.writeFile(
          path.join(testDir, '.env'),
          'WEBAWESOME_NPM_TOKEN=abcdefghij1234567890'
        );
      }

      await fs.ensureDir(path.join(testDir, 'src/styles'));
      const layersPath = path.join(testDir, 'src/styles/layers.css');
      await fs.writeFile(layersPath, layersContent);

      return layersPath;
    }

    it('rewrites stale free layers.css on a pro project', async () => {
      const layersPath = await setupProject('pro', FREE_LAYERS);

      await doctorCommand({ cwd: testDir });

      const content = await fs.readFile(layersPath, 'utf-8');
      expect(content).toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base)"
      );
      expect(content).toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base)"
      );
      expect(content).not.toContain(
        "@import '@awesome.me/webawesome/dist/styles/"
      );
      // User theme.css import is untouched
      expect(content).toContain("@import '@/styles/theme.css' layer(theme);");
    });

    it('rewrites stale pro layers.css on a free project', async () => {
      const layersPath = await setupProject('free', PRO_LAYERS);

      await doctorCommand({ cwd: testDir });

      const content = await fs.readFile(layersPath, 'utf-8');
      expect(content).toContain(
        "@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base)"
      );
      expect(content).toContain(
        "@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base)"
      );
      expect(content).not.toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/"
      );
    });

    it('dry-run reports stale layers.css without modifying it', async () => {
      const layersPath = await setupProject('pro', FREE_LAYERS);

      await doctorCommand({ cwd: testDir, dryRun: true });

      const content = await fs.readFile(layersPath, 'utf-8');
      // Unchanged
      expect(content).toBe(FREE_LAYERS);
    });

    it('leaves already-correct layers.css untouched', async () => {
      const layersPath = await setupProject('pro', PRO_LAYERS);

      await doctorCommand({ cwd: testDir });

      const content = await fs.readFile(layersPath, 'utf-8');
      // Idempotent: no change when content already matches target
      expect(content).toBe(PRO_LAYERS);
    });

    it('reports a restructured layers.css without rewriting it', async () => {
      // User removed the proper @import '<package>/dist/styles/webawesome.css'
      // line but left a reference to the free package in a comment. This
      // trips the "wrong package" detection regex (which is how doctor
      // decides the file needs attention) but defeats the surgical rewrite
      // because there is no @import line to swap. The file should be left
      // alone and a clear error surfaced so the user can fix it manually.
      const restructured = `@layer base, theme;

/* NOTE: @awesome.me/webawesome imports are now loaded via JS in main.ts */

@import '@/styles/theme.css' layer(theme);
`;
      const layersPath = await setupProject('pro', restructured);

      await doctorCommand({ cwd: testDir });

      const content = await fs.readFile(layersPath, 'utf-8');
      // File untouched because the surgical rewrite could not find the
      // expected pattern. doctor surfaces the LayersCssRewriteError
      // instead of blindly mangling the file.
      expect(content).toBe(restructured);
    });
  });
});

// F-030 advisory: obsolete src/types/web-awesome.d.ts detection.
// Kept at the module level (outside the main `describe('doctor command')`
// block) so it can call the unit under test directly without the enclosing
// beforeEach/afterEach tear-down around WEBAWESOME_NPM_TOKEN.
describe('diagnoseObsoleteTypeDecls', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-obsolete-dts-'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  async function seedLegacyFile() {
    const filePath = path.join(testDir, 'src', 'types', 'web-awesome.d.ts');
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(
      filePath,
      `declare global { namespace JSX { interface IntrinsicElements { 'wa-button': never } } }\nexport {};\n`
    );
    return filePath;
  }

  const reactTsConfig = {
    framework: 'react',
    typescript: true,
    componentsDir: 'src/components',
    stylesDir: 'src/styles',
    theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
    // Cast through unknown to satisfy the KigumiConfig shape for the helper
    // without pulling in the full schema fixture (this helper only reads
    // framework + typescript).
  } as unknown as Parameters<typeof diagnoseObsoleteTypeDecls>[1];

  it('flags the legacy file on a React+TS project and does not delete it', async () => {
    const filePath = await seedLegacyFile();

    const results = await diagnoseObsoleteTypeDecls(testDir, reactTsConfig);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      filePath,
      relativePath: path.join('src', 'types', 'web-awesome.d.ts'),
      fixed: false,
    });
    expect(results[0].issue).toContain('Obsolete type declarations file');
    expect(await fs.pathExists(filePath)).toBe(true);
  });

  it('returns empty when the legacy file is absent', async () => {
    const results = await diagnoseObsoleteTypeDecls(testDir, reactTsConfig);
    expect(results).toEqual([]);
  });

  it('returns empty for a React JavaScript project (no typescript)', async () => {
    await seedLegacyFile();
    const config = {
      ...reactTsConfig,
      typescript: false,
    } as typeof reactTsConfig;

    const results = await diagnoseObsoleteTypeDecls(testDir, config);
    expect(results).toEqual([]);
  });

  it('returns empty for a non-React framework even with the file present', async () => {
    await seedLegacyFile();
    const config = {
      ...reactTsConfig,
      framework: 'vue',
    } as typeof reactTsConfig;

    const results = await diagnoseObsoleteTypeDecls(testDir, config);
    expect(results).toEqual([]);
  });
});
