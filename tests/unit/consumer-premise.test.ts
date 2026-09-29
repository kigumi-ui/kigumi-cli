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
 * CI has the token, so the e2e job only ever takes the run branch. These
 * assertions are what hold the other two.
 */

import { describe, it, expect } from 'vitest';
import { consumerPremise } from '../e2e/_helpers/consumer-premise.js';

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
