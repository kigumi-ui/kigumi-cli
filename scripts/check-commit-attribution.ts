#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Commit Attribution Checker
 *
 * PURPOSE: This project's commits are authored by its maintainers. AI
 * attribution trailers ("Co-Authored-By: Claude", "Generated with Claude
 * Code") must not enter the history, because rewriting them out later means
 * rewriting published history.
 *
 * Runs from the husky `commit-msg` hook, so it rejects the message before the
 * commit object exists rather than after it is already in the log.
 *
 * WHAT IT REJECTS: trailer-shaped lines only.
 *   Co-Authored-By: Claude <noreply@anthropic.com>
 *   Generated with Claude Code
 *
 * WHAT IT MUST NOT REJECT: prose that happens to mention these names. The
 * history legitimately contains subjects and bodies discussing Claude
 * sessions, Claude hooks and .claude/ paths, e.g.
 *   "ci: gate pull requests on five more validators" whose body explains
 *   that a check wired only to the Claude stop hook protects one session.
 * Matching those would make the hook unusable, and an unusable hook gets
 * bypassed with --no-verify, which is worse than no hook at all.
 *
 * USAGE:
 *   tsx scripts/check-commit-attribution.ts .git/COMMIT_EDITMSG
 *   tsx scripts/check-commit-attribution.ts --pr   (CI; reads PR_BODY,
 *     BASE_SHA and HEAD_SHA from the environment, issue #97)
 */

import { execFileSync } from 'child_process';
import fs from 'fs-extra';
import pc from 'picocolors';
import { isEntryPoint } from './is-entry-point.js';

// ── Pure matcher ────────────────────────────────────────────────────────────

export interface AttributionFinding {
  /** 1-based line number in the commit message. */
  line: number;
  /** The offending line, trimmed. */
  text: string;
  /** Why it was rejected. */
  reason: string;
}

/** Names that must not appear as an AI co-author or generator. */
const AI_NAMES = /\b(claude|anthropic|cursor)\b/i;

/**
 * A git trailer: "Token: value" at the start of a line. Git itself only
 * treats these as trailers in the final paragraph, but a "Co-Authored-By:"
 * anywhere is attribution regardless of placement.
 */
const CO_AUTHOR_TRAILER = /^\s*co-authored-by\s*:/i;

/**
 * "Generated with [Claude Code](...)", "Made with Cursor", "Created with
 * Cursor" and their plain-text variants.
 */
const GENERATED_WITH = /^\s*(?:🤖\s*)?(?:generated|made|created) with\b/i;

/**
 * Finds AI attribution in a commit message.
 *
 * Pure and exported so the rule is table-testable. The hook is a thin shell
 * around this, which is what keeps the false-positive boundary (prose vs.
 * trailer) under test rather than asserted once by hand.
 */
export function findAttribution(message: string): AttributionFinding[] {
  const findings: AttributionFinding[] = [];

  // A comment line in a commit message template is not part of the message.
  const lines = message.split('\n');

  lines.forEach((raw, index) => {
    if (raw.trimStart().startsWith('#')) return;

    if (CO_AUTHOR_TRAILER.test(raw) && AI_NAMES.test(raw)) {
      findings.push({
        line: index + 1,
        text: raw.trim(),
        reason: 'AI co-author trailer',
      });
      return;
    }

    if (GENERATED_WITH.test(raw) && AI_NAMES.test(raw)) {
      findings.push({
        line: index + 1,
        text: raw.trim(),
        reason: 'AI generator attribution',
      });
    }
  });

  return findings;
}

export interface PullRequestAttributionFinding extends AttributionFinding {
  /** Where the line was found: "PR body" or "commit <sha>". */
  source: string;
}

export interface PullRequestInput {
  body: string;
  commits: Array<{ sha: string; message: string }>;
}

/**
 * Finds AI attribution anywhere a squash merge can copy it onto main: the PR
 * body and every commit message on the branch. The commit-msg hook cannot
 * cover these, because GitHub writes the squash commit server-side (issue #97).
 */
export function findPullRequestAttribution(
  pr: PullRequestInput
): PullRequestAttributionFinding[] {
  const bodyFindings = findAttribution(pr.body).map((f) => ({
    ...f,
    source: 'PR body',
  }));
  const commitFindings = pr.commits.flatMap((c) =>
    findAttribution(c.message).map((f) => ({
      ...f,
      source: `commit ${c.sha.slice(0, 8)}`,
    }))
  );
  return [...bodyFindings, ...commitFindings];
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

/** Reads every commit message in BASE_SHA..HEAD_SHA, NUL-separated. */
function readRangeCommits(
  base: string,
  head: string
): PullRequestInput['commits'] {
  const out = execFileSync(
    'git',
    ['log', '--format=%H%n%B%x00', `${base}..${head}`],
    { encoding: 'utf8' }
  );
  return out
    .split('\0')
    .map((chunk) => chunk.replace(/^\n/, ''))
    .filter((chunk) => chunk.trim() !== '')
    .map((chunk) => {
      const [sha, ...rest] = chunk.split('\n');
      return { sha, message: rest.join('\n') };
    });
}

function mainPullRequest(): void {
  const base = process.env.BASE_SHA;
  const head = process.env.HEAD_SHA;
  if (!base || !head) {
    console.error(
      pc.red(
        'check-commit-attribution --pr: BASE_SHA and HEAD_SHA are required'
      )
    );
    process.exit(1);
  }

  const commits = readRangeCommits(base, head);
  // Zero commits means the range or the checkout depth is wrong, not a
  // clean PR. Passing here would make the guard decorative.
  if (commits.length === 0) {
    console.error(
      pc.red(`check-commit-attribution --pr: no commits in ${base}..${head}`)
    );
    process.exit(1);
  }

  const findings = findPullRequestAttribution({
    body: process.env.PR_BODY ?? '',
    commits,
  });

  if (findings.length === 0) {
    console.log(
      pc.green(
        `No AI attribution in the PR body or ${commits.length} commit(s).`
      )
    );
    process.exit(0);
  }

  console.error(pc.red('\nAI attribution found in this pull request.\n'));
  for (const f of findings) {
    console.error(
      pc.red(`  ${f.source}, line ${f.line} (${f.reason}): ${f.text}`)
    );
  }
  console.error(
    pc.yellow(
      '\nA squash merge copies these lines onto main. Remove them from the PR\n' +
        'body, or reword the commits, and push again.\n'
    )
  );
  process.exit(1);
}

function main(): void {
  if (process.argv[2] === '--pr') {
    mainPullRequest();
    return;
  }

  const messagePath = process.argv[2];

  if (!messagePath) {
    console.error(
      pc.red('check-commit-attribution: expected a commit-message file path')
    );
    process.exit(1);
  }

  // A missing file means the hook was wired wrong. Fail loud rather than
  // silently passing every commit, which is how a guard becomes decorative.
  if (!fs.pathExistsSync(messagePath)) {
    console.error(
      pc.red(`check-commit-attribution: no such file: ${messagePath}`)
    );
    process.exit(1);
  }

  const findings = findAttribution(fs.readFileSync(messagePath, 'utf8'));

  if (findings.length === 0) {
    process.exit(0);
  }

  console.error(pc.red('\nCommit rejected: AI attribution found.\n'));
  for (const f of findings) {
    console.error(pc.red(`  line ${f.line} (${f.reason}): ${f.text}`));
  }
  console.error(
    pc.yellow(
      "\nThis project's commits are authored by its maintainers. Remove the\n" +
        'trailer and commit again. Prose mentioning Claude is fine; only\n' +
        'Co-Authored-By and "Generated with" attribution lines are rejected.\n'
    )
  );
  process.exit(1);
}

// Only run when executed directly, not when imported (keeps the script testable)
if (isEntryPoint(import.meta.url)) {
  main();
}
