/**
 * Whether a consumer tsc suite may run, and what it reports when it may not
 * (issue #79).
 *
 * The Pro consumer needs the Pro package, and only a Web Awesome Pro token
 * installs it. Without one the suite reports "did not run" in the
 * guard-outcome vocabulary of docs/adr/0003: skipped where a missing token is
 * legitimate (a local Free machine, a fork pull request), failed everywhere
 * else, and never a pass.
 *
 * CI's e2e job takes the run branch on this repository's pull requests and
 * the skip branch on fork and Dependabot ones; the could-not-run branch only
 * runs when something is broken. These assertions hold all three on every
 * run, and `reportNotRun` is what turns the last two into a skip or a failure.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  consumerPremise,
  reportNotRun,
} from '../e2e/_helpers/consumer-premise.js';

const LABEL = 'Pro consumer tsc: React';
const TOKEN = 'a'.repeat(32);

const LOCAL: NodeJS.ProcessEnv = {};
const CI: NodeJS.ProcessEnv = { CI: 'true' };
const CI_SKIP_ALLOWED: NodeJS.ProcessEnv = {
  CI: 'true',
  KIGUMI_FRESHNESS_ALLOW_SKIP: '1',
};

function unrun(env: NodeJS.ProcessEnv) {
  const premise = consumerPremise('pro', { label: LABEL, token: null, env });
  if (premise.run) {
    throw new Error('expected the tokenless Pro consumer not to run');
  }
  return premise.summary;
}

describe('consumerPremise', () => {
  it('runs the Free consumer, which needs no token, even in CI', () => {
    expect(
      consumerPremise('free', { label: LABEL, token: null, env: CI })
    ).toEqual({ run: true });
  });

  it('runs the Pro consumer when init would find a token', () => {
    for (const env of [LOCAL, CI, CI_SKIP_ALLOWED]) {
      expect(
        consumerPremise('pro', { label: LABEL, token: TOKEN, env })
      ).toEqual({ run: true });
    }
  });

  it('skips a tokenless Pro consumer on a local machine, NOT verified', () => {
    const summary = unrun(LOCAL);

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toBe(
      `${LABEL} skipped, NOT verified: no Web Awesome Pro token, so the Pro package cannot be installed`
    );
  });

  it('fails a tokenless Pro consumer in CI, naming how to give it one', () => {
    const summary = unrun(CI);

    expect(summary.exitCode).toBe(1);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toBe(
      `${LABEL} could not run: no Web Awesome Pro token, so the Pro package cannot be installed`
    );
    expect(summary.detail).toContain(
      'npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken'
    );
  });

  it('skips a tokenless Pro consumer where CI permits it (fork pull requests)', () => {
    const summary = unrun(CI_SKIP_ALLOWED);

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toContain('skipped, NOT verified');
    expect(summary.detail).toContain('fork pull requests');
  });

  it('never reports a tokenless Pro consumer as a pass', () => {
    for (const env of [LOCAL, CI, CI_SKIP_ALLOWED]) {
      const summary = unrun(env);
      expect(summary.verified).toBe(false);
      expect(summary.headline).not.toMatch(/pass/i);
    }
  });
});

describe('reportNotRun', () => {
  const SKIPPED = new Error('skip called');

  function skipSpy() {
    const notes: string[] = [];
    const skip = (note: string): never => {
      notes.push(note);
      throw SKIPPED;
    };
    return { notes, skip };
  }

  it('skips with the headline where the skip is permitted', () => {
    const summary = unrun(LOCAL);
    const { notes, skip } = skipSpy();
    const printed = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => reportNotRun(summary, skip)).toThrow(SKIPPED);
    expect(notes).toEqual([summary.headline]);
    expect(printed).toHaveBeenCalledWith(
      `${summary.headline}\n${summary.detail}`
    );
    printed.mockRestore();
  });

  it('fails with the headline and the fix where it is not, never skipping', () => {
    const summary = unrun(CI);
    const { notes, skip } = skipSpy();

    expect(() => reportNotRun(summary, skip)).toThrow(
      `${summary.headline}\n${summary.detail}`
    );
    expect(notes).toEqual([]);
  });
});
