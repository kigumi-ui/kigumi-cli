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
  type GuardResult,
} from '../../../scripts/check-generated-fresh.js';

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

describe('summarizeGuard', () => {
  it('passes when Check A ran against a complete manifest and found nothing', () => {
    const summary = summarizeGuard(guard());

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
      })
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
});
