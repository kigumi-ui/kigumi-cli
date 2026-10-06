/**
 * Shared shape of the consumer tsc suites (issues #73, #78, #79).
 *
 * Types are proven on the files a user receives: an ephemeral project made
 * by the framework's own scaffolder, then the real CLI (`init`, then
 * `add --all`), then that project's own strict typecheck. Each framework
 * file supplies a `ConsumerSpec`; `describeConsumers` registers the same
 * checks for all of them, once per tier, so a gap in one framework or one
 * tier cannot hide behind coverage in another.
 *
 * The Free consumer always runs. The Pro consumer runs where this machine
 * can install the pinned Pro package; elsewhere it reports did not run
 * (`consumer-premise.ts`, docs/adr/0003) and never a pass.
 *
 * `KIGUMI_CONSUMER_TIER` (`free` or `pro`) narrows a run to one tier's
 * consumers, so CI can give the Pro token to the Pro step alone. Unset, both
 * tiers register.
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
import { detectProTokenSync } from '../../../src/utils/token.js';
import { tierSchema, type Tier } from '../../../src/utils/tier.js';
import {
  consumerPremise,
  probeProPackage,
  reportNotRun,
  resolveProPackage,
  type ConsumerPremise,
} from './consumer-premise.js';
import { FREE_TIER_ENV } from '../../_helpers/free-tier-env.js';

export const CLI_PATH = path.resolve(__dirname, '../../../dist/index.js');

/** The tiers this run registers consumers for (see the header). */
function consumerTiers(env: NodeJS.ProcessEnv = process.env): readonly Tier[] {
  const only = env.KIGUMI_CONSUMER_TIER;
  return only ? [tierSchema.parse(only)] : tierSchema.options;
}

interface RegistryNames {
  free: string[];
  pro: string[];
}

interface TierFacts {
  /** Capitalised, for titles. */
  name: string;
  /** The package this tier's consumer must install. */
  packageName: string;
  /** The package it must not, so an import of it cannot resolve. */
  otherPackage: string;
  /** Environment for the CLI, on top of the test process's own. */
  env: Readonly<Record<string, string>>;
  /** Title of the check comparing installed Templates with the registry. */
  templatesTitle: string;
  /** The registry components `add --all` must install on this tier, sorted. */
  expectedTemplates: (names: RegistryNames) => string[];
  /** Whether this tier's consumer can run from `dir`, named `label`. */
  premise: (label: string, dir: string) => ConsumerPremise;
}

const FREE_PACKAGE = '@awesome.me/webawesome';
const PRO_PACKAGE = '@awesome.me/webawesome-pro';

