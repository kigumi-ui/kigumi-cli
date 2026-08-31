/**
 * Tests for the GHA job-permissions matcher.
 *
 * Every case is a synthetic workflow object. Nothing here reads
 * .github/workflows, so these tests cannot start passing or failing because
 * the repo's own CI configuration changed.
 */
import { describe, expect, it } from 'vitest';

import {
  checkWorkflowPermissions,
  jobUsesCheckout,
} from '../../scripts/validate-gha-permissions.js';

const checkoutStep = { uses: 'actions/checkout@v7' };

/** Builds a one-job workflow document. */
function workflow(job: Record<string, unknown>) {
  return { jobs: { build: job } };
}

describe('jobUsesCheckout', () => {
  it('detects actions/checkout regardless of version', () => {
    expect(jobUsesCheckout({ steps: [{ uses: 'actions/checkout@v4' }] })).toBe(
      true
    );
    expect(jobUsesCheckout({ steps: [checkoutStep] })).toBe(true);
  });

  it('detects a SHA-pinned checkout', () => {
    expect(
      jobUsesCheckout({ steps: [{ uses: 'actions/checkout@a1b2c3d4' }] })
    ).toBe(true);
  });

  it('is false for a job that never checks out', () => {
    expect(
      jobUsesCheckout({ steps: [{ uses: 'actions/setup-node@v7' }] })
    ).toBe(false);
  });

  it('handles jobs with no steps and non-objects', () => {
    expect(jobUsesCheckout({})).toBe(false);
    expect(jobUsesCheckout(null)).toBe(false);
    expect(jobUsesCheckout('nonsense')).toBe(false);
  });
});

describe('checkWorkflowPermissions', () => {
  it('accepts a job-level block granting contents: read', () => {
    const { findings } = checkWorkflowPermissions(
      workflow({ permissions: { contents: 'read' }, steps: [checkoutStep] }),
      'ci.yml'
    );
    expect(findings).toEqual([]);
  });

  it('accepts contents: write, because write implies read', () => {
    // release.yml legitimately needs write to push the changesets commit.
    // A check demanding the literal "read" would flag correct config.
    const { findings } = checkWorkflowPermissions(
      workflow({
        permissions: { contents: 'write', 'id-token': 'write' },
        steps: [checkoutStep],
      }),
      'release.yml'
    );
    expect(findings).toEqual([]);
  });

  it('flags a job-level block that omits contents (the PR #173 break)', () => {
    const { findings } = checkWorkflowPermissions(
      workflow({
        permissions: { 'pull-requests': 'read' },
        steps: [checkoutStep],
      }),
      'ci.yml'
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].job).toBe('build');
    expect(findings[0].message).toContain('contents: read');
  });

  it('flags contents: none', () => {
    const { findings } = checkWorkflowPermissions(
      workflow({ permissions: { contents: 'none' }, steps: [checkoutStep] }),
      'ci.yml'
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain('does not permit reading');
  });

  it('flags an empty job-level block', () => {
    const { findings } = checkWorkflowPermissions(
      workflow({ permissions: {}, steps: [checkoutStep] }),
      'ci.yml'
    );
    expect(findings).toHaveLength(1);
  });

  it('ignores a job with no job-level block (it inherits)', () => {
    const { findings, jobsChecked } = checkWorkflowPermissions(
      workflow({ steps: [checkoutStep] }),
      'ci.yml'
    );
    expect(findings).toEqual([]);
    expect(jobsChecked[0].declares).toBe(false);
  });

  it('ignores a job that does not check out, however broken its permissions', () => {
    const { findings, jobsChecked } = checkWorkflowPermissions(
      workflow({ permissions: {}, steps: [{ uses: 'actions/setup-node@v7' }] }),
      'ci.yml'
    );
    expect(findings).toEqual([]);
    expect(jobsChecked).toEqual([]);
  });

  it('accepts the read-all / write-all shorthands', () => {
    for (const shorthand of ['read-all', 'write-all']) {
      const { findings } = checkWorkflowPermissions(
        workflow({ permissions: shorthand, steps: [checkoutStep] }),
        'ci.yml'
      );
      expect(findings).toEqual([]);
    }
  });

  it('flags the string shorthand "none"', () => {
    const { findings } = checkWorkflowPermissions(
      workflow({ permissions: 'none', steps: [checkoutStep] }),
      'ci.yml'
    );
    expect(findings).toHaveLength(1);
  });

  it('reports every offending job, not just the first', () => {
    const { findings } = checkWorkflowPermissions(
      {
        jobs: {
          a: { permissions: {}, steps: [checkoutStep] },
          b: {
            permissions: { 'pull-requests': 'read' },
            steps: [checkoutStep],
          },
          c: { permissions: { contents: 'read' }, steps: [checkoutStep] },
        },
      },
      'ci.yml'
    );
    expect(findings.map((f) => f.job)).toEqual(['a', 'b']);
  });

  it('tolerates a workflow with no jobs', () => {
    expect(checkWorkflowPermissions({}, 'x.yml').findings).toEqual([]);
    expect(checkWorkflowPermissions(null, 'x.yml').findings).toEqual([]);
  });
});
