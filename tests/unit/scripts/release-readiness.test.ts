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

  it('returns NO-GO when no changeset exists', () => {
    const decision = decideGoNoGo(greenGates, { ...goMeta, changesetCount: 0 });
    expect(decision.go).toBe(false);
    expect(
      decision.reasons.some((r) => r.toLowerCase().includes('changeset'))
    ).toBe(true);
  });

  it('returns NO-GO when version equals last tag', () => {
    const decision = decideGoNoGo(greenGates, {
      ...goMeta,
      packageVersion: '0.19.2',
      lastTag: '0.19.2',
    });
    expect(decision.go).toBe(false);
    expect(
      decision.reasons.some((r) => r.toLowerCase().includes('version'))
    ).toBe(true);
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
      meta: { ...goMeta, changesetCount: 0 },
    };
    const md = renderReport(
      noGoInputs,
      decideGoNoGo(noGoInputs.gates, noGoInputs.meta)
    );
    expect(md).toContain('## Decision: ❌ NO-GO');
    expect(md).toMatch(/1\..*changeset/i);
  });

  it('shows coverage % for the unit-test gate', () => {
    const md = renderReport(inputs, decideGoNoGo(inputs.gates, inputs.meta));
    expect(md).toMatch(/test.*87\.4/);
  });
});
