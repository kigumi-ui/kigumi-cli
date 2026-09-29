/**
 * The e2e job's half of the Pro consumer tsc exit policy (issue #79,
 * docs/adr/0003).
 *
 * The job decides where a missing Pro token may be skipped and hands that to
 * the Pro consumers as KIGUMI_FRESHNESS_ALLOW_SKIP; tests/unit/
 * consumer-premise.test.ts holds what they do with it. CI itself only ever
 * shows one branch of that decision per run, so this executes the step's own
 * shell with each context a run can bring. Matching the step's text would
 * pass whatever the shell decides.
 *
 * It also pins what keeps the token scoped: no step before the auth line may
 * see it, and only the Pro consumer step, with install scripts off, runs
 * after it.
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

const CHECK = stepIndex(
  (step) => step.id === 'pro',
  'Check Pro registry access'
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

const TOKEN_SECRET = 'secrets.WEBAWESOME_NPM_TOKEN';
const REPO = 'kigumi-ui/kigumi-cli';

interface RunContext {
  token: string;
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
      WA_TOKEN: context.token,
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
  token: '',
  event: 'pull_request',
  headRepo: REPO,
  actor: 'a-maintainer',
};

describe('e2e job: Check Pro registry access', () => {
  it('passes the context through untouched, so the shell alone decides', () => {
    expect(steps[CHECK].env).toEqual({
      WA_TOKEN: `\${{ ${TOKEN_SECRET} }}`,
      EVENT: '${{ github.event_name }}',
      HEAD_REPO: '${{ github.event.pull_request.head.repo.full_name }}',
      REPO: '${{ github.repository }}',
      ACTOR: '${{ github.actor }}',
    });
  });

  it('runs the Pro consumers wherever the token exists', () => {
    for (const context of [
      { ...SAME_REPO_PR, token: 'a-token' },
      { ...SAME_REPO_PR, token: 'a-token', headRepo: 'someone/fork' },
    ]) {
      expect(decide(context)).toEqual({ available: 'true' });
    }
  });

  it('permits the skip on a fork pull request, which receives no secrets', () => {
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

  it('permits nothing on a same-repo pull request without the token', () => {
    expect(decide(SAME_REPO_PR)).toEqual({});
  });

  it('permits nothing on any other event, whose head repository is empty', () => {
    for (const event of ['push', 'workflow_dispatch', 'schedule']) {
      expect(decide({ ...SAME_REPO_PR, event, headRepo: '' })).toEqual({});
    }
  });
});

describe('e2e job: token scope', () => {
  it('writes the auth line only when the token exists', () => {
    expect(steps[AUTH].if).toBe("steps.pro.outputs.available == 'true'");
  });

  it('runs every other suite before the token reaches the runner', () => {
    expect(FREE_RUN).toBeLessThan(CHECK);
    expect(CHECK).toBeLessThan(AUTH);
    expect(AUTH).toBeLessThan(PRO_RUN);
    expect(steps[FREE_RUN].env).toEqual({ KIGUMI_CONSUMER_TIER: 'free' });
    expect(steps[FREE_RUN].run).toBe('pnpm run test:e2e');
  });

  it('gives the token to the check and the auth line alone', () => {
    const seeing = steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => JSON.stringify(step).includes(TOKEN_SECRET))
      .map(({ index }) => index);
    expect(seeing).toEqual([CHECK, AUTH]);
  });

  it('runs only the Pro consumers after it, with install scripts off', () => {
    expect(PRO_RUN).toBe(steps.length - 1);
    expect(steps[PRO_RUN].env).toEqual({
      KIGUMI_CONSUMER_TIER: 'pro',
      KIGUMI_FRESHNESS_ALLOW_SKIP: '${{ steps.pro.outputs.allow_skip }}',
      npm_config_ignore_scripts: 'true',
    });
    expect(steps[PRO_RUN].run).toBe(
      'pnpm exec vitest run --config vitest.e2e.config.ts tests/e2e/consumer-tsc-'
    );
  });
});
