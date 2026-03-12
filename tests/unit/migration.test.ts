/**
 * Migration Integration Tests
 *
 * Tests for src/commands/init/migration.ts:
 * - migratePackageReferences() - Free → Pro migration
 * - reverseMigratePackageReferences() - Pro → Free migration
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
    })),
    warn: vi.fn(),
  };
}

describe('migration integration', () => {
  let testDir: string;
  let mockOutput: OutputInterface;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-migration-test-')
    );
    mockOutput = createMockOutput();

    // Create standard project structure
    await fs.ensureDir(path.join(testDir, 'src/lib'));
    await fs.ensureDir(path.join(testDir, 'src/styles'));
    await fs.ensureDir(path.join(testDir, 'src/components/ui/Button'));
    await fs.ensureDir(path.join(testDir, 'src/components/ui/Card'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('migratePackageReferences (Free → Pro)', () => {
    it('should migrate kigumi.ts imports', async () => {
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(
        webawesomePath,
        `import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
`
      );

      await migratePackageReferences(testDir, mockOutput);

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

      await migratePackageReferences(testDir, mockOutput);

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

      await migratePackageReferences(testDir, mockOutput);

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

      await migratePackageReferences(testDir, mockOutput);

      const content = await fs.readFile(webawesomePath, 'utf-8');
      // Should remain unchanged (only one -pro suffix)
      expect(content)
        .toBe(`import '@awesome.me/webawesome-pro/dist/components/button/button.js';
`);
    });

    it('should skip files that do not exist', async () => {
      // Don't create any files - should not throw
      await expect(
        migratePackageReferences(testDir, mockOutput)
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

      await migratePackageReferences(testDir, mockOutput);

      // Check that spinner.stop was called with migration count
      const spinnerMock = mockOutput.spinner as ReturnType<typeof vi.fn>;
      const spinnerInstance = spinnerMock.mock.results[0]?.value;
      expect(spinnerInstance.stop).toHaveBeenCalledWith(
        expect.stringContaining('2')
      );
    });
  });

  describe('reverseMigratePackageReferences (Pro → Free)', () => {
    it('should reverse migrate kigumi.ts imports', async () => {
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(
        webawesomePath,
        `import '@awesome.me/webawesome-pro/dist/components/button/button.js';
import '@awesome.me/webawesome-pro/dist/components/card/card.js';
`
      );

      await reverseMigratePackageReferences(testDir, mockOutput);

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

      await reverseMigratePackageReferences(testDir, mockOutput);

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

      await reverseMigratePackageReferences(testDir, mockOutput);

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

      await reverseMigratePackageReferences(testDir, mockOutput);

      const content = await fs.readFile(webawesomePath, 'utf-8');
      // Should remain unchanged
      expect(content)
        .toBe(`import '@awesome.me/webawesome/dist/components/button/button.js';
`);
    });
  });

  describe('round-trip migration', () => {
    it('should be reversible: Free → Pro → Free', async () => {
      const originalContent = `import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
`;
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(webawesomePath, originalContent);

      // Free → Pro
      await migratePackageReferences(testDir, mockOutput);
      const proContent = await fs.readFile(webawesomePath, 'utf-8');
      expect(proContent).toContain('webawesome-pro');

      // Pro → Free
      await reverseMigratePackageReferences(testDir, mockOutput);
      const freeContent = await fs.readFile(webawesomePath, 'utf-8');
      expect(freeContent).toBe(originalContent);
    });

    it('should be reversible: Pro → Free → Pro', async () => {
      const originalContent = `import '@awesome.me/webawesome-pro/dist/components/button/button.js';
`;
      const webawesomePath = path.join(testDir, 'src/lib/kigumi.ts');
      await fs.writeFile(webawesomePath, originalContent);

      // Pro → Free
      await reverseMigratePackageReferences(testDir, mockOutput);
      const freeContent = await fs.readFile(webawesomePath, 'utf-8');
      expect(freeContent).not.toContain('webawesome-pro');

      // Free → Pro
      await migratePackageReferences(testDir, mockOutput);
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

      await migratePackageReferences(testDir, mockOutput);

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

      await migratePackageReferences(testDir, mockOutput);

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

      await migratePackageReferences(testDir, mockOutput);

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

      await migratePackageReferences(testDir, mockOutput);

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

      await migratePackageReferences(testDir, mockOutput);

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

      await reverseMigratePackageReferences(testDir, mockOutput);

      const content = await fs.readFile(vueFile, 'utf-8');
      expect(content).toContain(
        '@awesome.me/webawesome/dist/components/test/test.js'
      );
      expect(content).not.toContain('@awesome.me/webawesome-pro');
    });
  });
});
