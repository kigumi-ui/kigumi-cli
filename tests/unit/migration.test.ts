/**
 * Migration Integration Tests
 *
 * Tests for src/commands/init/migration.ts:
 * - migratePackageReferences() - Free -> Pro migration
 * - reverseMigratePackageReferences() - Pro -> Free migration
 *
 * These tests use real file operations in temp directories.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  migratePackageReferences,
  reverseMigratePackageReferences,
} from '../../src/commands/init/migration.js';
import type { OutputInterface } from '../../src/output/types.js';
import type { KigumiConfig } from '../../src/schemas/config.js';
import { DEFAULT_CONFIG } from '../../src/schemas/config.js';

// Mock output interface
function createMockOutput(): OutputInterface {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    note: vi.fn(),
    log: vi.fn(),
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      error: vi.fn(),
      message: vi.fn(),
    })),
    warn: vi.fn(),
  };
}

function createTestConfig(overrides: Partial<KigumiConfig> = {}): KigumiConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...(overrides.theme ?? {}),
    },
  };
}

describe('migration integration', () => {
  let testDir: string;
  let mockOutput: OutputInterface;
  let config: KigumiConfig;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-migration-test-')
    );
    mockOutput = createMockOutput();
    config = createTestConfig();

    // Create standard project structure
    await fs.ensureDir(path.join(testDir, 'src/lib'));
    await fs.ensureDir(path.join(testDir, 'src/styles'));
    await fs.ensureDir(path.join(testDir, 'src/components/ui/Button'));
    await fs.ensureDir(path.join(testDir, 'src/components/ui/Card'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('migratePackageReferences (Free -> Pro)', () => {
    it('should migrate kigumi.ts imports', async () => {
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(
        webawesomePath,
        `import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
`
      );

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(webawesomePath, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome-pro/dist/components/button/button.js'
      );
      expect(content).toContain(
        '@awesome.me/webawesome-pro/dist/components/card/card.js'
      );
      expect(content).not.toContain("'@awesome.me/webawesome/");
    });

    it('should migrate theme.css imports', async () => {
      const themePath = path.join(testDir, 'src/styles/theme.css');
      await fs.writeFile(
        themePath,
        `@import '@awesome.me/webawesome/dist/styles/themes/default.css';
@import '@awesome.me/webawesome/dist/styles/palettes/default.css';
`
      );

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(themePath, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome-pro/dist/styles/themes/default.css'
      );
      expect(content).toContain(
        '@awesome.me/webawesome-pro/dist/styles/palettes/default.css'
      );
    });

    it('should migrate component files', async () => {
      const buttonPath = path.join(
        testDir,
        'src/components/ui/Button/Button.tsx'
      );
      await fs.writeFile(
        buttonPath,
        `import '@awesome.me/webawesome/dist/components/button/button.js';

export const Button = () => <wa-button />;
`
      );

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(buttonPath, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome-pro/dist/components/button/button.js'
      );
    });

    it('should NOT migrate webawesome-pro references (already pro)', async () => {
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(
        webawesomePath,
        `import '@awesome.me/webawesome-pro/dist/components/button/button.js';
`
      );

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(webawesomePath, 'utf-8');
      // Should remain unchanged (only one -pro suffix)
      expect(content)
        .toBe(`import '@awesome.me/webawesome-pro/dist/components/button/button.js';
`);
    });

    it('should skip files that do not exist', async () => {
      // Don't create any files - should not throw
      await expect(
        migratePackageReferences(testDir, config, mockOutput)
      ).resolves.not.toThrow();
    });

    it('should report correct migration count', async () => {
      await fs.writeFile(
        path.join(testDir, 'src/lib/kigumi.ts'),
        `import '@awesome.me/webawesome/dist/components/button/button.js';`
      );
      await fs.writeFile(
        path.join(testDir, 'src/styles/theme.css'),
        `@import '@awesome.me/webawesome/dist/styles/themes/default.css';`
      );

      await migratePackageReferences(testDir, config, mockOutput);

      // Check that spinner.stop was called with migration count
      const spinnerMock = mockOutput.spinner as ReturnType<typeof vi.fn>;
      const spinnerInstance = spinnerMock.mock.results[0]?.value;
      expect(spinnerInstance.stop).toHaveBeenCalledWith(
        expect.stringContaining('2')
      );
    });
  });

  describe('reverseMigratePackageReferences (Pro -> Free)', () => {
    it('should reverse migrate kigumi.ts imports', async () => {
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(
        webawesomePath,
        `import '@awesome.me/webawesome-pro/dist/components/button/button.js';
import '@awesome.me/webawesome-pro/dist/components/card/card.js';
`
      );

      await reverseMigratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(webawesomePath, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome/dist/components/button/button.js'
      );
      expect(content).toContain(
        '@awesome.me/webawesome/dist/components/card/card.js'
      );
      expect(content).not.toContain('webawesome-pro');
    });

    it('should reverse migrate theme.css imports', async () => {
      const themePath = path.join(testDir, 'src/styles/theme.css');
      await fs.writeFile(
        themePath,
        `@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css';
@import '@awesome.me/webawesome-pro/dist/styles/palettes/bright.css';
`
      );

      await reverseMigratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(themePath, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome/dist/styles/themes/default.css'
      );
      expect(content).toContain(
        '@awesome.me/webawesome/dist/styles/palettes/bright.css'
      );
    });

    it('should reverse migrate component files', async () => {
      const buttonPath = path.join(
        testDir,
        'src/components/ui/Button/Button.tsx'
      );
      await fs.writeFile(
        buttonPath,
        `import '@awesome.me/webawesome-pro/dist/components/button/button.js';

export const Button = () => <wa-button />;
`
      );

      await reverseMigratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(buttonPath, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome/dist/components/button/button.js'
      );
      expect(content).not.toContain('webawesome-pro');
    });

    it('should NOT migrate free references (already free)', async () => {
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(
        webawesomePath,
        `import '@awesome.me/webawesome/dist/components/button/button.js';
`
      );

      await reverseMigratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(webawesomePath, 'utf-8');
      // Should remain unchanged
      expect(content)
        .toBe(`import '@awesome.me/webawesome/dist/components/button/button.js';
`);
    });
  });

  describe('round-trip migration', () => {
    it('should be reversible: Free -> Pro -> Free', async () => {
      const originalContent = `import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
`;
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(webawesomePath, originalContent);

      // Free -> Pro
      await migratePackageReferences(testDir, config, mockOutput);
      const proContent = await fs.readFile(webawesomePath, 'utf-8');
      expect(proContent).toContain('webawesome-pro');

      // Pro -> Free
      await reverseMigratePackageReferences(testDir, config, mockOutput);
      const freeContent = await fs.readFile(webawesomePath, 'utf-8');
      expect(freeContent).toBe(originalContent);
    });

    it('should be reversible: Pro -> Free -> Pro', async () => {
      const originalContent = `import '@awesome.me/webawesome-pro/dist/components/button/button.js';
`;
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(webawesomePath, originalContent);

      // Pro -> Free
      await reverseMigratePackageReferences(testDir, config, mockOutput);
      const freeContent = await fs.readFile(webawesomePath, 'utf-8');
      expect(freeContent).not.toContain('webawesome-pro');

      // Free -> Pro
      await migratePackageReferences(testDir, config, mockOutput);
      const proContent = await fs.readFile(webawesomePath, 'utf-8');
      expect(proContent).toBe(originalContent);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple occurrences on same line', async () => {
      const content = `// @awesome.me/webawesome and @awesome.me/webawesome again
import '@awesome.me/webawesome/dist/components/button/button.js';
`;
      await fs.writeFile(path.join(testDir, 'src/lib/kigumi.ts'), content);

      await migratePackageReferences(testDir, config, mockOutput);

      const result = await fs.readFile(
        path.join(testDir, 'src/lib/kigumi.ts'),
        'utf-8'
      );
      // All occurrences should be migrated
      expect(result).not.toContain("'@awesome.me/webawesome/");
      expect(result).toContain('@awesome.me/webawesome-pro');
    });

    it('should handle .jsx files', async () => {
      const buttonPath = path.join(
        testDir,
        'src/components/ui/Button/Button.jsx'
      );
      await fs.writeFile(
        buttonPath,
        `import '@awesome.me/webawesome/dist/components/button/button.js';
export const Button = () => <wa-button />;
`
      );

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(buttonPath, 'utf-8');
      expect(content).toContain('@awesome.me/webawesome-pro');
    });

    it('should handle vite-env.d.ts', async () => {
      const dtsPath = path.join(testDir, 'src/vite-env.d.ts');
      await fs.writeFile(
        dtsPath,
        `/// <reference types="@awesome.me/webawesome/dist/types" />
`
      );

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(dtsPath, 'utf-8');
      expect(content).toContain('@awesome.me/webawesome-pro/dist/types');
    });

    it('should migrate .vue files from free to pro', async () => {
      // Create components directory
      const componentsDir = path.join(testDir, 'src/components/ui/Test');
      await fs.ensureDir(componentsDir);

      // Create a .vue file with free import
      const vueFile = path.join(componentsDir, 'Test.vue');
      await fs.writeFile(
        vueFile,
        `<script setup lang="ts">
import '@awesome.me/webawesome/dist/components/test/test.js';
import './Test.css';
</script>

<template>
  <wa-test />
</template>`
      );

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(vueFile, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome-pro/dist/components/test/test.js'
      );
      expect(content).not.toContain('@awesome.me/webawesome/dist');
    });

    it('should migrate multiple .vue files', async () => {
      // Create multiple Vue components
      const components = ['Button', 'Input', 'Dialog'];

      for (const comp of components) {
        const compDir = path.join(testDir, 'src/components/ui', comp);
        await fs.ensureDir(compDir);

        const vueFile = path.join(compDir, `${comp}.vue`);
        await fs.writeFile(
          vueFile,
          `import '@awesome.me/webawesome/dist/components/${comp.toLowerCase()}/${comp.toLowerCase()}.js';`
        );
      }

      await migratePackageReferences(testDir, config, mockOutput);

      // Verify all were migrated
      for (const comp of components) {
        const vueFile = path.join(
          testDir,
          'src/components/ui',
          comp,
          `${comp}.vue`
        );
        const content = await fs.readFile(vueFile, 'utf-8');
        expect(content).toContain('@awesome.me/webawesome-pro/dist');
      }
    });
  });

  describe('reverseMigratePackageReferences - Vue support', () => {
    it('should reverse migrate .vue files from pro to free', async () => {
      // Create components directory
      const componentsDir = path.join(testDir, 'src/components/ui/Test');
      await fs.ensureDir(componentsDir);

      // Create a .vue file with pro import
      const vueFile = path.join(componentsDir, 'Test.vue');
      await fs.writeFile(
        vueFile,
        `<script setup lang="ts">
import '@awesome.me/webawesome-pro/dist/components/test/test.js';
import './Test.css';
</script>

<template>
  <wa-test />
</template>`
      );

      await reverseMigratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(vueFile, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome/dist/components/test/test.js'
      );
      expect(content).not.toContain('@awesome.me/webawesome-pro');
    });
  });

  describe('layers.css surgical rewrite', () => {
    const DEFAULT_LAYERS_FREE = `/**
 * Web Awesome CSS Cascade Layers
 */

