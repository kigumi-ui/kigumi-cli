#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Mock Budget Gate
 *
 * Counts `vi.mock`-substring occurrences in tests/unit/ and verifies the
 * total stays under TOTAL_BUDGET, plus a per-file budget for the heaviest
 * historical offender (theme-commands.test.ts at 37). Modeled on
 * scripts/check-tests-baseline.ts.
 *
 * Modes:
 *   default                       advisory: print counts, exit 0
 *   MOCK_BUDGET_ENFORCE=1         enforce: exit 1 when a budget is exceeded
 *
 * The script is wired to `pnpm check:mocks` via package.json scripts and
 * runs in the Quality Checks CI job and the local stop-hook fast path.
 *
 * Cluster S, F-126: PR-S1 lands the script in advisory mode; PR-S4 sets
 * MOCK_BUDGET_ENFORCE=1 in CI once the substring count is below 50.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const UNIT_DIR = path.join(PROJECT_ROOT, 'tests/unit');

const TOTAL_BUDGET = 50;
const PER_FILE_BUDGETS: Record<string, number> = {
  'theme-commands.test.ts': 10,
};
const SUBSTRING = /vi\.mock/g;

interface FileCount {
  relative: string;
  count: number;
}

export function countMockSubstrings(rootDir: string): FileCount[] {
  const counts: FileCount[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }
        walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
        continue;
      }
      const contents = fs.readFileSync(full, 'utf8');
      const matches = contents.match(SUBSTRING);
      if (!matches || matches.length === 0) continue;
      counts.push({
        relative: path.relative(PROJECT_ROOT, full),
        count: matches.length,
      });
    }
  };
  walk(rootDir);
  return counts.sort((a, b) => b.count - a.count);
}

interface Verdict {
  totalCount: number;
  totalOver: boolean;
  perFileOver: Array<{ file: string; count: number; budget: number }>;
}

export function evaluate(counts: FileCount[]): Verdict {
  const totalCount = counts.reduce((sum, c) => sum + c.count, 0);
  const totalOver = totalCount >= TOTAL_BUDGET;
  const perFileOver: Verdict['perFileOver'] = [];
  for (const [name, budget] of Object.entries(PER_FILE_BUDGETS)) {
    const match = counts.find((c) => c.relative.endsWith(name));
    if (match && match.count >= budget) {
      perFileOver.push({ file: match.relative, count: match.count, budget });
    }
  }
  return { totalCount, totalOver, perFileOver };
}

function main(): void {
  const enforce = process.env.MOCK_BUDGET_ENFORCE === '1';
  const counts = countMockSubstrings(UNIT_DIR);
  const verdict = evaluate(counts);

  console.log(
    pc.cyan(
      `Mock budget check (mode: ${enforce ? pc.yellow('enforce') : 'advisory'})`
    )
  );
  console.log(
    `  Total: ${verdict.totalCount} / ${TOTAL_BUDGET} (${
      verdict.totalOver ? pc.red('OVER') : pc.green('OK')
    })`
  );
  for (const [name, budget] of Object.entries(PER_FILE_BUDGETS)) {
    const match = counts.find((c) => c.relative.endsWith(name));
    const cur = match?.count ?? 0;
    const over = cur >= budget;
    console.log(
      `  ${name}: ${cur} / ${budget} (${over ? pc.red('OVER') : pc.green('OK')})`
    );
  }

  // Show top 5 offenders so review can target them.
  if (counts.length > 0) {
    console.log('\n  Top offenders:');
    for (const c of counts.slice(0, 5)) {
      console.log(`    ${c.count}  ${c.relative}`);
    }
  }

  const violations = verdict.totalOver || verdict.perFileOver.length > 0;
  if (!violations) {
    console.log(pc.green('\n✓ Mock budget OK\n'));
    process.exit(0);
  }

  if (enforce) {
    console.error(pc.red('\n❌ Mock budget exceeded:'));
    if (verdict.totalOver) {
      console.error(pc.red(`  Total ${verdict.totalCount} >= ${TOTAL_BUDGET}`));
    }
    for (const f of verdict.perFileOver) {
      console.error(pc.red(`  ${f.file}: ${f.count} >= ${f.budget}`));
    }
    console.error(
      pc.red(
        '\nReplace vi.mock with helpers from tests/unit/_helpers/ + DI hooks ' +
          '(see docs/superpowers/specs/2026-05-02-cluster-s-mock-reduction-design.md).\n'
      )
    );
    process.exit(1);
  }

  console.log(
    pc.yellow(
      '\n⚠ Mock budget exceeded but running in advisory mode. ' +
        'Set MOCK_BUDGET_ENFORCE=1 to fail.\n'
    )
  );
  process.exit(0);
}

const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('check-mock-budget.ts') ||
  process.argv[1]?.endsWith('check-mock-budget.js');

if (invokedDirectly) {
  main();
}
