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

  it('should add esModuleInterop when missing', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.esModuleInterop).toBe(true);
  });

  it('should add allowSyntheticDefaultImports when missing', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.allowSyntheticDefaultImports).toBe(true);
  });

  it('should remove verbatimModuleSyntax when present', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        verbatimModuleSyntax: true,
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.verbatimModuleSyntax).toBeUndefined();
  });

  it('should remove restrictive types array (vite/client only)', async () => {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        types: ['vite/client'],
      },
    };
    await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), tsconfig);

    await configureTSConfig(testDir, mockOutput);

    const updated = await fs.readJSON(path.join(testDir, 'tsconfig.app.json'));
    expect(updated.compilerOptions.types).toBeUndefined();
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

    // Should have all required flags
    expect(updated.compilerOptions.esModuleInterop).toBe(true);
    expect(updated.compilerOptions.allowSyntheticDefaultImports).toBe(true);
    expect(updated.compilerOptions.baseUrl).toBe('.');
    expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });

    // Should have removed problematic flags
    expect(updated.compilerOptions.verbatimModuleSyntax).toBeUndefined();
    expect(updated.compilerOptions.types).toBeUndefined();

    // Should preserve other settings
    expect(updated.compilerOptions.moduleResolution).toBe('bundler');
    expect(updated.compilerOptions.jsx).toBe('react-jsx');
    expect(updated.compilerOptions.strict).toBe(true);
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