@layer base, theme;

@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);
@import '@/styles/theme.css' layer(theme);
`;

    const DEFAULT_LAYERS_PRO = `/**
 * Web Awesome CSS Cascade Layers
 */

@layer base, theme;

@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base);
@import '@/styles/theme.css' layer(theme);
`;

    it('migrates layers.css from Free to Pro surgically', async () => {
      const layersPath = path.join(testDir, 'src/styles/layers.css');
      await fs.writeFile(layersPath, DEFAULT_LAYERS_FREE);

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(layersPath, 'utf-8');
      expect(content).toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base)"
      );
      expect(content).toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base)"
      );
      expect(content).toContain("@import '@/styles/theme.css' layer(theme);");
      expect(content).not.toContain(
        "@import '@awesome.me/webawesome/dist/styles/"
      );
    });

    it('migrates layers.css from Pro to Free surgically', async () => {
      const layersPath = path.join(testDir, 'src/styles/layers.css');
      await fs.writeFile(layersPath, DEFAULT_LAYERS_PRO);

      await reverseMigratePackageReferences(testDir, config, mockOutput);

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

    it('respects custom stylesDir when migrating layers.css', async () => {
      // Create a custom styles directory layout
      const customConfig = createTestConfig({ stylesDir: 'src/foundation' });
      await fs.ensureDir(path.join(testDir, 'src/foundation'));
      const layersPath = path.join(testDir, 'src/foundation/layers.css');
      await fs.writeFile(layersPath, DEFAULT_LAYERS_FREE);

      await migratePackageReferences(testDir, customConfig, mockOutput);

      const content = await fs.readFile(layersPath, 'utf-8');
      expect(content).toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base)"
      );
      expect(content).not.toContain(
        "@import '@awesome.me/webawesome/dist/styles/"
      );
    });

    it('preserves custom @layer declarations in layers.css during migration', async () => {
      const customLayers = `@layer reset, custom, base, theme;

