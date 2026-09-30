/**
 * Tests for the GHA issue-write matcher.
 *
 * Every case is a synthetic workflow object or expression string. Nothing here
 * reads .github/workflows, so these tests cannot start passing or failing
 * because the repo's own CI configuration changed.
 */
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { summarizeGuard } from '../../scripts/guard-outcome.js';
import {
  checkWorkflowIssueWrites,
  issueWriteGuardResult,
  prEventsReachable,
  stepWritesIssues,
  validateGhaIssueWrites,
  workflowPrEvents,
} from '../../scripts/validate-gha-issue-writes.js';

const PR = ['pull_request'];

const reportStep = (extra: Record<string, unknown> = {}) => ({
  name: 'Report dead links',
  run: 'gh issue comment "$EXISTING" --body "$BODY"',
  ...extra,
});

/** Builds a one-job workflow document with the given triggers. */
function workflow(
  on: unknown,
  steps: unknown[],
  job: Record<string, unknown> = {}
) {
  return { on, jobs: { report: { ...job, steps } } };
}

describe('workflowPrEvents', () => {
  it('reads the mapping form of `on:`', () => {
    expect(
      workflowPrEvents({
        on: { schedule: [], pull_request: { branches: ['main'] } },
      })
    ).toEqual(['pull_request']);
  });

  it('reads the string and list forms', () => {
    expect(workflowPrEvents({ on: 'pull_request_target' })).toEqual([
      'pull_request_target',
    ]);
    expect(
      workflowPrEvents({ on: ['push', 'pull_request', 'pull_request_target'] })
    ).toEqual(['pull_request', 'pull_request_target']);
  });

  it('is empty for a workflow with no pull request trigger', () => {
    expect(
      workflowPrEvents({ on: { schedule: [], workflow_dispatch: null } })
    ).toEqual([]);
    expect(workflowPrEvents({})).toEqual([]);
    expect(workflowPrEvents(null)).toEqual([]);
  });
});

describe('stepWritesIssues', () => {
  it('detects every gh issue subcommand that writes', () => {
    for (const sub of ['comment', 'create', 'edit', 'close', 'reopen']) {
      expect(stepWritesIssues({ run: `gh issue ${sub} 12` })).toBe(true);
    }
  });

  it('detects a write buried in a multi-line script', () => {
    expect(
      stepWritesIssues({
        run: 'set -euo pipefail\nif [ -n "$X" ]; then\n  gh issue comment "$X" --body "$B"\nfi\n',
      })
    ).toBe(true);
  });

  it('ignores gh issue reads', () => {
    expect(
      stepWritesIssues({
        run: 'gh issue list --label x\ngh issue view 3\ngh issue status',
      })
    ).toBe(false);
  });

  it('ignores steps without a run script', () => {
    expect(stepWritesIssues({ uses: 'actions/checkout@v7' })).toBe(false);
    expect(stepWritesIssues(null)).toBe(false);
  });
});

