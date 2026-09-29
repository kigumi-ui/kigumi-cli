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
 *
 * WHAT COUNTS AS GATED: the condition must be a top-level `&&` chain in which
 * one link either
 *   - excludes the event: `github.event_name != 'pull_request'`, or
 *   - allowlists other events only:
 *     `(github.event_name == 'schedule' || github.event_name == 'workflow_dispatch')`.
 * Any other shape (a `!(...)` negation, the event test on one side of a
 * top-level `||`) is treated as ungated. That can reject a correct condition,
 * but never accepts a wrong one, and the fix is to write the plain form.
 *
 * NOT COVERED: issue writes that go through `gh api` or a marketplace action
 * rather than `gh issue`. None exist in this repo today.
 *
 * USAGE:
 *   pnpm validate:gha-issue-writes
 *   tsx scripts/validate-gha-issue-writes.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { parse } from 'yaml';

import { isEntryPoint } from './is-entry-point.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));
const WORKFLOW_DIR = path.join(PROJECT_ROOT, '.github', 'workflows');

// ── Types ───────────────────────────────────────────────────────────────────

export interface IssueWriteFinding {
  workflow: string;
  job: string;
  step: string;
  message: string;
}

export interface CheckedStep {
  workflow: string;
  job: string;
  step: string;
}

export interface IssueWriteResult {
  passed: boolean;
  findings: IssueWriteFinding[];
  /** Every issue-writing step inspected, so a run proves what it covered. */
  stepsChecked: CheckedStep[];
}

/** Triggers that fire once per push to a pull request. */
const PR_EVENTS = ['pull_request', 'pull_request_target'];

/** `gh issue` subcommands that only read. Everything else writes. */
const READ_ONLY_SUBCOMMANDS = new Set(['list', 'view', 'status']);

const EVENT_COMPARISON = /^github\.event_name\s*(==|!=)\s*'([^']*)'$/i;

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
 * Splits an expression on `op` where it sits outside parentheses and string
 * literals. GitHub escapes a quote inside a string as `''`, which toggles the
 * in-string state twice and so needs no special case.
 */
function splitTopLevel(expr: string, op: '&&' | '||'): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inString = false;
  let start = 0;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "'") inString = !inString;
    if (inString) continue;
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (depth === 0 && expr.startsWith(op, i)) {
      parts.push(expr.slice(start, i));
      start = i + op.length;
      i += op.length - 1;
    }
  }
  parts.push(expr.slice(start));
  return parts.map((p) => p.trim());
}

/** Removes parentheses that wrap the whole expression, however many layers. */
function stripOuterParens(expr: string): string {
  let current = expr.trim();
  while (current.startsWith('(') && current.endsWith(')')) {
    // Only strip when the first `(` closes at the very end: `(a) && (b)`
    // starts and ends with parentheses that belong to different groups.
    let depth = 0;
    let inString = false;
    let closesAtEnd = true;
    for (let i = 0; i < current.length; i++) {
      const ch = current[i];
      if (ch === "'") inString = !inString;
      if (inString) continue;
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (depth === 0 && i < current.length - 1) {
        closesAtEnd = false;
        break;
      }
    }
    if (!closesAtEnd) break;
    current = current.slice(1, -1).trim();
  }
  return current;
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

  let expr = condition.trim();
  const wrapped = /^\$\{\{([\s\S]*)\}\}$/.exec(expr);
  if (wrapped) expr = wrapped[1];

  let reachable = [...prEvents];

  for (const conjunct of splitTopLevel(stripOuterParens(expr), '&&')) {
    const link = stripOuterParens(conjunct);

    const excluded = EVENT_COMPARISON.exec(link);
    if (excluded?.[1] === '!=') {
      const name = excluded[2].toLowerCase();
      reachable = reachable.filter((event) => event !== name);
      continue;
    }

    // An allowlist: every alternative must be an `==` event test, otherwise
    // an alternative that is not about the event could run the step anyway.
    const allowed: string[] = [];
    const isAllowlist = splitTopLevel(link, '||').every((alternative) => {
      const test = EVENT_COMPARISON.exec(stripOuterParens(alternative));
      if (test?.[1] !== '==') return false;
      allowed.push(test[2].toLowerCase());
      return true;
    });
    if (isAllowlist) {
      reachable = reachable.filter((event) => allowed.includes(event));
    }
  }

  return reachable;
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
): { findings: IssueWriteFinding[]; stepsChecked: CheckedStep[] } {
  const findings: IssueWriteFinding[] = [];
  const stepsChecked: CheckedStep[] = [];

  const prEvents = workflowPrEvents(doc);
  const jobs = (doc as { jobs?: unknown } | null)?.jobs;
  if (prEvents.length === 0 || typeof jobs !== 'object' || jobs === null) {
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
      const stepName = typeof name === 'string' ? name : `step ${index + 1}`;
      stepsChecked.push({
        workflow: workflowName,
        job: jobName,
        step: stepName,
      });

      const reachable = prEventsReachable(stepIf, reachableForJob);
      if (reachable.length === 0) return;

      findings.push({
        workflow: workflowName,
        job: jobName,
        step: stepName,
        message:
          `writes to an issue via "gh issue" but can run on ${reachable.join(', ')}, ` +
          'so it posts again on every push to every matching pull request. ' +
          `Add "github.event_name != '${reachable[0]}'" to the step's if: as a top-level && condition`,
      });
    });
  }

  return { findings, stepsChecked };
}

// ── Filesystem shell ────────────────────────────────────────────────────────

export function validateGhaIssueWrites(): IssueWriteResult {
  const findings: IssueWriteFinding[] = [];
  const stepsChecked: CheckedStep[] = [];

  if (!fs.pathExistsSync(WORKFLOW_DIR)) {
    return { passed: true, findings, stepsChecked };
  }

  const files = fs
    .readdirSync(WORKFLOW_DIR)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(WORKFLOW_DIR, file), 'utf8');
    const result = checkWorkflowIssueWrites(parse(raw), file);
    findings.push(...result.findings);
    stepsChecked.push(...result.stepsChecked);
  }

  return { passed: findings.length === 0, findings, stepsChecked };
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: IssueWriteResult): void {
  console.log(pc.cyan('\nValidating GitHub Actions issue writes...\n'));

  console.log(
    pc.bold(
      `Issue-writing steps in pull-request workflows (${result.stepsChecked.length}):`
    )
  );
  for (const { workflow, job, step } of result.stepsChecked) {
    const bad = result.findings.some(
      (f) => f.workflow === workflow && f.job === job && f.step === step
    );
    console.log(
      `  ${bad ? pc.red('BAD') : pc.green('OK ')} ${workflow} / ${job} / ${step}`
    );
  }
  console.log('');

  if (result.findings.length > 0) {
    console.log(pc.red(`Errors (${result.findings.length}):`));
    for (const f of result.findings) {
      console.log(
        pc.red(`  [${f.workflow} / ${f.job} / ${f.step}] ${f.message}`)
      );
    }
    console.log('');
    console.log(
      pc.yellow(
        'Fix: a report that lands on an issue belongs to the scheduled or\n' +
          'manual run. Gate the writing step off pull request events.\n'
      )
    );
  }

  if (result.passed) {
    console.log(
      pc.green(
        `GHA issue-write validation passed! ${result.stepsChecked.length} issue-writing step(s) are gated off pull requests.\n`
      )
    );
  } else {
    console.log(
      pc.red(
        `GHA issue-write validation failed with ${result.findings.length} error(s)\n`
      )
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  try {
    const result = validateGhaIssueWrites();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
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
