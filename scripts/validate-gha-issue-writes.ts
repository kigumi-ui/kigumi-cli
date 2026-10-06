#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * GitHub Actions Issue-Write Checker
 *
 * PURPOSE: A workflow that runs on `pull_request` runs once per push to every
 * matching PR. A step in it that comments on (or creates, or edits) a GitHub
 * issue posts once per such run, not once per finding. maintenance.yml's
 * weekly reports did exactly that: they also ran on every PR touching
 * package.json, and put 40 identical comments on #108 in three days
 * (issue #147).
 *
 * CHECKS (all fail the build):
 * - In a workflow triggered by `pull_request` or `pull_request_target`, a step
 *   whose `run:` script writes through `gh issue <subcommand>` must be gated
 *   off those events by its own `if:` or its job's `if:`.
 * - A run that found no issue-writing step in any workflow reports that it
 *   verified nothing and fails (docs/adr/0003): a matcher that stopped
 *   matching would otherwise look exactly like a correctly gated repo.
 *   Steps in workflows without a pull request trigger count as inspected, so
 *   moving the reports to a schedule-only workflow keeps this green.
 *
 * HOW A CONDITION IS READ: as GitHub evaluates it, with `&&` binding tighter
 * than `||`. An alternative (`||`) reaches every event either side reaches;
 * a chain (`&&`) reaches only the events every link reaches. The only links
 * understood are `github.event_name == '<event>'`, `github.event_name !=
 * '<event>'` (case-insensitive, like GitHub's comparison) and `false`; any
 * other link, a `!(...)` negation included, is assumed to be able to run on
 * every event. So a condition can be rejected although it is correct, but a
 * condition that runs on a pull request event is never accepted.
 *
 * WHY ISSUES AND NOT PULL REQUEST COMMENTS: a comment a pull request run posts
 * on that same pull request lands where the push happened, which is its point
 * (pr-body.yml's edit trail does this through `gh api .../issues/<pr>/comments`
 * in scripts/pr-github.ts). An issue is shared by every run, so there the same
 * comment piles up once per push to any PR.
 *
 * WHY ONLY PULL REQUEST TRIGGERS: those are the ones that fire per push to a
 * branch. The two `push` workflows here are limited to main, so they fire once
 * per merge. A workflow that adds a per-branch `push`, `merge_group` or
 * `workflow_run` trigger belongs in PR_EVENTS.
 *
 * NOT COVERED: issue writes that go through `gh api` or a marketplace action
 * rather than `gh issue`. None run from a pull request workflow here today.
 *
 * USAGE:
 *   pnpm validate:gha-issue-writes
 *   tsx scripts/validate-gha-issue-writes.ts
 */

import pc from 'picocolors';

import { inspectionGap, readWorkflowFiles } from './gha-workflows.js';
import {
  summarizeGuard,
  type GuardResult,
  type GuardSummary,
} from './guard-outcome.js';
import { isEntryPoint } from './is-entry-point.js';

// ── Types ───────────────────────────────────────────────────────────────────

/** Where a step lives: one value, so findings and inspections match by key. */
export interface StepRef {
  workflow: string;
  job: string;
  step: string;
}

export interface IssueWriteFinding {
  at: StepRef;
  message: string;
}

export interface InspectedStep {
  at: StepRef;
  /** The pull request triggers of the step's workflow; empty when it has none. */
  prEvents: string[];
}

export interface IssueWriteCheck {
  findings: IssueWriteFinding[];
  /** Every issue-writing step inspected, so a run proves what it covered. */
  stepsChecked: InspectedStep[];
}

/** Triggers that fire once per push to a pull request. */
const PR_EVENTS = ['pull_request', 'pull_request_target'];

/** `gh issue` subcommands that only read. Everything else writes. */
const READ_ONLY_SUBCOMMANDS = new Set(['list', 'view', 'status']);

const EVENT_COMPARISON = /^github\.event_name\s*(==|!=)\s*'([^']*)'$/i;

export function stepLabel({ workflow, job, step }: StepRef): string {
  return `${workflow} / ${job} / ${step}`;
}

// ── Pure matchers ───────────────────────────────────────────────────────────

/** The pull request triggers a parsed workflow declares, in PR_EVENTS order. */
export function workflowPrEvents(doc: unknown): string[] {
  const on = (doc as { on?: unknown } | null)?.on;
  let declared: string[] = [];
  if (typeof on === 'string') declared = [on];
  else if (Array.isArray(on))
    declared = on.filter((e) => typeof e === 'string');
  else if (typeof on === 'object' && on !== null) declared = Object.keys(on);

  return PR_EVENTS.filter((event) => declared.includes(event));
}

