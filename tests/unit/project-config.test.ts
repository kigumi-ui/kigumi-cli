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

// Import the function under test
import {
  configureTSConfig,
  configureVitePathAliases,
} from '../../src/utils/project-config.js';

// Mock output interface
const mockOutput = {
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  success: () => {},
  spinner: () => ({ stop: () => {}, error: () => {}, message: () => {} }),
  intro: () => {},
  outro: () => {},
  note: () => {},
  warning: () => {},
};

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
    expect(updated.compilerOptions.baseUrl).toBe('.');
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

    // Should add path aliases
    expect(updated.compilerOptions.baseUrl).toBe('.');
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
});
