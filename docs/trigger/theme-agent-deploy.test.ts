import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  TASK_CONFIG_FILES,
  lockedDependencies,
  taskTools,
  needsDeploy,
  taskInputs,
  taskPackages,
} from '../../scripts/theme-agent-deploy.mjs';

const REPO = resolve(__dirname, '../..');

interface Esbuild {
  buildSync(options: Record<string, unknown>): {
    metafile: {
      inputs: Record<string, unknown>;
      outputs: Record<
        string,
        { imports: { path: string; external?: boolean }[] }
      >;
    };
  };
}

/** esbuild as Vite resolves it: the docs package has no direct dependency. */
function esbuild(): Esbuild {
  const fromVite = createRequire(createRequire(__filename).resolve('vite'));
  return fromVite('esbuild') as Esbuild;
}

/** esbuild's metafile for the task, every package left external. */
function taskMetafile() {
  const triggerDir = join(REPO, 'docs/trigger');
  const entryPoints = readdirSync(triggerDir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => join(triggerDir, file));
  const { metafile } = esbuild().buildSync({
    entryPoints,
    bundle: true,
    write: false,
    metafile: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outdir: join(REPO, 'docs/.esbuild-check'),
    absWorkingDir: REPO,
    logLevel: 'silent',
  });
  return metafile;
}

/** The source files esbuild bundles for the task, repository-relative. */
function bundledByEsbuild(): string[] {
  return Object.keys(taskMetafile().inputs)
    .map((input) => relative(REPO, resolve(REPO, input)))
    .sort();
}

/** The packages the bundle loads at runtime, by name, as esbuild leaves them. */
function externalPackages(): string[] {
  const names = new Set<string>();
  for (const output of Object.values(taskMetafile().outputs)) {
    for (const { path, external } of output.imports) {
      if (!external || path.startsWith('node:')) continue;
      const parts = path.split('/');
      names.add(path.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]);
    }
  }
  return [...names].sort();
}

describe('theme agent deploy: what the task bundles', () => {
  it("lists exactly the source files esbuild bundles, plus the task's config", () => {
    expect(taskInputs(REPO)).toEqual(
      [...bundledByEsbuild(), ...TASK_CONFIG_FILES].sort()
    );
  });

  it('includes the shared Studio modules, not only docs/trigger', () => {
    const inputs = taskInputs(REPO);
    expect(inputs).toContain(
      'docs/src/kigumi-studio/lib/property-definitions.ts'
    );
    expect(inputs).toContain('docs/src/kigumi-studio/theme-agent/contrast.ts');
  });
});

describe('theme agent deploy: the packages the task loads', () => {
  it('lists exactly the packages esbuild leaves external', () => {
    expect(taskPackages(REPO)).toEqual(externalPackages());
  });

  it('follows them through the lockfile to every package they pull in', () => {
    // Whatever versions the lockfile holds today: `ai` brings `zod` and the
    // AI Gateway provider, and nothing of the site's own tooling.
    const lock = readFileSync(join(REPO, 'docs/pnpm-lock.yaml'), 'utf8');
    const locked: string[] = lockedDependencies(lock, ['ai']);
    for (const name of ['ai', 'zod', '@ai-sdk/gateway']) {
      expect(locked.some((key) => key.startsWith(`${name}@`))).toBe(true);
    }
    expect(locked.some((key) => key.startsWith('vite@'))).toBe(false);
  });

  it("counts the trigger.dev CLI and what the task's config imports as tools", () => {
    expect(taskTools(REPO)).toEqual(['@trigger.dev/sdk', 'trigger.dev']);
  });
});

/** A lockfile in pnpm's shape: the task's `ai`, an unrelated `vite`, the CLI. */
function lockfile({
  provider = '4.0.33',
  vite = '7.3.1',
  cli = '4.7.7',
  importer = '.',
  patch = '',
} = {}): string {
  const ai = patch ? `7.0.150(patch_hash=${patch})` : '7.0.150';
  return `lockfileVersion: '9.0'

importers:

  ${importer}:
    dependencies:
      ai:
        specifier: 7.0.150
        version: ${ai}
      vite:
        specifier: ^7.3.0
        version: ${vite}
    devDependencies:
      trigger.dev:
        specifier: ${cli}
        version: ${cli}

snapshots:

  ai@${ai}:
    dependencies:
      '@ai-sdk/provider': ${provider}

  '@ai-sdk/provider@${provider}': {}

  vite@${vite}: {}

  trigger.dev@${cli}:
    dependencies:
      esbuild: 0.27.3

  esbuild@0.27.3: {}
`;
}