/** True when the step's `run:` script calls a writing `gh issue` subcommand. */
export function stepWritesIssues(step: unknown): boolean {
  const run = (step as { run?: unknown } | null)?.run;
  if (typeof run !== 'string') return false;

  for (const match of run.matchAll(/\bgh\s+issue\s+([a-z-]+)/g)) {
    if (!READ_ONLY_SUBCOMMANDS.has(match[1])) return true;
  }
  return false;
}

/**
 * Calls `visit` with the index and the parenthesis depth after each character
 * that sits outside a string literal; stops early when `visit` returns false.
 * GitHub escapes a quote inside a string as `''`, which toggles the in-string
 * state twice and so needs no special case.
 */
function walkOutsideStrings(
  expr: string,
  visit: (index: number, depth: number) => boolean | void
): void {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "'") inString = !inString;
    if (inString) continue;
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (visit(i, depth) === false) return;
  }
}

/** Splits an expression on `op` where it sits outside parentheses and strings. */
function splitTopLevel(expr: string, op: '&&' | '||'): string[] {
  const parts: string[] = [];
  let start = 0;
  walkOutsideStrings(expr, (i, depth) => {
    if (i < start || depth !== 0 || !expr.startsWith(op, i)) return;
    parts.push(expr.slice(start, i));
    start = i + op.length;
  });
  parts.push(expr.slice(start));
  return parts.map((p) => p.trim());
}

/** Removes parentheses that wrap the whole expression, however many layers. */
function stripOuterParens(expr: string): string {
  let current = expr.trim();
  while (current.startsWith('(') && current.endsWith(')')) {
    // Only strip when the first `(` closes at the very end: `(a) && (b)`
    // starts and ends with parentheses that belong to different groups.
    const last = current.length - 1;
    let closesAtEnd = true;
    walkOutsideStrings(current, (i, depth) => {
      if (depth === 0 && i < last) closesAtEnd = false;
      return closesAtEnd;
    });
    if (!closesAtEnd) break;
    current = current.slice(1, -1).trim();
  }
  return current;
}

/** The subset of `events` on which `expr` can be true. See the header. */
function reachableEvents(expr: string, events: string[]): string[] {
  const bare = stripOuterParens(expr);

  // `||` binds loosest, so it is split first.
  const alternatives = splitTopLevel(bare, '||');
  if (alternatives.length > 1) {
    const reached = new Set(
      alternatives.flatMap((alternative) =>
        reachableEvents(alternative, events)
      )
    );
    return events.filter((event) => reached.has(event));
  }

  const links = splitTopLevel(bare, '&&');
  if (links.length > 1) {
    return links.reduce((left, link) => reachableEvents(link, left), events);
  }

  if (/^false$/i.test(bare)) return [];
  const test = EVENT_COMPARISON.exec(bare);
  if (!test) return events;
  const name = test[2].toLowerCase();
  return events.filter((event) =>
    test[1] === '==' ? event === name : event !== name
  );
}

/**
 * Which of `prEvents` can still run a step guarded by `condition`.
 *
 * `condition` is the raw `if:` value: absent or `true` guards nothing, `false`
 * guards everything, and a string is read as described in the header.
 */
export function prEventsReachable(
  condition: unknown,
  prEvents: string[]
): string[] {
  if (condition === false) return [];
  if (typeof condition !== 'string') return [...prEvents];

  const trimmed = condition.trim();
  const wrapped = /^\$\{\{([\s\S]*)\}\}$/.exec(trimmed);
  return reachableEvents(wrapped ? wrapped[1] : trimmed, prEvents);
}

/**
 * Inspects one parsed workflow document.
 *
 * Pure: takes parsed YAML, returns findings. No filesystem access, so the
 * rule is table-testable against synthetic workflow objects.
 */
