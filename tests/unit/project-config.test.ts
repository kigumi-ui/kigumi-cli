/**
 * Project Configuration Tests
 *
 * Tests the configureTSConfig function to ensure it correctly
 * transforms tsconfig.app.json for React + Vite compatibility.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Import the functions under test
import {
  configureTSConfig,
  configureVitePathAliases,
  configureVueCustomElements,
  configureVueTypes,
  toKigumiAlias,
} from '../../src/utils/project-config.js';
import { createTestOutput } from './_helpers/output.js';

const mockOutput = createTestOutput();

describe('configureTSConfig', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-test-'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should add path aliases when missing', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    const result = await configureTSConfig(testDir, mockOutput);

    expect(result).toBe(true);
    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
  });

  it('does not write baseUrl, which TypeScript 7 rejects outright', async () => {
    // TS deprecated baseUrl in 6.0 (TS5101) and removed it in 7.0 (TS5102).
    // `typescript@latest` is 7.x, so writing it here made a fresh user's very
    // first `tsc` run fail on a config we generated. `paths` resolves relative
    // to the tsconfig without it.
    const tsconfig = { compilerOptions: { target: 'ES2022' } };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions).not.toHaveProperty('baseUrl');
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
  });

  it("leaves a project's own existing baseUrl alone", async () => {
    // Theirs to keep or migrate. Removing it could change how their other path
    // mappings resolve, which is not ours to decide.
    const tsconfig = {
      compilerOptions: { target: 'ES2022', baseUrl: './app' },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.baseUrl).toBe('./app');
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
  });

  // NOTE: configureTSConfig now ONLY adds path aliases.
  // It no longer modifies esModuleInterop, verbatimModuleSyntax, or types.
  // This is because Kigumi uses named React imports which work with Vite 6's defaults.
  // See AGENTS.md Rule #16 and #1 for details.

  it('should preserve existing tsconfig settings (not modify esModuleInterop)', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        esModuleInterop: false, // Explicitly set - should be preserved
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    // Should preserve user's setting, only add path aliases
    expect(updated.compilerOptions.esModuleInterop).toBe(false);
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
  });

  it('should preserve verbatimModuleSyntax when present', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        verbatimModuleSyntax: true,
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    // Now preserved - Kigumi's named imports work with this setting
    expect(updated.compilerOptions.verbatimModuleSyntax).toBe(true);
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
  });

  it('should preserve types array', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        types: ['vite/client'],
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    // Now preserved
    expect(updated.compilerOptions.types).toEqual(['vite/client']);
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
  });

  it('should preserve types array with multiple entries', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        types: ['vite/client', 'node'],
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.types).toEqual(['vite/client', 'node']);
  });

  it('should preserve existing path aliases', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        baseUrl: '.',
        paths: {
          '~/*': ['./lib/*'],
        },
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.paths).toEqual({
      '~/*': ['./lib/*'],
      '@/*': ['./src/*'],
    });
  });

  it('should not modify if @/* path already exists', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        baseUrl: '.',
        paths: { '@/*': ['./src/*'] },
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    // Verify path aliases are preserved
    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
  });

  it('should return false if tsconfig.app.json does not exist', async () => {
    const result = await configureTSConfig(testDir, mockOutput);
    expect(result).toBe(false);
  });

  it('should handle Vite 6 default tsconfig correctly', async () => {
    // This is the exact tsconfig.app.json that Vite 6 generates
    const vite6Tsconfig = {
      compilerOptions: {
        tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
        target: 'ES2022',
        useDefineForClassFields: true,
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        types: ['vite/client'],
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        moduleDetection: 'force',
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        erasableSyntaxOnly: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedSideEffectImports: true,
      },
      include: ['src'],
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), vite6Tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));

    // Should add path aliases, and no baseUrl: a real Vite 6 project on
    // typescript@latest (7.x) fails with TS5102 if we write one.
    expect(updated.compilerOptions).not.toHaveProperty('baseUrl');
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });

    // Should preserve ALL Vite 6 defaults (no longer modified)
    expect(updated.compilerOptions.verbatimModuleSyntax).toBe(true);
    expect(updated.compilerOptions.moduleResolution).toBe('bundler');
    expect(updated.compilerOptions.jsx).toBe('react-jsx');
    expect(updated.compilerOptions.strict).toBe(true);
    expect(updated.compilerOptions.erasableSyntaxOnly).toBe(true);
  });

  it('should be idempotent (running twice produces same result)', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        verbatimModuleSyntax: true,
        types: ['vite/client'],
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    // Run once
    await configureTSConfig(testDir, mockOutput);
    const firstRun = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));

    // Run again
    await configureTSConfig(testDir, mockOutput);
    const secondRun = await fs.readJSON(
      path.join(testDir, 'tsconfig.app.json')
    );

    expect(secondRun).toEqual(firstRun);
  });
});

describe('configureVitePathAliases', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-vite-test-'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should add path alias to vite.config.ts', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVitePathAliases(testDir, mockOutput);

    expect(result).toBe(true);
    const updated = await fs.readFile(
      path.join(testDir, 'vite.config.ts'),
      'utf-8'
    );
    expect(updated).toContain("import path from 'path'");
    expect(updated).toContain('resolve:');
    expect(updated).toContain("'@'");
  });

  it('should not modify if alias already exists', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVitePathAliases(testDir, mockOutput);

    expect(result).toBe(false);
  });

  it('should return false if no vite.config exists', async () => {
    const result = await configureVitePathAliases(testDir, mockOutput);
    expect(result).toBe(false);
  });

  it('should add fileURLToPath import for ESM projects', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      type: 'module',
    });
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVitePathAliases(testDir, mockOutput);

    expect(result).toBe(true);
    const updated = await fs.readFile(
      path.join(testDir, 'vite.config.ts'),
      'utf-8'
    );
    expect(updated).toContain("import { fileURLToPath } from 'url'");
    expect(updated).toContain("import path from 'path'");
    expect(updated).toContain('path.dirname(fileURLToPath(import.meta.url))');
  });

  it('should use __dirname for non-ESM projects', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVitePathAliases(testDir, mockOutput);

    expect(result).toBe(true);
    const updated = await fs.readFile(
      path.join(testDir, 'vite.config.ts'),
      'utf-8'
    );
    expect(updated).toContain('__dirname');
    expect(updated).not.toContain('fileURLToPath');
  });

  it('should add fileURLToPath when path already imported in ESM project', async () => {
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      type: 'module',
    });
    const viteConfig = `import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVitePathAliases(testDir, mockOutput);

    expect(result).toBe(true);
    const updated = await fs.readFile(
      path.join(testDir, 'vite.config.ts'),
      'utf-8'
    );
    expect(updated).toContain("import { fileURLToPath } from 'url'");
  });

  it('should return false when resolve: already exists', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    extensions: ['.ts'],
  },
  plugins: [],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVitePathAliases(testDir, mockOutput);

    expect(result).toBe(false);
  });

  it('should fall back to vite.config.js when .ts not found', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.js'), viteConfig);

    const result = await configureVitePathAliases(testDir, mockOutput);

    expect(result).toBe(true);
    const updated = await fs.readFile(
      path.join(testDir, 'vite.config.js'),
      'utf-8'
    );
    expect(updated).toContain('resolve:');
  });
});

describe('configureVueCustomElements', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-vue-custom-test-')
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should return false when no vite.config exists', async () => {
    const result = await configureVueCustomElements(testDir, mockOutput);
    expect(result).toBe(false);
  });

  it('should return false when isCustomElement already configured', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('wa-'),
      },
    },
  })],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVueCustomElements(testDir, mockOutput);
    expect(result).toBe(false);
  });

  it('should inject isCustomElement into bare vue()', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVueCustomElements(testDir, mockOutput);

    expect(result).toBe(true);
    const updated = await fs.readFile(
      path.join(testDir, 'vite.config.ts'),
      'utf-8'
    );
    expect(updated).toContain('isCustomElement');
    expect(updated).toContain("tag.startsWith('wa-')");
  });

  it('should inject isCustomElement into vue with existing options', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue({
    reactivityTransform: true,
  })],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVueCustomElements(testDir, mockOutput);

    expect(result).toBe(true);
    const updated = await fs.readFile(
      path.join(testDir, 'vite.config.ts'),
      'utf-8'
    );
    expect(updated).toContain('isCustomElement');
  });

  it('should return false and warn when vue() not found', async () => {
    const warnings: string[] = [];
    const output = { ...mockOutput, warn: (msg: string) => warnings.push(msg) };

    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.ts'), viteConfig);

    const result = await configureVueCustomElements(testDir, output);

    expect(result).toBe(false);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should fall back to vite.config.js', async () => {
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})`;
    await fs.writeFile(path.join(testDir, 'vite.config.js'), viteConfig);

    const result = await configureVueCustomElements(testDir, mockOutput);
    expect(result).toBe(true);
  });
});

describe('configureVueTypes', () => {
  let testDir: string;
  const waPackage = '@anthropic/web-awesome';

  beforeEach(async () => {
    testDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-vue-types-test-')
    );
    await fs.ensureDir(path.join(testDir, 'src'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should create env.d.ts with reference directive', async () => {
    const result = await configureVueTypes(testDir, mockOutput, waPackage);

    expect(result).toBe(true);
    const content = await fs.readFile(
      path.join(testDir, 'src', 'env.d.ts'),
      'utf-8'
    );
    expect(content).toContain(
      `/// <reference types="${waPackage}/dist/types/vue" />`
    );
  });

  it('should not duplicate if reference already present', async () => {
    await fs.writeFile(
      path.join(testDir, 'src', 'env.d.ts'),
      `/// <reference types="${waPackage}/dist/types/vue" />\n`
    );

    const result = await configureVueTypes(testDir, mockOutput, waPackage);
    expect(result).toBe(false);
  });

  it('should replace old WA type reference with new one', async () => {
    await fs.writeFile(
      path.join(testDir, 'src', 'env.d.ts'),
      `/// <reference types="@awesome.me/webawesome-pro/dist/types/vue" />\n`
    );

    const result = await configureVueTypes(testDir, mockOutput, waPackage);

    expect(result).toBe(true);
    const content = await fs.readFile(
      path.join(testDir, 'src', 'env.d.ts'),
      'utf-8'
    );
    expect(content).toContain(
      `/// <reference types="${waPackage}/dist/types/vue" />`
    );
    expect(content).not.toContain('webawesome-pro');
  });

  it('should clean up stale types from tsconfig.app.json', async () => {
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), {
      compilerOptions: {
        types: ['vite/client', '@awesome.me/webawesome-pro/dist/types/vue'],
      },
    });

    await configureVueTypes(testDir, mockOutput, waPackage);

    const tsconfig = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(tsconfig.compilerOptions.types).toEqual(['vite/client']);
  });

  it('should preserve existing env.d.ts content', async () => {
    await fs.writeFile(
      path.join(testDir, 'src', 'env.d.ts'),
      '/// <reference types="vite/client" />\n'
    );

    const result = await configureVueTypes(testDir, mockOutput, waPackage);

    expect(result).toBe(true);
    const content = await fs.readFile(
      path.join(testDir, 'src', 'env.d.ts'),
      'utf-8'
    );
    expect(content).toContain(
      `/// <reference types="${waPackage}/dist/types/vue" />`
    );
    expect(content).toContain('/// <reference types="vite/client" />');
  });
});

describe('toKigumiAlias', () => {
  it('strips a leading src/ segment for src-layout directories', () => {
    expect(toKigumiAlias('src/styles')).toBe('@/styles');
    expect(toKigumiAlias('src/lib')).toBe('@/lib');
    expect(toKigumiAlias('src/components/ui')).toBe('@/components/ui');
  });

  it('prefixes bare directories with @/ for root-layout projects', () => {
    expect(toKigumiAlias('styles')).toBe('@/styles');
    expect(toKigumiAlias('lib')).toBe('@/lib');
    expect(toKigumiAlias('components/ui')).toBe('@/components/ui');
  });

  it('preserves non-default directories so post-install paths follow config', () => {
    // Covers the C-1 case: a user who configures stylesDir='assets/css'
    // and utilsDir='utils' must see `@/assets/css/...` and `@/utils/...`
    // in the Pages Router post-install instructions, not hardcoded
    // `@/styles` and `@/lib`.
    expect(toKigumiAlias('assets/css')).toBe('@/assets/css');
    expect(toKigumiAlias('utils')).toBe('@/utils');
    expect(toKigumiAlias('app/ui')).toBe('@/app/ui');
  });

  it('only strips a leading src/ segment, not src/ occurrences mid-path', () => {
    // Defensive: someone with a literal directory named `not-src/lib` or
    // `packages/src/whatever` should not have any segment mangled.
    expect(toKigumiAlias('not-src/lib')).toBe('@/not-src/lib');
    expect(toKigumiAlias('packages/src/lib')).toBe('@/packages/src/lib');
  });
});
