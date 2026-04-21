/**
 * Integration Test Helpers
 *
 * Utilities for running real CLI commands in temporary directories.
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

const CLI_PATH = path.join(process.cwd(), 'dist', 'index.js');

/**
 * Create a temporary project directory with a basic package.json
 */
export async function createTempProject(
  template:
    | 'react-vite'
    | 'react-next-app'
    | 'react-next-pages'
    | 'empty' = 'react-vite'
): Promise<string> {
  const testDir = path.join(
    os.tmpdir(),
    `kigumi-integration-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  await fs.ensureDir(testDir);

  if (template === 'react-next-app' || template === 'react-next-pages') {
    // Minimal Next.js project structure. We pin Next to a string — the test
    // never runs `npm install`, so the actual version doesn't matter, only
    // that `detectMetaFramework` sees `deps.next`.
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        typescript: '^5.0.0',
      },
    });

    await fs.writeJSON(path.join(testDir, 'tsconfig.json'), {
      compilerOptions: {
        target: 'ES2022',
        lib: ['dom', 'dom.iterable', 'esnext'],
        module: 'esnext',
        moduleResolution: 'bundler',
        jsx: 'preserve',
        strict: true,
        paths: { '@/*': ['./src/*'] },
      },
      include: ['src', 'next-env.d.ts'],
    });

    // Create the router-marker directory so detectNextRouter() returns the
    // right value during init. Contents don't matter for the post-install
    // snippet assertions.
    await fs.ensureDir(path.join(testDir, 'src'));
    if (template === 'react-next-app') {
      await fs.ensureDir(path.join(testDir, 'app'));
    } else {
      await fs.ensureDir(path.join(testDir, 'pages'));
    }
  } else if (template === 'react-vite') {
    // Create minimal React + Vite project structure
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      name: 'test-project',
      version: '1.0.0',
      type: 'module',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        typescript: '^5.0.0',
        vite: '^5.0.0',
        '@vitejs/plugin-react': '^4.0.0',
      },
    });

    // Create tsconfig.json
    await fs.writeJSON(path.join(testDir, 'tsconfig.json'), {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        paths: {
          '@/*': ['./src/*'],
        },
      },
      include: ['src'],
    });

    // Create vite.config.ts
    await fs.writeFile(
      path.join(testDir, 'vite.config.ts'),
      `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
`
    );

    // Create src directory
    await fs.ensureDir(path.join(testDir, 'src'));
    await fs.writeFile(
      path.join(testDir, 'src', 'main.tsx'),
      `import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>Hello World</div>
  </React.StrictMode>
);
`
    );
  } else {
    // Empty project - just package.json
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      name: 'test-project',
      version: '1.0.0',
    });
  }

  return testDir;
}

/**
 * Run kigumi CLI command in a directory
 */
export async function runKigumi(
  cwd: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const result = await execa('node', [CLI_PATH, ...args], {
      cwd,
      env: {
        ...process.env,
        // Force non-interactive mode
        CI: 'true',
        // Isolate from host Pro tier detection
        WEBAWESOME_NPM_TOKEN: '',
        KIGUMI_SKIP_GLOBAL_NPMRC: 'true',
      },
    });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode ?? 0,
    };
  } catch (error) {
    const execaError = error as {
      stdout?: string;
      stderr?: string;
      exitCode?: number;
    };
    return {
      stdout: execaError.stdout || '',
      stderr: execaError.stderr || '',
      exitCode: execaError.exitCode || 1,
    };
  }
}

/**
 * Clean up temporary directory
 */
export async function cleanup(testDir: string): Promise<void> {
  await fs.remove(testDir);
}

/**
 * Check if a file exists in the test directory
 */
export async function fileExists(
  testDir: string,
  relativePath: string
): Promise<boolean> {
  return fs.pathExists(path.join(testDir, relativePath));
}

/**
 * Read file content from test directory
 */
export async function readFile(
  testDir: string,
  relativePath: string
): Promise<string> {
  return fs.readFile(path.join(testDir, relativePath), 'utf-8');
}

/**
 * Write file content to test directory
 */
export async function writeFile(
  testDir: string,
  relativePath: string,
  content: string
): Promise<void> {
  await fs.writeFile(path.join(testDir, relativePath), content);
}
