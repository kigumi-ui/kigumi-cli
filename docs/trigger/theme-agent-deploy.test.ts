import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  TASK_CONFIG_FILES,
  needsDeploy,
  taskInputs,
} from '../../scripts/theme-agent-deploy.mjs';

const REPO = resolve(__dirname, '../..');

interface Esbuild {
  buildSync(options: Record<string, unknown>): {
    metafile: { inputs: Record<string, unknown> };
  };
}

/** esbuild as Vite resolves it: the docs package has no direct dependency. */
function esbuild(): Esbuild {
  const fromVite = createRequire(createRequire(__filename).resolve('vite'));
  return fromVite('esbuild') as Esbuild;
}

/** The source files esbuild bundles for the task, repository-relative. */
function bundledByEsbuild(): string[] {
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
  return Object.keys(metafile.inputs)
    .map((input) => relative(REPO, resolve(REPO, input)))
    .sort();
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

describe('theme agent deploy: whether Production needs one', () => {
  const inputs = [
    'docs/trigger/theme-agent.ts',
    'docs/src/kigumi-studio/lib/defaults.ts',
  ];

  it('deploys when a bundled file changed', () => {
    expect(
      needsDeploy(
        ['README.md', 'docs/src/kigumi-studio/lib/defaults.ts'],
        inputs
      )
    ).toBe(true);
  });

  it('does not deploy when no bundled file changed', () => {
    expect(
      needsDeploy(
        ['README.md', 'docs/src/kigumi-studio/components/StudioLayout.tsx'],
        inputs
      )
    ).toBe(false);
  });

  it('does not deploy for a test beside the task', () => {
    expect(needsDeploy(['docs/trigger/theme-agent-turn.test.ts'], inputs)).toBe(
      false
    );
  });
});