describe('prEventsReachable', () => {
  it('reaches every PR event when there is no condition', () => {
    expect(prEventsReachable(undefined, PR)).toEqual(PR);
    expect(prEventsReachable(true, PR)).toEqual(PR);
  });

  it('reaches nothing under `if: false`', () => {
    expect(prEventsReachable(false, PR)).toEqual([]);
  });

  it('is closed by a top-level != conjunct (the issue #147 fix)', () => {
    expect(
      prEventsReachable(
        "github.event_name != 'pull_request' && steps.links.outputs.failures != '0'",
        PR
      )
    ).toEqual([]);
  });

  it('accepts the ${{ }} wrapper and any conjunct order', () => {
    expect(
      prEventsReachable(
        "${{ steps.wa.outputs.upgrade == '1' && github.event_name != 'pull_request' }}",
        PR
      )
    ).toEqual([]);
  });

  it('is closed by an allowlist of non-PR events', () => {
    expect(
      prEventsReachable(
        "(github.event_name == 'schedule' || github.event_name == 'workflow_dispatch') && steps.x.outputs.drift == '1'",
        PR
      )
    ).toEqual([]);
  });

  it('stays open when the event test is only one side of an ||', () => {
    // Either operand alone runs the step, so the event test guarantees nothing.
    expect(
      prEventsReachable(
        "github.event_name != 'pull_request' || steps.x.outputs.drift == '1'",
        PR
      )
    ).toEqual(PR);
  });

  it('reads && as binding tighter than ||, like GitHub does', () => {
    // (gate && x) || y: y alone runs the step on a pull request.
    for (const condition of [
      "github.event_name != 'pull_request' && steps.x.outputs.y == '1' || steps.z.outputs.w == '1'",
      "github.event_name != 'pull_request' && steps.x.outputs.y == '1' || always()",
      "github.event_name != 'pull_request' && steps.x.outputs.y == '1' || failure()",
      "github.event_name == 'schedule' && steps.x.outputs.y == '1' || steps.z.outputs.w == '1'",
    ]) {
      expect(prEventsReachable(condition, PR), condition).toEqual(PR);
    }
  });

  it('is closed when every || alternative carries the gate', () => {
    expect(
      prEventsReachable(
        "github.event_name != 'pull_request' && steps.x.outputs.y == '1' || github.event_name != 'pull_request' && failure()",
        PR
      )
    ).toEqual([]);
  });

  it('is closed by a gate outside a parenthesised ||', () => {
    expect(
      prEventsReachable(
        "github.event_name != 'pull_request' && (steps.x.outputs.y == '1' || always())",
        PR
      )
    ).toEqual([]);
  });

  it('is closed by an unparenthesised allowlist, and by false in every branch', () => {
    expect(
      prEventsReachable(
        "github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'",
        PR
      )
    ).toEqual([]);
    expect(prEventsReachable('false || (false && always())', PR)).toEqual([]);
  });

  it('treats a negation as able to run anywhere', () => {
    // Correct, but not a shape the reader understands: rejected, never accepted.
    expect(
      prEventsReachable("!(github.event_name == 'pull_request')", PR)
    ).toEqual(PR);
  });

  it('stays open when an allowlist names the PR event', () => {
    expect(
      prEventsReachable(
        "github.event_name == 'schedule' || github.event_name == 'pull_request'",
        PR
      )
    ).toEqual(PR);
  });

  it('stays open for the conditions the report steps had before the fix', () => {
    expect(
      prEventsReachable(
        "steps.links.outputs.failures != '0' && steps.links.outputs.failures != ''",
        PR
      )
    ).toEqual(PR);
    expect(prEventsReachable("steps.wa.outputs.upgrade == '1'", PR)).toEqual(
      PR
    );
  });

  it('excludes only the event it names', () => {
    expect(
      prEventsReachable("github.event_name != 'pull_request'", [
        'pull_request',
        'pull_request_target',
      ])
    ).toEqual(['pull_request_target']);
  });

  it('matches event names case-insensitively, like GitHub does', () => {
    expect(
      prEventsReachable("github.event_name != 'Pull_Request'", PR)
    ).toEqual([]);
  });

  it('keeps separately parenthesised conjuncts apart', () => {
    // `(a) && (b)` starts and ends with parentheses from different groups;
    // stripping them as one pair would glue both links into one.
    expect(
      prEventsReachable(
        "(steps.x.outputs.drift == '1') && (github.event_name != 'pull_request')",
        PR
      )
    ).toEqual([]);
  });

  it('ignores parentheses and operators inside string literals', () => {
    // Counted as a real `(`, the literal would swallow the `&&` after it and
    // hide the event test in a conjunct nothing recognises.
    expect(
      prEventsReachable(
        "steps.x.outputs.msg != 'a (b && c' && github.event_name != 'pull_request'",
        PR
      )
    ).toEqual([]);
  });
});

