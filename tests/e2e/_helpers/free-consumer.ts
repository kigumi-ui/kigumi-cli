/**
 * Shared shape of the Free consumer tsc suites (issues #73, #78).
 *
 * Types are proven on the files a user receives: an ephemeral project made
 * by the framework's own scaffolder, then the real CLI (`init`, then
 * `add --all`), then that project's own strict typecheck. Each framework
 * file supplies a `FreeConsumerSpec`; `describeFreeConsumer` registers the
 * same four checks for all of them, so a gap in one framework cannot hide
 * behind coverage in another.
 *
 * `add --all` is the only install filter. The suites read the registry
 * afterwards to observe which Templates landed; they never pick components.
 *
 * Planted errors go into the components directory, next to the Templates.
 * A planted file the compiler rejects there shows that directory is in the
 * compiled program, not only that the compiler is strict.
 *
 * A failing command reports its own stdout and stderr. The suites do not
 * parse them into a summary. `commandText()` strips ANSI colour: `ngc`
 * colours its diagnostics even when piped, and passing `--pretty false` does
 * not stop it, so the codes would split `error TS2345` in the assertions.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { stripVTControlCharacters } from 'node:util';
import { getAllComponents } from '../../../src/utils/registry.js';
import { DEFAULT_WEBAWESOME_VERSION } from '../../../src/constants.js';

export const CLI_PATH = path.resolve(__dirname, '../../../dist/index.js');

export const FREE_PACKAGE = '@awesome.me/webawesome';
const PRO_PACKAGE = '@awesome.me/webawesome-pro';

// Same isolation as smoke.test.ts: a developer's global Pro token must not
// switch this consumer onto the Pro package.
const FREE_TIER_ENV = {
  WEBAWESOME_NPM_TOKEN: '',
  KIGUMI_SKIP_GLOBAL_NPMRC: 'true',
};

export const SCAFFOLD_TIMEOUT_MS = 600_000;
export const TSC_TIMEOUT_MS = 180_000;

export interface CommandOutput {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface ExecaLike {
  exitCode?: number | null;
  stdout: string;
  stderr: string;
}

function toCommandOutput(result: ExecaLike): CommandOutput {
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export function commandText(result: CommandOutput): string {
  return stripVTControlCharacters(
    [result.stdout, result.stderr].filter((part) => part.length > 0).join('\n')
  );
}

/** A file written into the consumer's components directory for one check. */
export interface PlantedFile {
  /** File name inside the components directory. */
  file: string;
  source: string;
}

/** A planted file the consumer's typecheck must reject, and how. */
export interface PlantedError extends PlantedFile {
  /** Text the compiler output must contain besides the file's path. */
  diagnostics: readonly string[];
  /** Why it must fail, named in the message when the compiler exits 0. */
  failsBecause: string;
}

/**
 * What every framework's strict-only plant must produce: `take(null)` against
 * a `string` parameter. Legal when strictNullChecks is off, an error when it
 * is on. A string-assigned-to-number error would fail either way and would
 * not show that the typecheck is strict.
 */
const STRICT_ONLY_DIAGNOSTICS = [
  'error TS2345',
  "Argument of type 'null' is not assignable to parameter of type 'string'.",
] as const;

export interface FreeConsumerSpec {
  /** Name of the describe block. */
  title: string;
  /** Absolute path of the ephemeral project. Removed before and after. */
  dir: string;
  /** Create the project in `dir` with the framework's own scaffolder. */
  scaffold: (dir: string) => Promise<void>;
  /** Arguments after `kigumi init`. */
  initArgs: string[];
  /** Runs after `add --all`, before any typecheck. */
  prepare?: (dir: string) => Promise<void>;
  /** The consumer's own typecheck, run through `pnpm exec`. */
  typecheck: string[];
  /** A Template's main file, relative to its component directory. */
  templateFile: (componentName: string) => string;
  /** A file calling `take(null)`, which only a strict typecheck rejects. */
  strictOnlyError: PlantedFile;
}

/** Handle the framework file uses to add checks on the same project. */
export interface FreeConsumer {
  dir: string;
  /** `pnpm exec <args>` in the consumer. Never rejects. */
  exec: (args: string[]) => Promise<CommandOutput>;
  typecheck: () => Promise<CommandOutput>;
  /** `componentsDir` from the consumer's kigumi.config.json. */
  componentsDir: () => string;
  /** This framework's strict-only plant, with what it must produce. */
  strictOnlyError: PlantedError;
  /** Write `planted` into the components directory while `run` runs. */
  withPlanted: <T>(planted: PlantedFile, run: () => Promise<T>) => Promise<T>;
  /**
   * Assert `result` is `command` rejecting `planted`: a non-zero exit, the
   * planted file's path and each diagnostic in the compiler's own output.
   */
  expectRejected: (
    result: CommandOutput,
    command: string,
    planted: PlantedError
  ) => void;
}