export function checkWorkflowIssueWrites(
  doc: unknown,
  workflowName: string
): IssueWriteCheck {
  const findings: IssueWriteFinding[] = [];
  const stepsChecked: InspectedStep[] = [];

  const prEvents = workflowPrEvents(doc);
  const jobs = (doc as { jobs?: unknown } | null)?.jobs;
  if (typeof jobs !== 'object' || jobs === null) {
    return { findings, stepsChecked };
  }

  for (const [jobName, job] of Object.entries(
    jobs as Record<string, unknown>
  )) {
    const { if: jobIf, steps } = (job ?? {}) as {
      if?: unknown;
      steps?: unknown;
    };
    if (!Array.isArray(steps)) continue;
    const reachableForJob = prEventsReachable(jobIf, prEvents);

    steps.forEach((step: unknown, index) => {
      if (!stepWritesIssues(step)) return;

      const { name, if: stepIf } = step as { name?: unknown; if?: unknown };
      const at: StepRef = {
        workflow: workflowName,
        job: jobName,
        step: typeof name === 'string' ? name : `step ${index + 1}`,
      };
      stepsChecked.push({ at, prEvents });

      const reachable = prEventsReachable(stepIf, reachableForJob);
      if (reachable.length === 0) return;

      const gate = reachable
        .map((event) => `github.event_name != '${event}'`)
        .join(' && ');
      findings.push({
        at,
        message:
          `writes to an issue via "gh issue" but can run on ${reachable.join(', ')}, ` +
          'so it posts again on every push to every matching pull request. ' +
          `Add "${gate}" to the step's if: as a top-level && condition`,
      });
    });
  }

  return { findings, stepsChecked };
}

/**
 * The run's outcome in the shared guard vocabulary (scripts/guard-outcome.ts):
 * findings fail it, and an inspection that covered nothing is reported as not
 * run rather than as a pass. The workflow files stand in for the manifest.
 */
export function issueWriteGuardResult(
  workflowsRead: number,
  { findings, stepsChecked }: IssueWriteCheck
): GuardResult {
  const gap = inspectionGap(
    workflowsRead,
    stepsChecked.length,
    'issue-writing step'
  );
  return {
    passed: findings.length === 0 && gap === null,
    findings: findings.map(({ at, message }) => ({
      check: 'issue-write',
      component: stepLabel(at),
      message,
    })),
    cem:
      gap === null
        ? {
            usable: true,
            outcome: 'complete',
            reason: `${stepsChecked.length} issue-writing step(s) in ${workflowsRead} workflow file(s)`,
          }
        : { usable: false, outcome: 'absent', reason: gap },
  };
}

// ── Filesystem shell ────────────────────────────────────────────────────────

export function validateGhaIssueWrites(dir?: string): {
  check: IssueWriteCheck;
  summary: GuardSummary;
} {
  const workflows = readWorkflowFiles(dir);
  const check: IssueWriteCheck = { findings: [], stepsChecked: [] };
  for (const { file, doc } of workflows) {
    const result = checkWorkflowIssueWrites(doc, file);
    check.findings.push(...result.findings);
    check.stepsChecked.push(...result.stepsChecked);
  }

  const summary = summarizeGuard(
    issueWriteGuardResult(workflows.length, check),
    {
      label: 'GHA issue-write validation',
      passHeadline: 'GHA issue-write validation passed!',
      fixHint:
        'The validator found nothing to inspect. If every "gh issue" write was\n' +
        'removed from .github/workflows on purpose, remove this validator too.',
    }
  );
  return { check, summary };
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults({
  check,
  summary,
}: ReturnType<typeof validateGhaIssueWrites>): void {
  console.log(pc.cyan('\nValidating GitHub Actions issue writes...\n'));

  console.log(
    pc.bold(`Issue-writing steps inspected (${check.stepsChecked.length}):`)
  );
  for (const { at, prEvents } of check.stepsChecked) {
    const key = stepLabel(at);
    const bad = check.findings.some((f) => stepLabel(f.at) === key);
    const note =
      prEvents.length > 0 ? `on ${prEvents.join(', ')}` : 'no PR trigger';
    console.log(`  ${bad ? pc.red('BAD') : pc.green('OK ')} ${key} (${note})`);
  }
  console.log('');

  const colour = summary.exitCode === 0 ? pc.green : pc.red;
  console.log(colour(summary.headline));
  console.log(summary.detail);
  if (check.findings.length > 0) {
    console.log(
      pc.yellow(
        '\nFix: a report that lands on an issue belongs to the scheduled or\n' +
          'manual run. Gate the writing step off pull request events.'
      )
    );
  }
  console.log('');
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  try {
    const result = validateGhaIssueWrites();
    printResults(result);
    process.exit(result.summary.exitCode);
  } catch (error) {
    console.error(pc.red('Fatal error during GHA issue-write validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (isEntryPoint(import.meta.url)) {
  main();
}
