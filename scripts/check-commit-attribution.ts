#!/usr/bin/env node
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
 */

import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

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
const AI_NAMES = /\b(claude|anthropic)\b/i;

/**
 * A git trailer: "Token: value" at the start of a line. Git itself only
 * treats these as trailers in the final paragraph, but a "Co-Authored-By:"
 * anywhere is attribution regardless of placement.
 */
const CO_AUTHOR_TRAILER = /^\s*co-authored-by\s*:/i;

/** "Generated with [Claude Code](...)" and its plain-text variants. */
const GENERATED_WITH = /^\s*(?:🤖\s*)?generated with\b/i;

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

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
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
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
