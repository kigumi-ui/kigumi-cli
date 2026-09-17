/**
 * E2E: `init` across all four framework/layout combinations (issue #48).
 *
 * The gap this closes: 1745 unit tests and 31 integration tests passed while
 * `init` crashed with ENOENT on two of these four combinations. Every unit test
 * of the declaration generators calls `fs.ensureDir` first, satisfying a
 * precondition production does not, and no fixture covered a root-layout
 * project at all.
 *
 * So this suite runs the real built CLI against real scaffolds and asserts two
 * things per combination:
 *
 *   1. the exit code, and
 *   2. *where* the declaration landed.
 *
 * The second assertion is not redundant. The two defects mask each other: with
 * the layout hardcoded to 'src' but `ensureDir` in place, `init` exits 0 and
 * silently writes a stray `src/vite-env.d.ts` into a project that has no `src/`
 * — green on exit code alone, still wrong. Asserting the path is what catches
 * it.
 *
 * Run with: pnpm test:e2e
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

const TEST_ROOT = path.resolve(__dirname, '../.tmp-e2e-source-layout');
const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');

// Same isolation as smoke.test.ts: keep a developer's global Pro token from
// changing which Web Awesome package this resolves to.
const FREE_TIER_ENV = {
  WEBAWESOME_NPM_TOKEN: '',
  KIGUMI_SKIP_GLOBAL_NPMRC: 'true',
};

type Framework = 'react' | 'vue';
type Layout = 'src' | 'root';

/**
 * Scaffold a minimal but honest Vite project.
 *
 * The layout is expressed the way `detectSourceLayout` actually probes for it:
 * a `src/main.{ts,tsx}` entry point means `src` layout, its absence means root.
 * Nothing here pre-creates the directory the CLI is expected to write into —
 * that omission is the whole point of the test.
 */
async function scaffold(
  dir: string,
  framework: Framework,
  layout: Layout
): Promise<void> {
  await fs.ensureDir(dir);

  await fs.writeJSON(
    path.join(dir, 'package.json'),
    {
      name: 'layout-fixture',
      type: 'module',
      dependencies:
        framework === 'react' ? { react: '^19.0.0' } : { vue: '^3.4.0' },
      devDependencies: { vite: '^7.0.0', typescript: '^5.0.0' },
    },
    { spaces: 2 }
  );

  await fs.writeFile(
    path.join(dir, 'vite.config.ts'),
    'import { defineConfig } from "vite";\nexport default defineConfig({});\n'
  );

  const entryDir = layout === 'src' ? path.join(dir, 'src') : dir;
  await fs.ensureDir(entryDir);

  if (framework === 'react') {
    await fs.writeFile(
      path.join(entryDir, 'main.tsx'),
      'export const App = () => null;\n'
    );
  } else {
    await fs.writeFile(
      path.join(entryDir, 'App.vue'),
      '<template><div /></template>\n'
    );
    await fs.writeFile(path.join(entryDir, 'main.ts'), 'export {};\n');
  }
}

async function runInit(dir: string, framework: Framework) {
  return execa(
    'node',
    [
      CLI_PATH,
      'init',
      '--yes',
      `--framework=${framework}`,
      '--typescript',
      // Skip the package-manager install: this suite is about where files
      // land, and a real install would add minutes of network for nothing.
      '--no-install',
    ],
    {
      cwd: dir,
      env: {
        ...process.env,
        ...FREE_TIER_ENV,
        NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || '',
      },
      reject: false,
    }
  );
}

/** React emits `vite-env.d.ts`; Vue emits `env.d.ts`. */
const DECLARATION_FILE: Record<Framework, string> = {
  react: 'vite-env.d.ts',
  vue: 'env.d.ts',
};

describe('init honours the detected source layout (issue #48)', () => {
  beforeAll(async () => {
    expect(
      await fs.pathExists(CLI_PATH),
      `built CLI missing at ${CLI_PATH} - run \`pnpm build\` first`
    ).toBe(true);
    await fs.remove(TEST_ROOT);
  });

  afterEach(async () => {
    await fs.remove(TEST_ROOT);
  });

  const cases: Array<{ framework: Framework; layout: Layout }> = [
    { framework: 'react', layout: 'root' },
    { framework: 'react', layout: 'src' },
    { framework: 'vue', layout: 'root' },
    { framework: 'vue', layout: 'src' },
  ];

  for (const { framework, layout } of cases) {
    it(`${framework} + ${layout} layout: exits 0 and writes the declaration into the ${layout === 'src' ? 'src/' : 'project root'}`, async () => {
      const dir = path.join(TEST_ROOT, `${framework}-${layout}`);
      await scaffold(dir, framework, layout);

      const result = await runInit(dir, framework);

      expect(
        result.exitCode,
        `init failed:\n${result.stderr || result.stdout}`
      ).toBe(0);

      const declaration = DECLARATION_FILE[framework];
      const expected =
        layout === 'src' ? path.join('src', declaration) : declaration;
      const wrong =
        layout === 'src' ? declaration : path.join('src', declaration);

      expect(
        await fs.pathExists(path.join(dir, expected)),
        `expected ${expected} to exist`
      ).toBe(true);

      // The mask-catching half: a hardcoded 'src' with ensureDir behind it
      // exits 0 and leaves the declaration in the wrong place.
      expect(
        await fs.pathExists(path.join(dir, wrong)),
        `${wrong} should not exist for a ${layout} layout`
      ).toBe(false);
    });
  }

  it('does not invent a src/ directory in a root-layout project', async () => {
    const dir = path.join(TEST_ROOT, 'react-root-no-src');
    await scaffold(dir, 'react', 'root');

    const result = await runInit(dir, 'react');

    expect(result.exitCode).toBe(0);
    expect(await fs.pathExists(path.join(dir, 'src'))).toBe(false);
  });
});
