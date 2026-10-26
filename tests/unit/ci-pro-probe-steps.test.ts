/**
 * The Pro probe in every job that installs docs/ (docs/adr/0003).
 *
 * These jobs install Web Awesome Pro from the organization copy on GitHub
 * Packages. A probe step reads it with the GITHUB_TOKEN; the check step after
 * it decides. Unreadable is a skip only on a fork or Dependabot pull request,
 * which cannot read the package. Anywhere else the package's Actions access is
 * broken, and a skip there would report green after verifying nothing, which
 * is how a missing access grant hid on every job of the first run.
 *
 * CI only ever shows one branch per run, so this executes each check step's
 * own shell with every context a run can bring. The e2e job has its own
 * policy, held by ci-e2e-pro-step.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'yaml';

interface Step {
  name?: string;
  id?: string;
  if?: string;
  'continue-on-error'?: boolean;
  env?: Record<string, string>;
  run?: string;
  uses?: string;
}

interface Workflow {
  jobs: Record<string, { steps: Step[] }>;
}

function readWorkflow(file: string): Workflow {
  return parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../.github/workflows', file),
      'utf8'
    )
  ) as Workflow;
}

const ci = readWorkflow('ci.yml');
const warm = readWorkflow('cache-warm.yml');

const JOBS: ReadonlyArray<{ label: string; steps: Step[] }> = [
  { label: 'ci.yml freshness', steps: ci.jobs.freshness!.steps },
  { label: 'ci.yml docs-typecheck', steps: ci.jobs['docs-typecheck']!.steps },
  {
    label: 'ci.yml story-interactions',
    steps: ci.jobs['story-interactions']!.steps,
  },
  { label: 'ci.yml chromatic', steps: ci.jobs.chromatic!.steps },
  { label: 'cache-warm.yml playwright', steps: warm.jobs.playwright!.steps },
];

const REPO = 'kigumi-ui/kigumi-cli';

interface RunContext {
  /** `steps.probe.outcome`: success, failure or skipped. */
  probed: string;
  event: string;
  headRepo: string;
  actor: string;
  chromaticToken?: string;
}

const SAME_REPO_PR: RunContext = {
  probed: 'failure',
  event: 'pull_request',
  headRepo: REPO,
  actor: 'a-maintainer',
  chromaticToken: 'a-chromatic-token',
};

function find(steps: Step[], id: string, label: string): Step {
  const step = steps.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`${label} has no step with id ${id}`);
  return step;
}

/** Run a check step's shell as Actions does: its exit code and outputs. */
function decide(
  check: Step,
  context: RunContext
): { status: number | null; outputs: Record<string, string> } {
  if (!check.run) throw new Error('the check step has no run script');
  const outputFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'kigumi-ci-')),
    'output'
  );
  fs.writeFileSync(outputFile, '');

  const result = spawnSync('bash', ['-e', '-c', check.run], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      GITHUB_OUTPUT: outputFile,
      PROBED: context.probed,
      EVENT: context.event,
      HEAD_REPO: context.headRepo,
      REPO,
      ACTOR: context.actor,
      CHROMATIC_TOKEN: context.chromaticToken ?? '',
    },
  });

  const outputs: Record<string, string> = {};
  for (const line of fs.readFileSync(outputFile, 'utf8').split('\n')) {
    const at = line.indexOf('=');
    if (at > 0) outputs[line.slice(0, at)] = line.slice(at + 1);
  }
  return { status: result.status, outputs };
}

describe.each(JOBS)('$label: Pro probe', ({ label, steps }) => {
  const probe = find(steps, 'probe', label);
  const check = find(steps, 'pro', label);

  it('probes with the GITHUB_TOKEN and hands the outcome to the check', () => {
    expect(probe['continue-on-error']).toBe(true);
    expect(probe.env?.GITHUB_PACKAGES_TOKEN).toBe(
      '${{ secrets.GITHUB_TOKEN }}'
    );
    expect(probe.run).toBe('node scripts/setup-npmrc.mjs --probe');
    expect(check.env?.PROBED).toBe('${{ steps.probe.outcome }}');
    expect(steps.indexOf(probe)).toBeLessThan(steps.indexOf(check));
  });

  it('gives the GitHub token to the probe alone', () => {
    const seeing = steps.filter((step) =>
      JSON.stringify(step).includes('secrets.GITHUB_TOKEN')
    );
    expect(seeing).toEqual([probe]);
  });

  it('marks Pro available when the probe read the package', () => {
    expect(decide(check, { ...SAME_REPO_PR, probed: 'success' })).toEqual({
      status: 0,
      outputs: { available: 'true' },
    });
  });

  it('skips on a fork or Dependabot pull request that cannot read it', () => {
    for (const context of [
      { ...SAME_REPO_PR, headRepo: 'someone/fork' },
      { ...SAME_REPO_PR, headRepo: '' },
      { ...SAME_REPO_PR, actor: 'dependabot[bot]' },
    ]) {
      expect(decide(check, context)).toEqual({
        status: 0,
        outputs: { available: 'false' },
      });
    }
  });

  it('fails a same-repo pull request that cannot read it', () => {
    expect(decide(check, SAME_REPO_PR).status).not.toBe(0);
    expect(
      decide(check, { ...SAME_REPO_PR, probed: 'skipped' }).status
    ).not.toBe(0);
  });

  it('fails any other event that cannot read it', () => {
    for (const event of ['push', 'workflow_dispatch', 'schedule']) {
      expect(
        decide(check, { ...SAME_REPO_PR, event, headRepo: '' }).status
      ).not.toBe(0);
    }
  });

  it('installs only when Pro is available', () => {
    const installs = steps.filter((step) =>
      step.run?.includes('pnpm install --frozen-lockfile')
    );
    expect(installs.length).toBeGreaterThan(0);
    for (const step of installs) {
      expect(step.if).toContain("steps.pro.outputs.available == 'true'");
    }
  });
});

describe('chromatic: the Chromatic token', () => {
  const check = find(ci.jobs.chromatic!.steps, 'pro', 'chromatic');

  it('skips, never fails, when only the Chromatic token is missing', () => {
    expect(
      decide(check, {
        ...SAME_REPO_PR,
        probed: 'success',
        chromaticToken: '',
      })
    ).toEqual({ status: 0, outputs: { available: 'false' } });
  });
});