/** No changed file, `ai` loaded, the CLI as the tool; locks set per case. */
const dependencyChange = {
  changedFiles: ['docs/pnpm-lock.yaml'],
  inputs: [],
  packages: ['ai'],
  tools: ['trigger.dev'],
};

describe('theme agent deploy: a dependency change', () => {
  it('deploys when a package the task loads pulls in another version', () => {
    expect(
      needsDeploy({
        ...dependencyChange,
        baseLock: lockfile(),
        headLock: lockfile({ provider: '4.0.34' }),
      })
    ).toBe(true);
  });

  it('does not deploy for a package the task does not load', () => {
    expect(
      needsDeploy({
        ...dependencyChange,
        baseLock: lockfile(),
        headLock: lockfile({ vite: '7.3.2' }),
      })
    ).toBe(false);
  });

  it('deploys for a new trigger.dev CLI, which builds the task', () => {
    expect(
      needsDeploy({
        ...dependencyChange,
        baseLock: lockfile(),
        headLock: lockfile({ cli: '4.8.1' }),
      })
    ).toBe(true);
  });

  it('deploys for a patch on a package the task loads', () => {
    expect(
      needsDeploy({
        ...dependencyChange,
        baseLock: lockfile(),
        headLock: lockfile({ patch: 'abc123' }),
      })
    ).toBe(true);
  });

  it('deploys when the base has no lockfile to compare', () => {
    expect(
      needsDeploy({ ...dependencyChange, baseLock: null, headLock: lockfile() })
    ).toBe(true);
  });

  // Unsure is a deploy, never a pass that compared nothing (docs/adr/0003).
  it('deploys when a package the task loads is not in the lockfile', () => {
    expect(
      needsDeploy({
        ...dependencyChange,
        packages: ['ai', 'not-declared'],
        baseLock: lockfile(),
        headLock: lockfile(),
      })
    ).toBe(true);
  });

  it('deploys when the lockfile has no docs importer', () => {
    expect(
      needsDeploy({
        ...dependencyChange,
        baseLock: lockfile({ importer: 'docs' }),
        headLock: lockfile({ importer: 'docs' }),
      })
    ).toBe(true);
  });

  it('refuses a lockfile without the docs importer, even for no packages', () => {
    // On its own: with packages to look up, a missing one would refuse it too.
    expect(() =>
      lockedDependencies(lockfile({ importer: 'docs' }), [])
    ).toThrow('no docs importer');
  });

  it('deploys when a lockfile does not parse', () => {
    expect(
      needsDeploy({
        ...dependencyChange,
        baseLock: 'importers: [unclosed',
        headLock: lockfile(),
      })
    ).toBe(true);
  });
});

describe('theme agent deploy: whether Production needs one', () => {
  const unchangedLocks = {
    packages: ['ai'],
    tools: ['trigger.dev'],
    baseLock: lockfile(),
    headLock: lockfile(),
  };
  const inputs = [
    'docs/trigger/theme-agent.ts',
    'docs/src/kigumi-studio/lib/defaults.ts',
  ];

  it('deploys when a bundled file changed', () => {
    expect(
      needsDeploy({
        ...unchangedLocks,
        changedFiles: ['README.md', 'docs/src/kigumi-studio/lib/defaults.ts'],
        inputs,
      })
    ).toBe(true);
  });

  it('does not deploy when no bundled file changed', () => {
    expect(
      needsDeploy({
        ...unchangedLocks,
        changedFiles: [
          'README.md',
          'docs/src/kigumi-studio/components/StudioLayout.tsx',
        ],
        inputs,
      })
    ).toBe(false);
  });

  it('does not deploy for a test beside the task', () => {
    expect(
      needsDeploy({
        ...unchangedLocks,
        changedFiles: ['docs/trigger/theme-agent-turn.test.ts'],
        inputs,
      })
    ).toBe(false);
  });
});
