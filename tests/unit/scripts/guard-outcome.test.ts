/**
 * Tests for how the freshness guard reports its own coverage.
 *
 * Issue #43 stayed invisible for months because Check A printed
 * "Generated-artifact freshness check passed!" directly beneath the notice
 * saying it had skipped, and exited 0. A skip was typographically
 * indistinguishable from a pass, so nobody looking at a green job could tell
 * that the one check guarding generator drift had never run.
 */
import { describe, it, expect } from 'vitest';
import {
  summarizeGuard,
  skipPermitted,
  type GuardResult,
} from '../../../scripts/guard-outcome.js';

function guard(over: Partial<GuardResult> = {}): GuardResult {
  return {
    passed: true,
    findings: [],
    cem: {
      usable: true,
      outcome: 'complete',
      reason: 'pro manifest, 84 components',
    },
    ...over,
  };
}

/** How Check A labels itself, so these tests exercise its real wording. */
const CHECK_A = {
  label: 'Check A',
  passHeadline: 'Generated-artifact freshness check passed!',
} as const;

describe('summarizeGuard', () => {
  it('passes when Check A ran against a complete manifest and found nothing', () => {
    const summary = summarizeGuard(guard(), CHECK_A);

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(true);
    expect(summary.headline).toMatch(/passed/i);
  });

  it('fails when drift was found', () => {
    const summary = summarizeGuard(
      guard({
        passed: false,
        findings: [
          {
            check: 'A',
            component: 'templates/vue/Card/Card.css',
            message: 'committed template differs from freshly generated output',
          },
        ],
      })
    );

    expect(summary.exitCode).toBe(1);
    expect(summary.headline).toMatch(/drift/i);
  });

  it('never calls an unverified run a pass', () => {
    // The #43 defect: no manifest, so Check A could not run, yet the guard
    // printed "passed" and exited 0.
    const summary = summarizeGuard(
      guard({
        cem: {
          usable: false,
          outcome: 'absent',
          reason: 'no Custom Elements Manifest found',
        },
      }),
      CHECK_A
    );

    expect(summary.verified).toBe(false);
    expect(summary.headline).not.toMatch(/passed/i);
  });

  it('exits non-zero when the manifest is unusable and skipping was not permitted', () => {
    // On a branch that has the Pro token, an unusable manifest is a real
    // failure: something is wrong with the install, and staying silent would
    // recreate the always-skip.
    const summary = summarizeGuard(
      guard({
        cem: {
          usable: false,
          outcome: 'partial',
          reason: 'the free manifest describes 66 of 84 registry components',
        },
      }),
      { allowSkip: false }
    );

    expect(summary.exitCode).toBe(1);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toMatch(/66 of 84/);
  });

  it('exits zero but stays unverified when skipping is permitted', () => {
    // Fork pull requests receive no secrets, so the Pro package cannot be
    // installed. Skipping is the only option there, but it must still be
    // reported as unverified rather than as a pass.
    const summary = summarizeGuard(
      guard({
        cem: {
          usable: false,
          outcome: 'absent',
          reason: 'no Custom Elements Manifest found',
        },
      }),
      { allowSkip: true }
    );

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toMatch(/skip/i);
  });

  it('names the caller-supplied check in its could-not-run headline', () => {
    // The module is shared by two guards, so a headline saying "Check A" when
    // the prop-value half is what could not run would misdirect the reader.
    const summary = summarizeGuard(
      guard({
        cem: { usable: false, outcome: 'absent', reason: 'no manifest' },
      }),
      { label: 'Prop-value drift', allowSkip: false }
    );

    expect(summary.headline).toMatch(/^Prop-value drift could not run/);
    expect(summary.headline).not.toMatch(/Check A/);
  });

  it('never prints a bare pass headline for an unverified run', () => {
    // The invariant the module exists for, asserted against every outcome
    // rather than one example.
    for (const allowSkip of [true, false]) {
      const summary = summarizeGuard(
        guard({
          cem: { usable: false, outcome: 'absent', reason: 'no manifest' },
        }),
        { ...CHECK_A, allowSkip }
      );

      expect(summary.verified).toBe(false);
      expect(summary.headline).not.toBe(CHECK_A.passHeadline);
    }
  });
});

describe('skipPermitted', () => {
  it('permits skipping outside CI, where Pro may legitimately be absent', () => {
    expect(skipPermitted({})).toBe(true);
  });

  it('refuses to skip under CI', () => {
    // The #43 failure mode: tolerating an unusable manifest everywhere is what
    // let Check A skip on every CI run for months.
    expect(skipPermitted({ CI: 'true' })).toBe(false);
  });

  it('permits an explicitly opted-in skip under CI, for fork pull requests', () => {
    expect(
      skipPermitted({ CI: 'true', KIGUMI_FRESHNESS_ALLOW_SKIP: '1' })
    ).toBe(true);
  });

  it('treats any other opt-in value as not opting in', () => {
    expect(
      skipPermitted({ CI: 'true', KIGUMI_FRESHNESS_ALLOW_SKIP: '0' })
    ).toBe(false);
    expect(
      skipPermitted({ CI: 'true', KIGUMI_FRESHNESS_ALLOW_SKIP: 'true' })
    ).toBe(false);
  });
});
