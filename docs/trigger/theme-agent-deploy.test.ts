import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  TASK_CONFIG_FILES,
  TASK_TOOL_PACKAGES,
  lockedDependencies,
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
    const lock = readFileSync(join(REPO, 'docs/pnpm-lock.yaml'), 'utf8');
    const locked = lockedDependencies(lock, ['ai']);
    expect(locked).toContain('ai@7.0.150(zod@4.5.4)');
    expect(locked).toContain('zod@4.5.4');
    expect(
      locked.some((key: string) => key.startsWith('@ai-sdk/gateway@'))
    ).toBe(true);
    expect(locked.some((key: string) => key.startsWith('vite@'))).toBe(false);
  });
});

/** A lockfile in pnpm's shape: the task's `ai`, an unrelated `vite`, the CLI. */
function lockfile({
  provider = '4.0.33',
  vite = '7.3.1',
  cli = '4.7.7',
} = {}): string {
  return `lockfileVersion: '9.0'

importers:

  .:
    dependencies:
      ai:
        specifier: 7.0.150
        version: 7.0.150
      vite:
        specifier: ^7.3.0
        version: ${vite}
    devDependencies:
      trigger.dev:
        specifier: ${cli}
        version: ${cli}

snapshots:

  ai@7.0.150:
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

describe('theme agent deploy: a dependency change', () => {
  const unchanged = { changedFiles: ['docs/pnpm-lock.yaml'], inputs: [] };
  const packages = ['ai', ...TASK_TOOL_PACKAGES];

  it('deploys when a package the task loads pulls in another version', () => {
    expect(
      needsDeploy({
        ...unchanged,
        packages,
        baseLock: lockfile(),
        headLock: lockfile({ provider: '4.0.34' }),
      })
    ).toBe(true);
  });

  it('does not deploy for a package the task does not load', () => {
    expect(
      needsDeploy({
        ...unchanged,
        packages,
        baseLock: lockfile(),
        headLock: lockfile({ vite: '7.3.2' }),
      })
    ).toBe(false);
  });

  it('deploys for a new trigger.dev CLI, which builds the task', () => {
    expect(
      needsDeploy({
        ...unchanged,
        packages,
        baseLock: lockfile(),
        headLock: lockfile({ cli: '4.8.1' }),
      })
    ).toBe(true);
  });

  it('deploys when the base has no lockfile to compare', () => {
    expect(
      needsDeploy({
        ...unchanged,
        packages,
        baseLock: null,
        headLock: lockfile(),
      })
    ).toBe(true);
  });
});

describe('theme agent deploy: whether Production needs one', () => {
  const inputs = [
    'docs/trigger/theme-agent.ts',
    'docs/src/kigumi-studio/lib/defaults.ts',
  ];

  it('deploys when a bundled file changed', () => {
    expect(
      needsDeploy({
        changedFiles: ['README.md', 'docs/src/kigumi-studio/lib/defaults.ts'],
        inputs,
      })
    ).toBe(true);
  });

  it('does not deploy when no bundled file changed', () => {
    expect(
      needsDeploy({
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
        changedFiles: ['docs/trigger/theme-agent-turn.test.ts'],
        inputs,
      })
    ).toBe(false);
  });
});
