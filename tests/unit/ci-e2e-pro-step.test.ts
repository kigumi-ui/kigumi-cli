/**
 * The e2e job's half of the Pro consumer tsc exit policy (issue #79,
 * docs/adr/0003).
 *
 * The job fetches the organization's copy of Web Awesome Pro, serves it from
 * a local registry, and runs the Pro consumers against that registry. It
 * decides where a failed fetch may be skipped and hands that to the Pro
 * consumers as KIGUMI_FRESHNESS_ALLOW_SKIP; tests/unit/
 * consumer-premise.test.ts holds what they do with it. CI itself only ever
 * shows one branch of that decision per run, so this executes the step's own
 * shell with each context a run can bring. Matching the step's text would
 * pass whatever the shell decides.
 *
 * It also pins what keeps the credentials scoped: the GitHub token reaches
 * the fetch alone, every other suite runs before it, the local registry's
 * token reaches the auth line alone, and only the Pro consumer step, with
 * install scripts off, runs after that.
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
}

const CI_PATH = path.resolve(__dirname, '../../.github/workflows/ci.yml');
const workflow = parse(fs.readFileSync(CI_PATH, 'utf8')) as {
  jobs: { e2e: { steps: Step[] } };
};
const steps = workflow.jobs.e2e.steps;

function stepIndex(match: (step: Step) => boolean, what: string): number {
  const index = steps.findIndex(match);
  if (index === -1) {
    throw new Error(`the e2e job has no ${what} step`);
  }
  return index;
}

const FETCH = stepIndex((step) => step.id === 'fetch', 'Fetch Web Awesome Pro');
const CHECK = stepIndex(
  (step) => step.id === 'pro',
  'Check Pro registry access'
);
const SERVE = stepIndex(
  (step) => step.id === 'registry',
  'Serve Web Awesome Pro locally'
);
const AUTH = stepIndex(
  (step) => step.name === 'Configure Pro registry auth',
  'Configure Pro registry auth'
);
const FREE_RUN = stepIndex((step) => step.name === 'E2E tests', 'E2E tests');
const PRO_RUN = stepIndex(
  (step) => step.name === 'E2E tests (Pro consumer tsc)',
  'E2E tests (Pro consumer tsc)'
);

const PACKAGES_SECRET = 'secrets.GITHUB_TOKEN';
const REGISTRY_TOKEN = 'steps.registry.outputs.token';
const REPO = 'kigumi-ui/kigumi-cli';

interface RunContext {
  /** `steps.fetch.outcome`: success, failure or skipped. */
  fetched: string;
  event: string;
  headRepo: string;
  actor: string;
}

/** Run the check step's shell as Actions does, and read what it output. */
function decide(context: RunContext): Record<string, string> {
  const script = steps[CHECK].run;
  if (!script) {
    throw new Error('the Check Pro registry access step has no run script');
  }
  const outputFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'kigumi-ci-')),
    'output'
  );
  fs.writeFileSync(outputFile, '');

  const result = spawnSync('bash', ['-e', '-c', script], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      GITHUB_OUTPUT: outputFile,
      FETCHED: context.fetched,
      EVENT: context.event,
      HEAD_REPO: context.headRepo,
      REPO,
      ACTOR: context.actor,
    },
  });
  expect(result.status, result.stderr).toBe(0);

  const outputs: Record<string, string> = {};
  for (const line of fs.readFileSync(outputFile, 'utf8').split('\n')) {
    const at = line.indexOf('=');
    if (at > 0) {
      outputs[line.slice(0, at)] = line.slice(at + 1);
    }
  }
  return outputs;
}

const SAME_REPO_PR: RunContext = {
  fetched: 'failure',
  event: 'pull_request',
  headRepo: REPO,
  actor: 'a-maintainer',
};