interface ConsumerConfig {
  componentsDir: string;
  installedComponents?: Record<string, unknown>;
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

/**
 * Register the Free consumer checks for one framework. `more` runs inside
 * the same describe block, after the shared checks, so it sees the same
 * scaffolded project.
 */
export function describeFreeConsumer(
  spec: FreeConsumerSpec,
  more?: (consumer: FreeConsumer) => void
): void {
  const typecheckCommand = spec.typecheck.join(' ');
  let config: ConsumerConfig | undefined;

  async function exec(args: string[]): Promise<CommandOutput> {
    return toCommandOutput(
      await execa('pnpm', ['exec', ...args], {
        cwd: spec.dir,
        reject: false,
      })
    );
  }

  async function runCli(args: string[]): Promise<CommandOutput> {
    return toCommandOutput(
      await execa('node', [CLI_PATH, ...args], {
        cwd: spec.dir,
        reject: false,
        env: {
          ...process.env,
          ...FREE_TIER_ENV,
        },
      })
    );
  }

  function readConfig(): ConsumerConfig {
    if (!config) {
      throw new Error('kigumi.config.json is read after `add --all`');
    }
    return config;
  }

  const consumer: FreeConsumer = {
    dir: spec.dir,
    exec,
    typecheck: () => exec(spec.typecheck),
    componentsDir: () => readConfig().componentsDir,
    strictOnlyError: {
      ...spec.strictOnlyError,
      diagnostics: STRICT_ONLY_DIAGNOSTICS,
      failsBecause:
        'planted beside the Templates, where a strict typecheck must reject it',
    },
    async withPlanted(planted, run) {
      const plantedPath = path.join(
        spec.dir,
        consumer.componentsDir(),
        planted.file
      );
      await fs.writeFile(plantedPath, planted.source);
      try {
        return await run();
      } finally {
        await fs.remove(plantedPath);
      }
    },
    expectRejected(result, command, planted) {
      const output = commandText(result);
      // An exit 0 prints nothing, so name what should have failed.
      expect(
        result.exitCode,
        `\`${command}\` exited 0 on ${planted.file}, ${planted.failsBecause}\n${output}`
      ).not.toBe(0);
      expect(output).toContain(
        path.posix.join(consumer.componentsDir(), planted.file)
      );
      for (const diagnostic of planted.diagnostics) {
        expect(output).toContain(diagnostic);
      }
    },
  };

  describe(spec.title, () => {
    beforeAll(async () => {
      await fs.remove(spec.dir);
      await spec.scaffold(spec.dir);

      const init = await runCli(['init', ...spec.initArgs]);
      expect(init.exitCode, commandText(init)).toBe(0);

      const add = await runCli(['add', '--all', '--yes']);
      expect(add.exitCode, commandText(add)).toBe(0);

      config = (await fs.readJSON(
        path.join(spec.dir, 'kigumi.config.json')
      )) as ConsumerConfig;

      await spec.prepare?.(spec.dir);
    }, SCAFFOLD_TIMEOUT_MS);

    afterAll(async () => {
      await fs.remove(spec.dir);
    });

    it('installs the pinned Free Web Awesome package only', async () => {
      const packageJson = (await fs.readJSON(
        path.join(spec.dir, 'package.json')
      )) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      // Types are proven against the version the CLI ships (#71, story 45),
      // which `init` writes as an exact pin.
      expect(packageJson.dependencies?.[FREE_PACKAGE]).toBe(
        DEFAULT_WEBAWESOME_VERSION
      );
      expect(packageJson.dependencies?.[PRO_PACKAGE]).toBeUndefined();
      expect(packageJson.devDependencies?.[PRO_PACKAGE]).toBeUndefined();

      const installed = (await fs.readJSON(
        path.join(
          spec.dir,
          'node_modules',
          ...FREE_PACKAGE.split('/'),
          'package.json'
        )
      )) as { version?: string };
      expect(installed.version).toBe(DEFAULT_WEBAWESOME_VERSION);
    });

    it('installs Free Templates and drops Pro-only ones', async () => {
      const { free, pro } = registryNamesByTier();
      expect(free.length).toBeGreaterThan(0);
      expect(pro.length).toBeGreaterThan(0);

      const { componentsDir, installedComponents } = readConfig();
      const installed = Object.keys(installedComponents ?? {}).sort((a, b) =>
        a.localeCompare(b)
      );
      expect(installed).toEqual(free);

      const componentsPath = path.join(spec.dir, componentsDir);
      const entries = await fs.readdir(componentsPath, {
        withFileTypes: true,
      });
      const onDisk = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

      expect(onDisk).toEqual(free);
      for (const name of free) {
        expect(
          await fs.pathExists(
            path.join(componentsPath, name, spec.templateFile(name))
          ),
          name
        ).toBe(true);
      }
    });

    it(
      'typechecks with the consumer compiler',
      async () => {
        const result = await consumer.typecheck();
        expect(result.exitCode, commandText(result)).toBe(0);
      },
      TSC_TIMEOUT_MS
    );

    it(
      'rejects a strict-only error beside the Templates, in its own output',
      async () => {
        await consumer.withPlanted(consumer.strictOnlyError, async () => {
          consumer.expectRejected(
            await consumer.typecheck(),
            typecheckCommand,
            consumer.strictOnlyError
          );
        });
      },
      TSC_TIMEOUT_MS
    );

    more?.(consumer);
  });
}
