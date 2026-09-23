/**
 * Free consumer tsc tracer (issue #73).
 *
 * Types are proven on the files a user receives: an ephemeral Vite-React
 * project created with the real CLI (`init`, then `add --all`), typechecked
 * with that project's own `tsc -b`. Vite's react-ts template no longer
 * sets `strict`, and `tsc -b` rejects a `--strict` flag, so the tracer
 * turns `strict` on in the consumer tsconfig before that `tsc -b`.
 * `add --all` is the only install filter; this file reads the registry
 * afterwards to observe which Templates landed.
 *
 * A failing typecheck reports the consumer compiler's stdout and stderr.
 * It does not parse them into a summary. The relaxed generate-then-tsc
 * check (strict off) stays until a later ticket removes it.
 *
 * Run with: pnpm test:e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { getAllComponents } from '../../src/utils/registry.js';

const TEST_DIR = path.resolve(__dirname, '../.tmp-e2e-free-consumer-tsc');
const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');
const RELAXED_COMPILE_CHECK = path.resolve(
  __dirname,
  '../integration/compile-check.test.ts'
);
const PLANTED_ERROR = path.join(TEST_DIR, 'src/planted-consumer-error.tsx');

const FREE_PACKAGE = '@awesome.me/webawesome';
const PRO_PACKAGE = '@awesome.me/webawesome-pro';

// Same isolation as smoke.test.ts: a developer's global Pro token must not
// switch this consumer onto the Pro package.
const FREE_TIER_ENV = {
  WEBAWESOME_NPM_TOKEN: '',
  KIGUMI_SKIP_GLOBAL_NPMRC: 'true',
};

const SCAFFOLD_TIMEOUT_MS = 600_000;
const TSC_TIMEOUT_MS = 180_000;

interface CommandOutput {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function compilerOutput(result: CommandOutput): string {
  return [result.stdout, result.stderr]
    .filter((part) => part.length > 0)
    .join('\n');
}

async function runCli(args: string[]): Promise<CommandOutput> {
  const result = await execa('node', [CLI_PATH, ...args], {
    cwd: TEST_DIR,
    reject: false,
    env: {
      ...process.env,
      ...FREE_TIER_ENV,
    },
  });

  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function runConsumerTsc(): Promise<CommandOutput> {
  const result = await execa('pnpm', ['exec', 'tsc', '-b'], {
    cwd: TEST_DIR,
    reject: false,
  });

  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function registryNamesByTier(): { free: string[]; pro: string[] } {
  const free: string[] = [];
  const pro: string[] = [];

  for (const component of Object.values(getAllComponents())) {
    if (component.tier === 'pro') {
      pro.push(component.name);
    } else {
      free.push(component.name);
    }
  }

  free.sort((a, b) => a.localeCompare(b));
  pro.sort((a, b) => a.localeCompare(b));
  return { free, pro };
}

describe('relaxed integration compile check', () => {
  it('is still present, with strict mode off', async () => {
    const source = await fs.readFile(RELAXED_COMPILE_CHECK, 'utf8');
    expect(source).toContain('strict: false');
  });
});

describe('Free consumer tsc tracer', () => {
  beforeAll(async () => {
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);

    await execa('pnpm', ['create', 'vite', '.', '--template', 'react-ts'], {
      cwd: TEST_DIR,
      env: { ...process.env },
    });

    const init = await runCli([
      'init',
      '--framework=react',
      '--theme=awesome',
      '--typescript',
      '--yes',
    ]);
    expect(init.exitCode, compilerOutput(init)).toBe(0);

    const add = await runCli(['add', '--all', '--yes']);
    expect(add.exitCode, compilerOutput(add)).toBe(0);

    // The relaxed compile check sets `strict: false`. This tracer must not.
    // The scaffold also leaves `strict` unset, which TypeScript treats as
    // off, so the consumer build would not be the strict proof. Enable it
    // on the config `tsc -b` actually reads.
    const tsconfigPath = path.join(TEST_DIR, 'tsconfig.app.json');
    const tsconfig = (await fs.readJSON(tsconfigPath)) as {
      compilerOptions?: { strict?: boolean };
    };
    expect(tsconfig.compilerOptions?.strict).not.toBe(false);
    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      strict: true,
    };
    await fs.writeJSON(tsconfigPath, tsconfig, { spaces: 2 });
  }, SCAFFOLD_TIMEOUT_MS);

  afterAll(async () => {
    await fs.remove(TEST_DIR);
  });

  it('installs the Free Web Awesome package only', async () => {
    const packageJson = (await fs.readJSON(
      path.join(TEST_DIR, 'package.json')
    )) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies?.[FREE_PACKAGE]).toBeDefined();
    expect(packageJson.dependencies?.[PRO_PACKAGE]).toBeUndefined();
    expect(packageJson.devDependencies?.[PRO_PACKAGE]).toBeUndefined();
    expect(
      await fs.pathExists(
        path.join(TEST_DIR, 'node_modules', ...FREE_PACKAGE.split('/'))
      )
    ).toBe(true);
  });

  it('installs Free Templates and drops Pro-only ones', async () => {
    const { free, pro } = registryNamesByTier();
    expect(free.length).toBeGreaterThan(0);
    expect(pro.length).toBeGreaterThan(0);

    const config = (await fs.readJSON(
      path.join(TEST_DIR, 'kigumi.config.json')
    )) as {
      componentsDir: string;
      installedComponents?: Record<string, unknown>;
    };

    const installed = Object.keys(config.installedComponents ?? {}).sort(
      (a, b) => a.localeCompare(b)
    );
    expect(installed).toEqual(free);

    const componentsDir = path.join(TEST_DIR, config.componentsDir);
    const entries = await fs.readdir(componentsDir, { withFileTypes: true });
    const onDisk = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    expect(onDisk).toEqual(free);
    for (const name of free) {
      expect(
        await fs.pathExists(path.join(componentsDir, name, `${name}.tsx`)),
        name
      ).toBe(true);
    }
  });

  it(
    'typechecks with the consumer compiler',
    async () => {
      await fs.remove(PLANTED_ERROR);
      const result = await runConsumerTsc();
      expect(result.exitCode, compilerOutput(result)).toBe(0);
    },
    TSC_TIMEOUT_MS
  );

  it(
    'reports a type error as the consumer compiler output',
    async () => {
      // Legal when strictNullChecks is off, an error when it is on.
      // A string-assigned-to-number error would fail either way and would
      // not show that this tsc run is strict.
      await fs.writeFile(
        PLANTED_ERROR,
        [
          'export function take(value: string): string {',
          '  return value;',
          '}',
          'export const result = take(null);',
          '',
        ].join('\n')
      );

      const result = await runConsumerTsc();
      const output = compilerOutput(result);

      expect(result.exitCode, output).not.toBe(0);
      expect(output).toContain('planted-consumer-error.tsx');
      expect(output).toContain('error TS2345');
      expect(output).toContain(
        "Argument of type 'null' is not assignable to parameter of type 'string'."
      );
    },
    TSC_TIMEOUT_MS
  );
});
