/**
 * Tests for how `validate:cem-sync` reports which of its two halves ran.
 *
 * The defect these pin: the prop-value half returned an empty attribute map
 * when the manifest was unreachable, `checkPropValueDrift` read empty as
 * "nothing to compare", and the summary printed `Prop-value drift: 0` above
 * `CEM sync validation passed!`. Output was byte-identical with and without a
 * manifest on disk, both exit 0 -- so the half that exists to catch enum drift
 * had been a no-op on every CI run without anything saying so.
 */
import { describe, it, expect } from 'vitest';
import { summarizeSync } from '../../../scripts/validate-cem-sync.js';

type SyncResultArg = Parameters<typeof summarizeSync>[0];

function syncResult(over: Partial<SyncResultArg> = {}): SyncResultArg {
  return {
    passed: true,
    findings: [],
    cem: {
      usable: true,
      outcome: 'complete',
      reason: 'pro Custom Elements Manifest, 84 components',
    },
    stats: {
      metadataComponents: 84,
      registryComponents: 84,
      onlyInCem: 0,
      onlyInRegistry: 0,
      synced: 84,
      propValueDrift: 0,
      attributeDrift: 0,
    },
    ...over,
  };
}

const UNUSABLE_FREE = {
  usable: false,
  outcome: 'partial',
  reason:
    'the free Custom Elements Manifest describes 66 of 84 registry components',
} as const;

describe('summarizeSync', () => {
  it('passes only when both halves ran and found nothing', () => {
    const summary = summarizeSync(syncResult());

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(true);
    expect(summary.headline).toBe('CEM sync validation passed!');
  });

  it('never reports a pass when the prop-value half could not run', () => {
    // The defect itself. Nothing was compared, so nothing may be claimed.
    const summary = summarizeSync(syncResult({ cem: UNUSABLE_FREE }));

    expect(summary.verified).toBe(false);
    expect(summary.headline).not.toMatch(/passed/i);
  });

  it('fails under CI when the prop-value half could not run', () => {
    // In CI the Pro package is installed by the freshness job, so an unusable
    // manifest means the install is broken rather than legitimately absent.
    const summary = summarizeSync(syncResult({ cem: UNUSABLE_FREE }), {
      allowSkip: false,
    });

    expect(summary.exitCode).toBe(1);
    expect(summary.headline).toMatch(/could not run/);
    expect(summary.headline).toMatch(/66 of 84/);
  });

  it('defaults to refusing a skip when the caller says nothing', () => {
    // The default is what CI gets if a future caller forgets to pass
    // `allowSkip`. Defaulting to tolerant would silently restore the
    // always-skip this whole change exists to remove, so the unspecified case
    // is asserted rather than left to the explicit tests below.
    const summary = summarizeSync(syncResult({ cem: UNUSABLE_FREE }));

    expect(summary.exitCode).toBe(1);
    expect(summary.verified).toBe(false);
  });

  it('tolerates the skip locally, still without calling it a pass', () => {
    const summary = summarizeSync(syncResult({ cem: UNUSABLE_FREE }), {
      allowSkip: true,
    });

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(false);
    expect(summary.headline).toMatch(/NOT verified/);
  });

  it('refuses a partial manifest rather than checking the subset it covers', () => {
    // All-or-nothing, matching Check A. The free manifest omits 18 registry
    // components, every one of them enum-bearing, so a "pass" against it would
    // speak for 49 of 67 enum-bearing components while sounding complete.
    const summary = summarizeSync(syncResult({ cem: UNUSABLE_FREE }), {
      allowSkip: false,
    });

    expect(summary.exitCode).toBe(1);
  });

  it('fails on real drift, and says so rather than reporting coverage', () => {
    const summary = summarizeSync(
      syncResult({
        passed: false,
        findings: [
          {
            component: 'badge',
            category: 'prop-value-drift',
            severity: 'error',
            message:
              'badge.variant advertises value(s) [INJECTED] that Web Awesome no longer accepts',
          },
        ],
      })
    );

    expect(summary.exitCode).toBe(1);
    expect(summary.headline).toMatch(/drift/i);
  });

  it('ignores warnings when deciding the exit code', () => {
    // Warnings are additive drift (a CEM value the registry has not surfaced
    // yet). They are worth printing but must not fail the build.
    const summary = summarizeSync(
      syncResult({
        findings: [
          {
            component: 'badge',
            category: 'prop-value-drift',
            severity: 'warning',
            message: 'badge.variant is missing newly-available value(s) [xl]',
          },
        ],
      })
    );

    expect(summary.exitCode).toBe(0);
    expect(summary.verified).toBe(true);
  });
});
