/**
 * Tests for the unified CEM resolver.
 *
 * Built on real temp directory trees rather than `fs-extra` mocks. The defect
 * these cover is filesystem-shaped -- which roots get probed, whether `.git` is
 * present -- so mocking `pathExists` would encode the very assumption under
 * test and could not catch a wrong-root bug.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { resolveCem } from '../../../scripts/find-cem.js';

let tmp: string;

/** Minimal CEM carrying `count` tagged components. */
function cemWithComponents(count: number): unknown {
  return {
    schemaVersion: '1.0.0',
    modules: Array.from({ length: count }, (_, i) => ({
      kind: 'javascript-module',
      path: `dist/components/c${i}.js`,
      declarations: [
        { kind: 'class', name: `C${i}`, tagName: `wa-component-${i}` },
      ],
    })),
  };
}

/** Write a CEM for `pkg` under `root`'s node_modules. */
async function installCem(
  root: string,
  pkg: '@awesome.me/webawesome' | '@awesome.me/webawesome-pro',
  count: number
): Promise<string> {
  const file = path.join(
    root,
    'node_modules',
    pkg,
    'dist',
    'custom-elements.json'
  );
  await fs.outputJson(file, cemWithComponents(count));
  return file;
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'resolve-cem-'));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe('resolveCem', () => {
  it('finds the Pro CEM installed under docs/', async () => {
    const docsRoot = path.join(tmp, 'docs');
    const expected = await installCem(
      docsRoot,
      '@awesome.me/webawesome-pro',
      84
    );

    const result = await resolveCem(tmp);

    expect(result.found).toBe(true);
    expect(result.path).toBe(expected);
    expect(result.tier).toBe('pro');
    expect(result.componentCount).toBe(84);
  });

  it('finds the free CEM in the root tree when no Pro package is installed', async () => {
    // A plain `pnpm install --frozen-lockfile` at the repo root ships this
    // file. The pre-fix finder never looked here, which is why Check A skipped
    // on every CI run (issue #43).
    const expected = await installCem(tmp, '@awesome.me/webawesome', 66);

    const result = await resolveCem(tmp);

    expect(result.found).toBe(true);
    expect(result.path).toBe(expected);
    expect(result.tier).toBe('free');
    expect(result.componentCount).toBe(66);
  });

  it('prefers Pro over free when both are installed', async () => {
    await installCem(tmp, '@awesome.me/webawesome', 66);
    const pro = await installCem(
      path.join(tmp, 'docs'),
      '@awesome.me/webawesome-pro',
      84
    );

    const result = await resolveCem(tmp);

    expect(result.path).toBe(pro);
    expect(result.tier).toBe('pro');
  });

  it('reports not-found when nothing is installed', async () => {
    const result = await resolveCem(tmp);

    expect(result.found).toBe(false);
    expect(result.path).toBeNull();
  });

  it('does not escape to another checkout that has a CEM', async () => {
    // The regression that caused the third gap in #43: the skill-reference
    // generator walked up via `git rev-parse --git-common-dir` and silently
    // loaded the Pro CEM from the main checkout. Inside Check A's tmp copy
    // there is no `.git`, so that lookup threw, the catch swallowed it, and
    // the generator emitted 45% smaller output than it does locally.
    //
    // Resolution must depend only on the root it is given.
    // A CEM is planted at *every* ancestor of the worktree, so any upward walk
    // of any depth finds one. The only way to report not-found is to never
    // look outside the given root.
    const worktree = path.join(tmp, 'main', '.claude', 'worktrees', 'wt');
    await fs.ensureDir(worktree);

    for (
      let dir = path.dirname(worktree);
      dir.startsWith(tmp);
      dir = path.dirname(dir)
    ) {
      await installCem(dir, '@awesome.me/webawesome-pro', 84);
      await installCem(
        path.join(dir, 'docs'),
        '@awesome.me/webawesome-pro',
        84
      );
    }

    const result = await resolveCem(worktree);

    expect(result.found).toBe(false);
    expect(result.path).toBeNull();
  });
});
