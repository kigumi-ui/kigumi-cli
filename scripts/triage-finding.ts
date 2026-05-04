#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Triage-finding CLI.
 *
 * Evaluates the 3-criteria new-finding rule from backlog-bankruptcy
 * Phase 1 and produces a draft artifact: state-file Issue entry,
 * PR-description bullet, or wontfix acknowledgement.
 *
 * Usage:
 *   tsx scripts/triage-finding.ts evaluate --json '<input>'
 *   tsx scripts/triage-finding.ts draft --type issue|pr-note|wontfix --json '<context>'
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

export type Severity = 'low' | 'medium' | 'high';
export type FindingType = 'bug' | 'quality' | 'test' | 'docs';

export interface FindingInput {
  description: string;
  severity: Severity;
  type: FindingType;
  initiative: string | null;
}

export interface Criteria {
  K1: boolean; // not fixable in same PR
  K2: boolean; // blocks v0.20.0 / feature / test-layer
  K3: boolean; // at least medium severity
}

export type Recommendation = 'issue' | 'pr-note' | 'wontfix';

export interface EvaluationResult {
  recommendation: Recommendation;
  failedCriteria: ('K1' | 'K2' | 'K3')[];
}

export function toSlug(description: string): string {
  // Note: \w only matches ASCII word characters. Non-ASCII input is partially
  // stripped (e.g., 'café' becomes 'caf'). State-file descriptions are
  // English in this codebase; if non-ASCII becomes a real concern, normalize
  // via .normalize('NFD').replace(/[̀-ͯ]/g, '') before stripping.
  const slug = description
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .split('-')
    .filter(Boolean)
    .slice(0, 5)
    .join('-');
  return slug || 'untitled';
}

export function evaluateCriteria(c: Criteria): EvaluationResult {
  const failed: ('K1' | 'K2' | 'K3')[] = [];
  if (!c.K1) failed.push('K1');
  if (!c.K2) failed.push('K2');
  if (!c.K3) failed.push('K3');

  if (!c.K3) return { recommendation: 'wontfix', failedCriteria: failed };
  if (failed.length === 0)
    return { recommendation: 'issue', failedCriteria: [] };
  return { recommendation: 'pr-note', failedCriteria: failed };
}

const CRITERIA_REASONS: Record<'K1' | 'K2' | 'K3', string> = {
  K1: 'fixable in the current PR',
  K2: 'does not block v0.20.0, an active feature, or test-layer completeness',
  K3: 'severity below medium',
};

export function renderDraft(
  recommendation: Recommendation,
  finding: FindingInput,
  failedCriteria: ('K1' | 'K2' | 'K3')[],
  date: string
): string {
  if (recommendation === 'issue') {
    const slug = toSlug(finding.description);
    return [
      `### ${slug}`,
      ``,
      `**Type:** ${finding.type} ${finding.severity}`,
      `**Date:** ${date}`,
      `**Routed from:** triage-finding ${date}`,
      `**Summary:** ${finding.description}`,
      ``,
    ].join('\n');
  }

  if (recommendation === 'pr-note') {
    const k = failedCriteria[0] ?? 'K1';
    return `- Out-of-scope note: ${finding.description} (deferred per triage ${date}: criterion ${k} not met, ${CRITERIA_REASONS[k]}).`;
  }

  return `Triage decision ${date}: wontfix-unless-recurring. Reactivation criteria: same bug surfaces in a real failure, or explicitly blocks one of the 5 features (Studio export fix, per-framework storybook, robust wrappers, custom patterns, storybook tests). No further action.`;
}

interface EvaluateArgs {
  finding: FindingInput;
  criteria: Criteria;
}

function readJsonArg(argv: string[]): unknown {
  const idx = argv.indexOf('--json');
  if (idx === -1 || !argv[idx + 1]) {
    console.error(pc.red(`--json '<payload>' required`));
    process.exit(2);
  }
  try {
    return JSON.parse(argv[idx + 1]);
  } catch (err) {
    console.error(pc.red(`Invalid JSON: ${(err as Error).message}`));
    process.exit(2);
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function main(): void {
  const cmd = process.argv[2];
  const argv = process.argv.slice(3);

  if (cmd === 'evaluate') {
    const payload = readJsonArg(argv) as EvaluateArgs;
    const result = evaluateCriteria(payload.criteria);
    const draft = renderDraft(
      result.recommendation,
      payload.finding,
      result.failedCriteria,
      todayIso()
    );
    console.log(JSON.stringify({ ...result, draft }, null, 2));
    return;
  }

  if (cmd === 'draft') {
    const typeIdx = argv.indexOf('--type');
    const type = (typeIdx >= 0 ? argv[typeIdx + 1] : '') as Recommendation;
    if (!['issue', 'pr-note', 'wontfix'].includes(type)) {
      console.error(pc.red(`--type must be one of: issue, pr-note, wontfix`));
      process.exit(2);
    }
    const payload = readJsonArg(argv) as {
      finding: FindingInput;
      failedCriteria: ('K1' | 'K2' | 'K3')[];
    };
    const draft = renderDraft(
      type,
      payload.finding,
      payload.failedCriteria ?? [],
      todayIso()
    );
    console.log(draft);
    return;
  }

  console.error(
    pc.red(`Usage:
  tsx scripts/triage-finding.ts evaluate --json '{"finding":{...},"criteria":{...}}'
  tsx scripts/triage-finding.ts draft --type issue|pr-note|wontfix --json '{"finding":{...},"failedCriteria":[]}'`)
  );
  process.exit(2);
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main();
}
