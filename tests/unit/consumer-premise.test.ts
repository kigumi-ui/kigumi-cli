/**
 * Whether the Pro consumer tsc suite can run, and what it reports when it
 * cannot (issue #79).
 *
 * The Pro consumer needs the pinned Pro package. `resolveProPackage` reports
 * whether this machine can get it (a token `init` would find, and a registry
 * that serves the package with this machine's auth); `consumerPremise` turns
 * that verdict into run, skip or fail in the guard-outcome vocabulary of
 * docs/adr/0003; `reportNotRun` settles a consumer that did not run. A skip is
 * permitted only where a missing package is legitimate (a local machine, a
 * fork or Dependabot pull request), and nothing here is ever a pass.
 *
 * These are the only assertions on the skip and fail branches: CI's e2e job
 * has the token on this repository's pull requests, so there the Pro
 * consumer runs. tests/unit/ci-e2e-pro-step.test.ts holds the job's side.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  consumerPremise,
  reportNotRun,
  resolveProPackage,
  type ProPackageProbe,
} from '../e2e/_helpers/consumer-premise.js';
import type { CemVerdict } from '../../scripts/find-cem.js';

const LABEL = 'Pro consumer tsc: React';
const TOKEN = 'a'.repeat(32);

const LOCAL: NodeJS.ProcessEnv = {};
const CI: NodeJS.ProcessEnv = { CI: 'true' };
const CI_SKIP_ALLOWED: NodeJS.ProcessEnv = {
  CI: 'true',
  KIGUMI_FRESHNESS_ALLOW_SKIP: '1',
};
// What the e2e job's step sets on this repository's pull requests: the
// variable is present but empty, which must mean the same as absent.
const CI_SKIP_EMPTY: NodeJS.ProcessEnv = {
  CI: 'true',
  KIGUMI_FRESHNESS_ALLOW_SKIP: '',
};

const NO_TOKEN = resolveProPackage({
  token: null,
  probe: () => {
    throw new Error('probed without a token');
  },
});

function notRunSummary(verdict: CemVerdict, env: NodeJS.ProcessEnv) {
  const premise = consumerPremise(verdict, { label: LABEL, env });
  if (premise.run) {
    throw new Error('expected the Pro consumer not to run');
  }
  return premise.summary;
}

describe('resolveProPackage', () => {
  it('reports the package absent without a token, and never probes', () => {
    expect(NO_TOKEN).toEqual({
      usable: false,
      outcome: 'absent',
      reason: 'no Web Awesome Pro token, so `init` would install Free',
    });
  });

  it('reports the package absent when the registry does not serve it here', () => {
    const probe = vi.fn<() => ProPackageProbe>(() => ({
      ok: false,
      detail: 'npm view: E401',
    }));

    expect(resolveProPackage({ token: TOKEN, probe })).toEqual({
      usable: false,
      outcome: 'absent',
      reason:
        'the registry does not serve the pinned Pro package to this machine (npm view: E401)',
    });
    expect(probe).toHaveBeenCalledOnce();
  });

  it('reports the package usable when a token exists and the registry serves it', () => {
    expect(
      resolveProPackage({
        token: TOKEN,
        probe: () => ({ ok: true, detail: '3.14.0' }),
      })
    ).toEqual({
      usable: true,
      outcome: 'complete',
      reason: 'pinned Pro package (3.14.0)',
    });
  });
});

describe('consumerPremise', () => {
  const USABLE: CemVerdict = {
    usable: true,
    outcome: 'complete',
    reason: 'pinned Pro package (3.14.0)',
  };

  it('runs when the Pro package is usable, whatever the environment', () => {
    for (const env of [LOCAL, CI, CI_SKIP_ALLOWED, CI_SKIP_EMPTY]) {
      expect(consumerPremise(USABLE, { label: LABEL, env })).toEqual({
        run: true,
      });
    }
  });

  it('skips on a local machine, NOT verified', () => {
    const summary = notRunSummary(NO_TOKEN, LOCAL);

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toBe(
      `${LABEL} skipped, NOT verified: no Web Awesome Pro token, so \`init\` would install Free`
    );
  });

  it('fails in CI, naming how to give the machine a token', () => {
    const summary = notRunSummary(NO_TOKEN, CI);

    expect(summary.exitCode).toBe(1);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toBe(
      `${LABEL} could not run: no Web Awesome Pro token, so \`init\` would install Free`
    );
    expect(summary.detail).toContain(
      'npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken'
    );
  });

  it('fails in CI when the skip variable is set but empty', () => {
    expect(notRunSummary(NO_TOKEN, CI_SKIP_EMPTY).exitCode).toBe(1);
  });

  it('skips where CI permits it (fork and Dependabot pull requests)', () => {
    const summary = notRunSummary(NO_TOKEN, CI_SKIP_ALLOWED);

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toContain('skipped, NOT verified');
    expect(summary.detail).toContain('fork and Dependabot pull requests');
  });

  it('never reports a Pro consumer that did not run as a pass', () => {
    for (const env of [LOCAL, CI, CI_SKIP_ALLOWED, CI_SKIP_EMPTY]) {
      const summary = notRunSummary(NO_TOKEN, env);
      expect(summary.verified).toBe(false);
      expect(summary.headline).not.toMatch(/pass/i);
    }
  });
});

describe('reportNotRun', () => {
  const SKIPPED = new Error('skip called');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function skipSpy() {
    const notes: string[] = [];
    const skip = (note: string): never => {
      notes.push(note);
      throw SKIPPED;
    };
    return { notes, skip };
  }

  it('skips with the headline where the skip is permitted', () => {
    const summary = notRunSummary(NO_TOKEN, LOCAL);
    const { notes, skip } = skipSpy();
    const printed = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => reportNotRun(summary, skip)).toThrow(SKIPPED);
    expect(notes).toEqual([summary.headline]);
    expect(printed).toHaveBeenCalledWith(
      `${summary.headline}\n${summary.detail}`
    );
  });

  it('fails with the headline and the fix where it is not, never skipping', () => {
    const summary = notRunSummary(NO_TOKEN, CI);
    const { notes, skip } = skipSpy();

    expect(() => reportNotRun(summary, skip)).toThrow(
      `${summary.headline}\n${summary.detail}`
    );
    expect(notes).toEqual([]);
  });
});