describe('checkWorkflowIssueWrites', () => {
  it('flags an issue write reachable from pull_request (issue #147)', () => {
    const { findings, stepsChecked } = checkWorkflowIssueWrites(
      workflow({ schedule: [], pull_request: {} }, [
        { uses: 'actions/checkout@v7' },
        reportStep({ if: "steps.links.outputs.failures != '0'" }),
      ]),
      'maintenance.yml'
    );
    expect(stepsChecked).toHaveLength(1);
    expect(findings).toHaveLength(1);
    expect(findings[0].at).toEqual({
      workflow: 'maintenance.yml',
      job: 'report',
      step: 'Report dead links',
    });
    expect(findings[0].message).toContain(
      'Add "github.event_name != \'pull_request\'"'
    );
  });

  it('names every reachable event in the fix it suggests', () => {
    // Suggesting only the first event would leave the step flagged after
    // the reader applied the fix.
    const { findings } = checkWorkflowIssueWrites(
      workflow(['pull_request', 'pull_request_target'], [reportStep()]),
      'both.yml'
    );
    expect(findings[0].message).toContain(
      "Add \"github.event_name != 'pull_request' && github.event_name != 'pull_request_target'\""
    );
  });

  it('accepts an issue write gated off pull_request at the step', () => {
    const { findings, stepsChecked } = checkWorkflowIssueWrites(
      workflow({ schedule: [], pull_request: {} }, [
        reportStep({
          if: "github.event_name != 'pull_request' && steps.links.outputs.failures != '0'",
        }),
      ]),
      'maintenance.yml'
    );
    expect(stepsChecked).toHaveLength(1);
    expect(findings).toEqual([]);
  });

  it('accepts an issue write gated off pull_request at the job', () => {
    const { findings } = checkWorkflowIssueWrites(
      workflow({ pull_request: {}, schedule: [] }, [reportStep()], {
        if: "github.event_name != 'pull_request'",
      }),
      'maintenance.yml'
    );
    expect(findings).toEqual([]);
  });

  it('inspects but never flags a workflow without pull request triggers', () => {
    const { findings, stepsChecked } = checkWorkflowIssueWrites(
      workflow({ schedule: [] }, [reportStep()]),
      'weekly.yml'
    );
    expect(findings).toEqual([]);
    expect(stepsChecked).toEqual([
      {
        at: {
          workflow: 'weekly.yml',
          job: 'report',
          step: 'Report dead links',
        },
        prEvents: [],
      },
    ]);
  });

  it('names an unnamed step by its position', () => {
    const { findings } = checkWorkflowIssueWrites(
      workflow('pull_request', [
        { uses: 'actions/checkout@v7' },
        { run: 'gh issue create --title t --body b' },
      ]),
      'ci.yml'
    );
    expect(findings[0].at.step).toBe('step 2');
  });

  it('handles documents without jobs', () => {
    expect(checkWorkflowIssueWrites({ on: 'pull_request' }, 'x.yml')).toEqual({
      findings: [],
      stepsChecked: [],
    });
  });
});

describe('issueWriteGuardResult', () => {
  const inspected = checkWorkflowIssueWrites(
    workflow({ schedule: [] }, [reportStep()]),
    'weekly.yml'
  );
  const flagged = checkWorkflowIssueWrites(
    workflow('pull_request', [reportStep()]),
    'ci.yml'
  );

  it('passes, verified, when it inspected a step and found nothing wrong', () => {
    const summary = summarizeGuard(issueWriteGuardResult(1, inspected));
    expect(summary).toMatchObject({ exitCode: 0, verified: true });
  });

  it('fails on a finding', () => {
    const result = issueWriteGuardResult(1, flagged);
    expect(result.passed).toBe(false);
    expect(summarizeGuard(result).exitCode).toBe(1);
    expect(result.findings[0].component).toBe(
      'ci.yml / report / Report dead links'
    );
  });

  it('fails, unverified, when it inspected no step (docs/adr/0003)', () => {
    // A trigger or `run:` matcher that stopped matching lands here, and must
    // not print the same pass as a correctly gated repo.
    const empty = { findings: [], stepsChecked: [] };
    for (const workflowsRead of [0, 7]) {
      const result = issueWriteGuardResult(workflowsRead, empty);
      expect(result.passed).toBe(false);
      expect(summarizeGuard(result)).toMatchObject({
        exitCode: 1,
        verified: false,
      });
    }
  });
});

describe('validateGhaIssueWrites on a workflow directory', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-gha-issue-writes-'));
  });
  afterEach(() => fs.remove(dir));

  const gated = `on: { schedule: [{ cron: '0 6 * * 1' }], pull_request: {} }
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Report
        if: github.event_name != 'pull_request'
        run: gh issue comment 1 --body hi
`;

  it('passes a gated report', async () => {
    await fs.writeFile(path.join(dir, 'maintenance.yml'), gated);
    const { summary } = validateGhaIssueWrites(dir);
    expect(summary).toMatchObject({ exitCode: 0, verified: true });
  });

  it('fails an ungated one', async () => {
    await fs.writeFile(
      path.join(dir, 'maintenance.yml'),
      gated.replace("        if: github.event_name != 'pull_request'\n", '')
    );
    expect(validateGhaIssueWrites(dir).summary.exitCode).toBe(1);
  });

  it('fails an empty or missing directory instead of passing it', async () => {
    expect(validateGhaIssueWrites(dir).summary).toMatchObject({
      exitCode: 1,
      verified: false,
    });
    expect(
      validateGhaIssueWrites(path.join(dir, 'missing')).summary.exitCode
    ).toBe(1);
  });
});
