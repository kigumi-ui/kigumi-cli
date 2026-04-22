/**
 * Integration Tests for kigumi init
 *
 * Tests the real CLI flow in temporary directories.
 * No mocks - actual filesystem operations.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanup,
  createTempProject,
  fileExists,
  readFile,
  runKigumi,
  writeFile,
} from './helpers.js';

describe('kigumi init', () => {
  let testDir: string;

  // Ensure CLI is built before running integration tests
  beforeAll(async () => {
    const fs = await import('fs-extra');
    const cliExists = await fs.pathExists('dist/index.js');
    if (!cliExists) {
      throw new Error(
        'CLI not built. Run `npm run build` before integration tests.'
      );
    }
  });

  afterEach(async () => {
    if (testDir) {
      await cleanup(testDir);
    }
  });

  describe('file generation', () => {
    it('generates required files for React + Vite project', async () => {
      testDir = await createTempProject('react-vite');

      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Should exit successfully
      expect(result.exitCode).toBe(0);

      // Check generated files
      expect(await fileExists(testDir, 'kigumi.config.json')).toBe(true);
      expect(await fileExists(testDir, 'src/lib/kigumi.ts')).toBe(true);
      expect(await fileExists(testDir, 'src/styles/theme.css')).toBe(true);
      expect(await fileExists(testDir, 'src/styles/layers.css')).toBe(true);
      expect(await fileExists(testDir, '.npmrc')).toBe(true);
    });

    it('generates config with correct structure', async () => {
      testDir = await createTempProject('react-vite');

      await runKigumi(testDir, ['init', '--no-install', '-y']);

      const configContent = await readFile(testDir, 'kigumi.config.json');
      const config = JSON.parse(configContent);

      expect(config).toHaveProperty('framework', 'react');
      expect(config).toHaveProperty('typescript', true);
      expect(config).toHaveProperty('theme');
      expect(config.theme).toHaveProperty('selected');
      expect(config.theme).toHaveProperty('palette');
      expect(config.theme).toHaveProperty('brandColor');
    });

    it('generates required files for Next.js project', async () => {
      testDir = await createTempProject('next-app');

      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      expect(result.exitCode).toBe(0);

      // Core Kigumi files
      expect(await fileExists(testDir, 'kigumi.config.json')).toBe(true);
      expect(await fileExists(testDir, 'src/lib/kigumi.ts')).toBe(true);
      expect(await fileExists(testDir, 'src/styles/theme.css')).toBe(true);
      expect(await fileExists(testDir, 'src/styles/layers.css')).toBe(true);

      // Next-specific outputs
      expect(await fileExists(testDir, 'src/app/providers.tsx')).toBe(true);
      expect(await fileExists(testDir, 'src/web-awesome.d.ts')).toBe(true);

      // Files that must NOT be produced for Next
      expect(await fileExists(testDir, 'src/vite-env.d.ts')).toBe(false);
      expect(await fileExists(testDir, 'vite.config.ts')).toBe(false);

      // kigumi.ts must be a Client Module
      const kigumi = await readFile(testDir, 'src/lib/kigumi.ts');
      expect(kigumi.startsWith("'use client';")).toBe(true);

      // providers.tsx must also be a Client Module and import kigumi
      const providers = await readFile(testDir, 'src/app/providers.tsx');
      expect(providers.startsWith("'use client';")).toBe(true);
      expect(providers).toContain('@/lib/kigumi');
      expect(providers).toContain('KigumiProvider');

      // web-awesome.d.ts must not reference vite/client
      const dts = await readFile(testDir, 'src/web-awesome.d.ts');
      expect(dts).not.toContain('vite/client');
    });

    it('adapts componentsDir to root layout for Next without src/', async () => {
      testDir = await createTempProject('next-app-no-src');

      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      expect(result.exitCode).toBe(0);

      // Config carries root-layout directories
      const config = JSON.parse(await readFile(testDir, 'kigumi.config.json'));
      expect(config.componentsDir).toBe('components/ui');
      expect(config.utilsDir).toBe('lib');
      expect(config.stylesDir).toBe('styles');
      expect(config.aliases).toEqual({
        '@/components': './components',
        '@/lib': './lib',
        '@/styles': './styles',
      });

      // Files land at the root layout, not under src/
      expect(await fileExists(testDir, 'lib/kigumi.ts')).toBe(true);
      expect(await fileExists(testDir, 'styles/theme.css')).toBe(true);
      expect(await fileExists(testDir, 'styles/layers.css')).toBe(true);
      expect(await fileExists(testDir, 'web-awesome.d.ts')).toBe(true);
      expect(await fileExists(testDir, 'app/providers.tsx')).toBe(true);
      expect(await fileExists(testDir, 'src/lib/kigumi.ts')).toBe(false);

      // tsconfig `@/*` stays at `['./*']` — it already resolves components/ui
      // correctly via the root layout, no rewrite needed.
      const tsconfig = JSON.parse(await readFile(testDir, 'tsconfig.json'));
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./*']);

      // providers.tsx must import from the root-layout alias
      const providers = await readFile(testDir, 'app/providers.tsx');
      expect(providers).toContain('@/lib/kigumi');
    });

    it('skips providers.tsx for Pages Router and scaffolds root-layout files', async () => {
      testDir = await createTempProject('next-pages');

      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      expect(result.exitCode).toBe(0);

      // Core Kigumi files (root layout — Pages Router has no src/ by default)
      expect(await fileExists(testDir, 'kigumi.config.json')).toBe(true);
      expect(await fileExists(testDir, 'lib/kigumi.ts')).toBe(true);
      expect(await fileExists(testDir, 'styles/theme.css')).toBe(true);
      expect(await fileExists(testDir, 'styles/layers.css')).toBe(true);
      expect(await fileExists(testDir, 'web-awesome.d.ts')).toBe(true);

      // Pages Router must NOT get providers.tsx (user wires _app.tsx manually)
      expect(await fileExists(testDir, 'app/providers.tsx')).toBe(false);
      expect(await fileExists(testDir, 'src/app/providers.tsx')).toBe(false);

      // User's pre-existing _app.tsx must stay untouched
      const userAppBefore = [
        "import type { AppProps } from 'next/app';",
        '',
        'export default function App({ Component, pageProps }: AppProps) {',
        '  return <Component {...pageProps} />;',
        '}',
        '',
      ].join('\n');
      const userApp = await readFile(testDir, 'pages/_app.tsx');
      expect(userApp).toBe(userAppBefore);

      // kigumi.ts must still be a Client Module — the 'use client' directive is
      // a no-op in Pages Router (Webpack/Turbopack just see a top-level string
      // literal), so emitting it uniformly for both routers is safe and keeps
      // the template path identical.
      const kigumi = await readFile(testDir, 'lib/kigumi.ts');
      expect(kigumi.startsWith("'use client';")).toBe(true);

      // Post-install output tells the user how to wire _app.tsx manually.
      expect(result.stdout).toContain('Pages Router');
      expect(result.stdout).toContain('pages/_app.tsx');
      expect(result.stdout).toContain("import '@/styles/layers.css';");
      expect(result.stdout).toContain("import '@/styles/theme.css';");
      expect(result.stdout).toContain("import '@/lib/kigumi';");

      // kigumi.ts must NOT carry the layers.css import — Next's Pages Router
      // rejects global-CSS imports from any file other than _app.tsx.
      expect(kigumi).not.toMatch(/^\s*import\s+['"][^'"]*layers\.css/m);
    });

    it('strips per-component CSS import when adding components to a Pages Router project', async () => {
      // End-to-end regression guard for the Pages Router CSS policy fix:
      // `kigumi add` on a Pages Router project must produce Button.tsx
      // without a sibling `./Button.css` side-effect import, since Next
      // forbids global CSS imports outside _app.tsx.
      testDir = await createTempProject('next-pages');

      const initResult = await runKigumi(testDir, [
        'init',
        '--no-install',
        '-y',
      ]);
      expect(initResult.exitCode).toBe(0);

      const addResult = await runKigumi(testDir, ['add', 'button', '-y']);
      expect(addResult.exitCode).toBe(0);

      const button = await readFile(testDir, 'components/ui/Button/Button.tsx');
      expect(button).not.toMatch(/import\s+['"]\.\/Button\.css['"]/);
      // 'use client' directive still lands on line 1
      expect(button.startsWith("'use client';")).toBe(true);
      // The stub CSS file is still generated — users can import it manually
      // from _app.tsx if they want custom per-component styles.
      expect(await fileExists(testDir, 'components/ui/Button/Button.css')).toBe(
        true
      );
    });

    it('keeps per-component CSS import when adding to App Router', async () => {
      // Regression guard: the Pages Router strip must not regress App Router.
      testDir = await createTempProject('next-app-no-src');

      await runKigumi(testDir, ['init', '--no-install', '-y']);
      const addResult = await runKigumi(testDir, ['add', 'button', '-y']);
      expect(addResult.exitCode).toBe(0);

      const button = await readFile(testDir, 'components/ui/Button/Button.tsx');
      expect(button).toContain("import './Button.css';");
      expect(button.startsWith("'use client';")).toBe(true);
    });

    it('adds .kigumi/cache/ to .gitignore', async () => {
      testDir = await createTempProject('react-vite');

      await runKigumi(testDir, ['init', '--no-install', '-y']);

      const gitignore = await readFile(testDir, '.gitignore');
      expect(gitignore).toContain('.kigumi/foreign/');
      expect(gitignore).toContain('.kigumi/cache/');
      // Snapshots must NOT be ignored — three-way merge depends on them.
      expect(gitignore).not.toMatch(/^\.kigumi\/snapshots\/?$/m);
      expect(gitignore).not.toMatch(/^\.kigumi\/$/m);
    });
  });

  describe('file preservation', () => {
    it('preserves existing theme.css on re-init', async () => {
      testDir = await createTempProject('react-vite');

      // First init
      await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Modify theme.css with custom content
      const customContent = '/* My custom styles */\n:root { --custom: red; }';
      await writeFile(testDir, 'src/styles/theme.css', customContent);

      // Re-init
      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Should preserve custom content
      const themeContent = await readFile(testDir, 'src/styles/theme.css');
      expect(themeContent).toBe(customContent);

      // Should show preservation message
      expect(result.stdout).toContain('Existing theme.css found');
    });

    it('preserves existing layers.css on re-init', async () => {
      testDir = await createTempProject('react-vite');

      // First init
      await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Modify layers.css with custom content
      const customContent = '/* My custom layers */\n@layer custom, base;';
      await writeFile(testDir, 'src/styles/layers.css', customContent);

      // Re-init
      const result = await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Should preserve custom content
      const layersContent = await readFile(testDir, 'src/styles/layers.css');
      expect(layersContent).toBe(customContent);

      // Should show preservation message
      expect(result.stdout).toContain('Existing layers.css found');
    });

    it('regenerates kigumi.ts on re-init', async () => {
      testDir = await createTempProject('react-vite');

      // First init
      await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Modify kigumi.ts
      await writeFile(testDir, 'src/lib/kigumi.ts', '// Should be overwritten');

      // Re-init
      await runKigumi(testDir, ['init', '--no-install', '-y']);

      // Should be regenerated (not preserved)
      const content = await readFile(testDir, 'src/lib/kigumi.ts');
      expect(content).toContain('auto-generated by Kigumi CLI');
      expect(content).not.toContain('Should be overwritten');
    });
  });

  describe('tier detection', () => {
    it('defaults to free tier when no token', async () => {
      testDir = await createTempProject('react-vite');

      await runKigumi(testDir, ['init', '--no-install', '-y']);

      const npmrcContent = await readFile(testDir, '.npmrc');
      expect(npmrcContent).toContain('registry.npmjs.org');
      expect(npmrcContent).not.toContain('cloudsmith');
    });
  });
});
