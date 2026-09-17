import { describe, it, expect } from 'vitest';
import {
  decideGoNoGo,
  renderReport,
  type GateResult,
  type MetaResult,
  type ReportInputs,
} from '../../../scripts/release-readiness.js';

const greenGates: GateResult[] = [
  { name: 'build', pass: true, durationSec: 12.3 },
  { name: 'type-check', pass: true, durationSec: 8.1 },
  { name: 'lint', pass: true, durationSec: 4.2 },
  { name: 'test', pass: true, durationSec: 30.0, coveragePct: 87.4 },
  { name: 'test:integration', pass: true, durationSec: 22.0 },
  { name: 'test:e2e', pass: true, durationSec: 90.0 },
  { name: 'validate:all', pass: true, durationSec: 6.0 },
  { name: 'pack-smoke', pass: true, durationSec: 8.0 },
];

const goMeta: MetaResult = {
  changesetCount: 2,
  packageVersion: '0.20.0',
  lastTag: '0.19.2',
};

describe('decideGoNoGo', () => {
  it('returns GO when all gates pass and meta is satisfied', () => {
    const decision = decideGoNoGo(greenGates, goMeta);
    expect(decision.go).toBe(true);
    expect(decision.reasons).toEqual([]);
  });

  it('returns NO-GO with reasons when a gate fails', () => {
    const failed = greenGates.map((g) =>
      g.name === 'lint' ? { ...g, pass: false } : g
    );
    const decision = decideGoNoGo(failed, goMeta);
    expect(decision.go).toBe(false);
    expect(decision.reasons.some((r) => r.includes('lint'))).toBe(true);
  });

  // The two states a normal release actually passes through. `pnpm run version`
  // consumes the changesets to produce the bump, so no single state has both
  // pending changesets and a version ahead of the tag. Requiring both at once
  // made GO unreachable (#52).
  it('returns GO pre-bump: changesets pending, version still at last tag', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 2,
      packageVersion: '0.19.2',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(true);
    expect(decision.reasons).toEqual([]);
  });

  it('returns GO post-bump: changesets consumed, version ahead of last tag', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 0,
      packageVersion: '0.20.0',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(true);
    expect(decision.reasons).toEqual([]);
  });

  it('returns GO when a bump is done and further changesets have landed', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 1,
      packageVersion: '0.20.0',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(true);
    expect(decision.reasons).toEqual([]);
  });

  it('returns NO-GO when there is nothing to release', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 0,
      packageVersion: '0.19.2',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(false);
    expect(
      decision.reasons.some((r) =>
        r.toLowerCase().includes('nothing to release')
      )
    ).toBe(true);
  });

  it('returns NO-GO when the package version is behind the last tag', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 2,
      packageVersion: '0.19.1',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(false);
    expect(
      decision.reasons.some((r) => r.toLowerCase().includes('behind'))
    ).toBe(true);
  });

  it('returns NO-GO when the package version is behind the tag and no changesets exist', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 0,
      packageVersion: '0.19.1',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(false);
    expect(
      decision.reasons.some((r) => r.toLowerCase().includes('behind'))
    ).toBe(true);
  });

  it('compares versions by semver precedence, not lexically', () => {
    // '0.9.0' > '0.10.0' lexically, but is behind it by semver.
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 0,
      packageVersion: '0.9.0',
      lastTag: '0.10.0',
    });
    expect(decision.go).toBe(false);
    expect(
      decision.reasons.some((r) => r.toLowerCase().includes('behind'))
    ).toBe(true);
  });

  it('treats an unparseable version pair as NO-GO rather than silently passing', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 0,
      packageVersion: 'not-a-version',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(false);
  });

  // First release in a fresh repo: no tags exist yet.
  it('returns GO with no tags when changesets are pending', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 1,
      packageVersion: '0.1.0',
      lastTag: null,
    });
    expect(decision.go).toBe(true);
    expect(decision.reasons).toEqual([]);
  });

  it('returns NO-GO with no tags and no changesets', () => {
    const decision = decideGoNoGo(greenGates, {
      changesetCount: 0,
      packageVersion: '0.1.0',
      lastTag: null,
    });
    expect(decision.go).toBe(false);
    expect(
      decision.reasons.some((r) =>
        r.toLowerCase().includes('nothing to release')
      )
    ).toBe(true);
  });

  it('reports a failing gate alongside a valid release state', () => {
    const failed = greenGates.map((g) =>
      g.name === 'lint' ? { ...g, pass: false } : g
    );
    const decision = decideGoNoGo(failed, {
      changesetCount: 2,
      packageVersion: '0.19.2',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(false);
    expect(decision.reasons).toHaveLength(1);
    expect(decision.reasons[0]).toContain('lint');
  });
});

describe('renderReport', () => {
  const inputs: ReportInputs = {
    date: '2026-05-04',
    timeHHMM: '1430',
    branch: 'ft/release-prep',
    commitSha: 'abc1234',
    pnpmVersion: '10.29.3',
    nodeVersion: 'v22.14.0',
    gates: greenGates,
    meta: goMeta,
  };

  it('renders a markdown report with all required sections', () => {
    const md = renderReport(inputs, decideGoNoGo(inputs.gates, inputs.meta));
    expect(md).toContain('# Release Readiness 2026-05-04 1430');
    expect(md).toContain('**Branch:** ft/release-prep');
    expect(md).toContain('**Commit:** abc1234');
    expect(md).toContain('## Gates');
    expect(md).toContain('## Meta-checks');
    expect(md).toContain('## Decision: ✅ GO');
  });

  it('renders NO-GO with numbered reasons when meta is unsatisfied', () => {
    const noGoInputs: ReportInputs = {
      ...inputs,
      meta: { changesetCount: 0, packageVersion: '0.19.2', lastTag: '0.19.2' },
    };
    const md = renderReport(
      noGoInputs,
      decideGoNoGo(noGoInputs.gates, noGoInputs.meta)
    );
    expect(md).toContain('## Decision: ❌ NO-GO');
    expect(md).toMatch(/1\..*nothing to release/i);
  });

  it('shows coverage % for the unit-test gate', () => {
    const md = renderReport(inputs, decideGoNoGo(inputs.gates, inputs.meta));
    expect(md).toMatch(/test.*87\.4/);
  });
});