const TIER_FACTS: Record<Tier, TierFacts> = {
  free: {
    name: 'Free',
    packageName: FREE_PACKAGE,
    otherPackage: PRO_PACKAGE,
    env: FREE_TIER_ENV,
    templatesTitle: 'installs Free Templates and drops Pro-only ones',
    expectedTemplates: ({ free }) => free,
    premise: () => ({ run: true }),
  },
  pro: {
    name: 'Pro',
    packageName: PRO_PACKAGE,
    otherPackage: FREE_PACKAGE,
    // Nothing added: the CLI inherits this environment and reads the same
    // ~/.npmrc, so it finds the token the premise found.
    env: {},
    templatesTitle: 'installs every Template, Pro-only ones included',
    expectedTemplates: ({ free, pro }) =>
      [...free, ...pro].sort((a, b) => a.localeCompare(b)),
    premise: (label, dir) => {
      const token = detectProTokenSync(dir);
      return consumerPremise(
        resolveProPackage({
          token,
          probe: () => probeProPackage(DEFAULT_WEBAWESOME_VERSION, token ?? ''),
        }),
        { label }
      );
    },
  },
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

export interface ConsumerSpec {
  /** Framework name for titles; lower-cased, it names the project directories. */
  framework: string;
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
export interface Consumer {
  /** The Web Awesome package this consumer installs and typechecks against. */
  packageName: string;
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

function registryNamesByTier(): RegistryNames {
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
 * Register the consumer checks for one framework, a Free and a Pro consumer
 * each on its own project. `more` runs inside each consumer's describe block,
 * after the shared checks, so it sees the same scaffolded project, unless
 * that consumer did not run.
 */
export function describeConsumers(
  spec: ConsumerSpec,
  more?: (consumer: Consumer) => void
): void {
  for (const tier of consumerTiers()) {
    describeConsumer(tier, spec, more);
  }
}

function describeConsumer(
  tier: Tier,
  spec: ConsumerSpec,
  more?: (consumer: Consumer) => void
): void {
  const facts = TIER_FACTS[tier];
  const title = `${facts.name} consumer tsc: ${spec.framework}`;
  const slug = spec.framework.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dir = path.resolve(
    __dirname,
    `../../.tmp-e2e-${tier}-consumer-tsc-${slug}`
  );

  const premise = facts.premise(title, dir);

  if (!premise.run) {
    const { summary } = premise;
    describe(title, () => {
      it(`has the ${facts.name} package to typecheck against`, (ctx) =>
        reportNotRun(summary, (note) => ctx.skip(note)));
    });
    return;
  }

  const typecheckCommand = spec.typecheck.join(' ');
  let config: ConsumerConfig | undefined;

  async function exec(args: string[]): Promise<CommandOutput> {
    return toCommandOutput(
      await execa('pnpm', ['exec', ...args], {
        cwd: dir,
        reject: false,
      })
    );
  }

  async function runCli(args: string[]): Promise<CommandOutput> {
    return toCommandOutput(
      await execa('node', [CLI_PATH, ...args], {
        cwd: dir,
        reject: false,
        env: {
          ...process.env,
          ...facts.env,
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

  const consumer: Consumer = {
    packageName: facts.packageName,
    dir,
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
        dir,
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

  describe(title, () => {
    beforeAll(async () => {
      await fs.remove(dir);
      await spec.scaffold(dir);

      const init = await runCli(['init', ...spec.initArgs]);
      expect(init.exitCode, commandText(init)).toBe(0);

      const add = await runCli(['add', '--all', '--yes']);
      expect(add.exitCode, commandText(add)).toBe(0);

      config = (await fs.readJSON(
        path.join(dir, 'kigumi.config.json')
      )) as ConsumerConfig;

      await spec.prepare?.(dir);
    }, SCAFFOLD_TIMEOUT_MS);

    afterAll(async () => {
      await fs.remove(dir);
    });

    it(`installs the pinned ${facts.name} Web Awesome package only`, async () => {
      const packageJson = (await fs.readJSON(
        path.join(dir, 'package.json')
      )) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      // Types are proven against the version the CLI ships (#71, story 45),
      // which `init` writes as an exact pin.
      expect(packageJson.dependencies?.[facts.packageName]).toBe(
        DEFAULT_WEBAWESOME_VERSION
      );
      expect(packageJson.dependencies?.[facts.otherPackage]).toBeUndefined();
      expect(packageJson.devDependencies?.[facts.otherPackage]).toBeUndefined();

      const installed = (await fs.readJSON(
        path.join(
          dir,
          'node_modules',
          ...facts.packageName.split('/'),
          'package.json'
        )
      )) as { version?: string };
      expect(installed.version).toBe(DEFAULT_WEBAWESOME_VERSION);

      // Absent from node_modules too, so a Template still importing the other
      // tier's path cannot resolve and fails the typecheck below.
      expect(
        await fs.pathExists(
          path.join(dir, 'node_modules', ...facts.otherPackage.split('/'))
        )
      ).toBe(false);
    });

    it(facts.templatesTitle, async () => {
      const names = registryNamesByTier();
      expect(names.free.length).toBeGreaterThan(0);
      expect(names.pro.length).toBeGreaterThan(0);
      const expected = facts.expectedTemplates(names);

      const { componentsDir, installedComponents } = readConfig();
      const installed = Object.keys(installedComponents ?? {}).sort((a, b) =>
        a.localeCompare(b)
      );
      expect(installed).toEqual(expected);

      const componentsPath = path.join(dir, componentsDir);
      const entries = await fs.readdir(componentsPath, {
        withFileTypes: true,
      });
      const onDisk = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

      expect(onDisk).toEqual(expected);
      for (const name of expected) {
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
