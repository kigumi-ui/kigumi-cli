/**
 * Regression test for issue #43.
 *
 * A generator whose output changed without its templates being regenerated
 * used to reach main with green CI: all eleven validators passed, 1716 unit
 * tests passed, and the five path-filtered jobs never ran because a
 * `scripts/`-only changeset matches none of ci.yml's filters.
 *
 * The guard that should have caught it, `validate:generated-fresh` Check A,
 * resolved its manifest through a probe that looked only in docs/node_modules
 * and only for the Pro package, so it found nothing on every CI run and
 * printed "freshness check passed!" beneath its own skip notice.
 *
 * This test pins the behaviour that closes that hole: with a complete manifest
 * available, drifting a generator without regenerating templates must make the
 * guard exit non-zero.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCem } from '../../scripts/find-cem.js';
import { getAllComponents } from '../../src/utils/registry.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const GENERATOR = path.join(PROJECT_ROOT, 'scripts/generator-utils.ts');

/**
 * The guard needs a manifest describing every registry component, which only
 * the Web Awesome Pro package provides. Fork pull requests receive no secrets
 * and fresh clones have no install, so the test cannot run everywhere.
 *
 * The skip is announced rather than silent: an unexplained absence is the
 * failure mode this whole issue is about.
 */
let cemAvailable = false;
let skipReason = '';

beforeAll(async () => {
  const resolution = await resolveCem(PROJECT_ROOT);
  const registrySize = Object.keys(getAllComponents()).length;

  if (!resolution.found) {
    skipReason = 'no Custom Elements Manifest installed';
  } else if (resolution.componentCount < registrySize) {
    skipReason =
      `only the ${resolution.tier} manifest is installed ` +
      `(${resolution.componentCount} of ${registrySize} components)`;
  } else {
    cemAvailable = true;
  }

  if (!cemAvailable) {
    console.error(
      `\n  [#43 regression] SKIPPED, generator drift is NOT verified here: ${skipReason}.\n` +
        '  Run `pnpm setup:npmrc` then `pnpm install` in docs/ to enable it.\n'
    );
  }
});

/** Run the freshness guard, returning its exit code. */
function runFreshnessGuard(): number {
  try {
    execFileSync('pnpm', ['run', 'validate:generated-fresh'], {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      env: { ...process.env, CI: 'true' },
    });
    return 0;
  } catch (error) {
    return (error as { status?: number }).status ?? 1;
  }
}

describe('generator drift cannot pass the freshness guard (#43)', () => {
  // `ctx.skip()` marks the test skipped in the runner's own tally. An earlier
  // version returned early after a trivial assertion instead, which reported a
  // PASS while verifying nothing -- a skip wearing a pass's clothes, which is
  // the exact defect this test exists to prevent. Caught by sabotage: with the
  // fix reverted and the manifest hidden, that version still went green.
  it('exits non-zero when a generator drifts and templates are not regenerated', async (ctx) => {
    if (!cemAvailable) {
      ctx.skip(`#43 regression not verified: ${skipReason}`);
      return;
    }

    const pristine = await fs.readFile(GENERATOR, 'utf-8');

    // Assert the premise before the conclusion: a guard run that was already
    // failing would "prove" the point without the drift.
    expect(runFreshnessGuard()).toBe(0);

    // Drift the shared CSS emitter's custom-property branch (issue #30 moved
    // it out of generate-vue-templates.ts). Button still has zero custom
    // properties, so this branch stays unreachable from the unit snapshots --
    // which is why the original drift went unnoticed.
    const drifted = pristine.replace(
      ' * - ${prop.name}',
      ' * - DRIFT43 ${prop.name}'
    );
    expect(drifted).not.toBe(pristine);

    try {
      await fs.writeFile(GENERATOR, drifted);
      expect(runFreshnessGuard()).toBe(1);
    } finally {
      await fs.writeFile(GENERATOR, pristine);
    }

    // The tree must be exactly as it was, or a later test inherits the drift.
    expect(await fs.readFile(GENERATOR, 'utf-8')).toBe(pristine);
    expect(runFreshnessGuard()).toBe(0);
  }, 300_000);
});