describe('e2e job: Check Pro registry access', () => {
  it('passes the context through untouched, so the shell alone decides', () => {
    expect(steps[CHECK].env).toEqual({
      FETCHED: '${{ steps.fetch.outcome }}',
      EVENT: '${{ github.event_name }}',
      HEAD_REPO: '${{ github.event.pull_request.head.repo.full_name }}',
      REPO: '${{ github.repository }}',
      ACTOR: '${{ github.actor }}',
    });
  });

  it('runs the Pro consumers wherever the package was fetched', () => {
    for (const context of [
      { ...SAME_REPO_PR, fetched: 'success' },
      { ...SAME_REPO_PR, fetched: 'success', headRepo: 'someone/fork' },
    ]) {
      expect(decide(context)).toEqual({ available: 'true' });
    }
  });

  it('permits the skip on a fork pull request, which cannot read the package', () => {
    expect(decide({ ...SAME_REPO_PR, headRepo: 'someone/fork' })).toEqual({
      allow_skip: '1',
    });
    // A pull request whose fork was deleted has no head repository.
    expect(decide({ ...SAME_REPO_PR, headRepo: '' })).toEqual({
      allow_skip: '1',
    });
  });

  it('permits the skip on a Dependabot pull request', () => {
    expect(decide({ ...SAME_REPO_PR, actor: 'dependabot[bot]' })).toEqual({
      allow_skip: '1',
    });
  });

  it('permits nothing on a same-repo pull request whose fetch failed', () => {
    expect(decide(SAME_REPO_PR)).toEqual({});
    expect(decide({ ...SAME_REPO_PR, fetched: 'skipped' })).toEqual({});
  });

  it('permits nothing on any other event, whose head repository is empty', () => {
    for (const event of ['push', 'workflow_dispatch', 'schedule']) {
      expect(decide({ ...SAME_REPO_PR, event, headRepo: '' })).toEqual({});
    }
  });
});

describe('e2e job: fetch', () => {
  it('lets a failed fetch reach the check instead of failing the job', () => {
    expect(steps[FETCH]['continue-on-error']).toBe(true);
  });
});

describe('e2e job: credential scope', () => {
  it('serves and authenticates only when the package was fetched', () => {
    expect(steps[SERVE].if).toBe("steps.pro.outputs.available == 'true'");
    expect(steps[AUTH].if).toBe("steps.pro.outputs.available == 'true'");
  });

  it('runs every other suite before any credential reaches the runner', () => {
    expect(FREE_RUN).toBeLessThan(FETCH);
    expect(FETCH).toBeLessThan(CHECK);
    expect(CHECK).toBeLessThan(SERVE);
    expect(SERVE).toBeLessThan(AUTH);
    expect(AUTH).toBeLessThan(PRO_RUN);
    expect(steps[FREE_RUN].env).toEqual({ KIGUMI_CONSUMER_TIER: 'free' });
    expect(steps[FREE_RUN].run).toBe('pnpm run test:e2e');
  });

  it('gives the GitHub token to the fetch alone', () => {
    expect(stepsSeeing(PACKAGES_SECRET)).toEqual([FETCH]);
  });

  it("gives the local registry's token to the auth line alone", () => {
    expect(stepsSeeing(REGISTRY_TOKEN)).toEqual([AUTH]);
  });

  it('runs only the Pro consumers after it, with install scripts off', () => {
    expect(PRO_RUN).toBe(steps.length - 1);
    expect(steps[PRO_RUN].env).toEqual({
      KIGUMI_CONSUMER_TIER: 'pro',
      KIGUMI_FRESHNESS_ALLOW_SKIP: '${{ steps.pro.outputs.allow_skip }}',
      KIGUMI_PRO_REGISTRY: '${{ steps.registry.outputs.registry }}',
      npm_config_ignore_scripts: 'true',
    });
    expect(steps[PRO_RUN].run).toBe(
      'pnpm exec vitest run --config vitest.e2e.config.ts tests/e2e/consumer-tsc-'
    );
  });
});

function stepsSeeing(expression: string): number[] {
  return steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => JSON.stringify(step).includes(expression))
    .map(({ index }) => index);
}