@import '@/styles/reset.css' layer(reset);
@import '@/styles/custom-tokens.css' layer(custom);

@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);

@import '@/styles/theme.css' layer(theme);
`;
      const layersPath = path.join(testDir, 'src/styles/layers.css');
      await fs.writeFile(layersPath, customLayers);

      await migratePackageReferences(testDir, config, mockOutput);

      const content = await fs.readFile(layersPath, 'utf-8');
      expect(content).toContain('@layer reset, custom, base, theme;');
      expect(content).toContain("@import '@/styles/reset.css' layer(reset);");
      expect(content).toContain(
        "@import '@/styles/custom-tokens.css' layer(custom);"
      );
      expect(content).toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base)"
      );
    });

    it('continues migrating other files when layers.css cannot be rewritten', async () => {
      // Restructured layers.css (missing the WA @import lines)
      const brokenLayers = `@layer base, theme;

/* User removed the WA imports and loads them via JS */

@import '@/styles/theme.css' layer(theme);
`;
      await fs.writeFile(
        path.join(testDir, 'src/styles/layers.css'),
        brokenLayers
      );
      // A normal file that should still migrate
      await fs.writeFile(
        path.join(testDir, 'src/lib/kigumi.ts'),
        `import '@awesome.me/webawesome/dist/components/button/button.js';
`
      );

      // Should NOT throw — the layers.css error is caught and reported
      await expect(
        migratePackageReferences(testDir, config, mockOutput)
      ).resolves.not.toThrow();

      // kigumi.ts was still migrated
      const kigumiContent = await fs.readFile(
        path.join(testDir, 'src/lib/kigumi.ts'),
        'utf-8'
      );
      expect(kigumiContent).toContain('@awesome.me/webawesome-pro');

      // layers.css was left alone (no panic-rewrite)
      const layersContent = await fs.readFile(
        path.join(testDir, 'src/styles/layers.css'),
        'utf-8'
      );
      expect(layersContent).toBe(brokenLayers);

      // The actionable error was surfaced
      expect(mockOutput.error).toHaveBeenCalled();
    });
  });
});
