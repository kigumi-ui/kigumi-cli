#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * GitHub Actions Permissions Checker
 *
 * PURPOSE: A job-level `permissions:` block REPLACES the workflow-level one
 * rather than merging with it. So a job that declares any permissions at all
 * silently drops every scope it does not restate, including `contents: read`.
 * Without `contents: read`, `actions/checkout` cannot clone the repo.
 *
 * This is not hypothetical: PR #173 broke checkout exactly this way.
 *
 * CHECKS (all fail the build):
 * - A job that runs `actions/checkout` AND declares its own `permissions:`
 *   block must grant `contents:` at a level that permits reading.
 *
 * WHY "any readable value" AND NOT LITERALLY `contents: read`:
 * `contents: write` implies read, and .github/workflows/release.yml
 * legitimately needs write to push the changesets commit. A check demanding
 * the literal string `read` would flag correct configuration on its first
 * run. Only `none` (or omitting the key) actually breaks checkout.
 *
 * A job with NO job-level `permissions:` block is fine: it inherits the
 * workflow-level grant. This check deliberately says nothing about those.
 *
 * USAGE:
 *   pnpm validate:gha-permissions
 *   tsx scripts/validate-gha-permissions.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));
const WORKFLOW_DIR = path.join(PROJECT_ROOT, '.github', 'workflows');

// ── Types ───────────────────────────────────────────────────────────────────

export interface PermissionFinding {
  workflow: string;
  job: string;
  message: string;
}

export interface PermissionResult {
  passed: boolean;
  findings: PermissionFinding[];
  /** Every job inspected, so a run proves what it actually covered. */
  jobsChecked: Array<{ workflow: string; job: string; declares: boolean }>;
}

/** Values of `contents:` that still allow actions/checkout to clone. */
const READABLE = new Set(['read', 'write']);

// ── Pure matcher ────────────────────────────────────────────────────────────

/**
 * True when any step in the job uses actions/checkout.
 * Matches the action by name, so a pinned SHA or any version still counts.
 */
export function jobUsesCheckout(job: unknown): boolean {
  if (typeof job !== 'object' || job === null) return false;
  const steps = (job as { steps?: unknown }).steps;
  if (!Array.isArray(steps)) return false;

  return steps.some((step) => {
    const uses = (step as { uses?: unknown })?.uses;
    return typeof uses === 'string' && uses.startsWith('actions/checkout');
  });
}

/**
 * Inspects one parsed workflow document.
 *
 * Pure: takes parsed YAML, returns findings. No filesystem access, so the
 * rule is table-testable against synthetic workflow objects.
 */
export function checkWorkflowPermissions(
  doc: unknown,
  workflowName: string
): {
  findings: PermissionFinding[];
  jobsChecked: Array<{ workflow: string; job: string; declares: boolean }>;
} {
  const findings: PermissionFinding[] = [];
  const jobsChecked: Array<{
    workflow: string;
    job: string;
    declares: boolean;
  }> = [];

  const jobs = (doc as { jobs?: unknown })?.jobs;
  if (typeof jobs !== 'object' || jobs === null) {
    return { findings, jobsChecked };
  }

  for (const [jobName, job] of Object.entries(
    jobs as Record<string, unknown>
  )) {
    if (!jobUsesCheckout(job)) continue;

    const permissions = (job as { permissions?: unknown }).permissions;
    const declares = permissions !== undefined;
    jobsChecked.push({ workflow: workflowName, job: jobName, declares });

    // No job-level block: the job inherits the workflow-level grant, which
    // this check makes no claim about.
    if (!declares) continue;

    // `permissions: read-all` / `write-all` are shorthand grants that include
    // contents; `permissions: {}` grants nothing.
    if (typeof permissions === 'string') {
      if (permissions === 'read-all' || permissions === 'write-all') continue;
      findings.push({
        workflow: workflowName,
        job: jobName,
        message: `job-level "permissions: ${permissions}" does not grant contents, but the job runs actions/checkout. Add "contents: read"`,
      });
      continue;
    }

    const contents = (permissions as Record<string, unknown>)?.contents;

    if (contents === undefined) {
      findings.push({
        workflow: workflowName,
        job: jobName,
        message:
          'declares a job-level "permissions:" block without "contents:", but runs actions/checkout. ' +
          'Job-level permissions REPLACE the workflow-level ones rather than merging, so checkout loses read access. Add "contents: read"',
      });
      continue;
    }

    if (typeof contents !== 'string' || !READABLE.has(contents)) {
      findings.push({
        workflow: workflowName,
        job: jobName,
        message: `job-level "contents: ${String(contents)}" does not permit reading, but the job runs actions/checkout. Use "contents: read" (or "write" when the job also pushes)`,
      });
    }
  }

  return { findings, jobsChecked };
}

// ── Filesystem shell ────────────────────────────────────────────────────────

export function validateGhaPermissions(): PermissionResult {
  const findings: PermissionFinding[] = [];
  const jobsChecked: PermissionResult['jobsChecked'] = [];

  if (!fs.pathExistsSync(WORKFLOW_DIR)) {
    return { passed: true, findings, jobsChecked };
  }

  const files = fs
    .readdirSync(WORKFLOW_DIR)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(WORKFLOW_DIR, file), 'utf8');
    const doc = parse(raw);
    const result = checkWorkflowPermissions(doc, file);
    findings.push(...result.findings);
    jobsChecked.push(...result.jobsChecked);
  }

  return { passed: findings.length === 0, findings, jobsChecked };
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: PermissionResult): void {
  console.log(pc.cyan('\nValidating GitHub Actions job permissions...\n'));

  console.log(
    pc.bold(`Checkout jobs inspected (${result.jobsChecked.length}):`)
  );
  for (const { workflow, job, declares } of result.jobsChecked) {
    const note = declares ? 'job-level block' : 'inherits workflow-level';
    const bad = result.findings.some(
      (f) => f.workflow === workflow && f.job === job
    );
    console.log(
      `  ${bad ? pc.red('BAD') : pc.green('OK ')} ${workflow} / ${job} (${note})`
    );
  }
  console.log('');

  if (result.findings.length > 0) {
    console.log(pc.red(`Errors (${result.findings.length}):`));
    for (const f of result.findings) {
      console.log(pc.red(`  [${f.workflow} / ${f.job}] ${f.message}`));
    }
    console.log('');
    console.log(
      pc.yellow(
        'Fix: a job-level "permissions:" block replaces the workflow-level one\n' +
          'instead of merging with it, so every scope the job needs must be\n' +
          'restated, "contents: read" included.\n'
      )
    );
  }

  if (result.passed) {
    console.log(
      pc.green(
        `GHA permission validation passed! All ${result.jobsChecked.length} checkout jobs can read the repo.\n`
      )
    );
  } else {
    console.log(
      pc.red(
        `GHA permission validation failed with ${result.findings.length} error(s)\n`
      )
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  try {
    const result = validateGhaPermissions();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during GHA permission validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
