#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Fixture Exclusion Checker
 *
 * PURPOSE: tests/fixtures/starter-snapshots holds 106 files recorded verbatim
 * from real CLI output. They are evidence, not source: Prettier must not
 * reformat them, ESLint must not lint them, and tsc must not type-check them,
 * or the snapshots stop matching what the CLI actually produced.
 *
 * Three separate ignore lists have to agree on that, in three different
 * syntaxes. Dropping the directory from any one of them is silent until a
 * formatter quietly rewrites a fixture and the diff no longer means anything.
 *
 * CHECKS (all fail the build):
 * - .prettierignore excludes the fixture directory
 * - eslint.config.js `ignores` excludes it
 * - tsconfig.tests.json `exclude` excludes it
 *
 * WHY tsconfig.tests.json AND NOT tsconfig.json: the root tsconfig has
 * `include: ["src/**\/*"]`, so tests/ was never in its scope and an exclude
 * there would be dead config. tsconfig.tests.json is the one that actually
 * compiles tests/.
 *
 * SCOPE: only starter-snapshots is gated. tests/fixtures/migration and
 * tests/fixtures/state hold five small JSON/MD files, are excluded nowhere
 * today, and cause no problem. Adding them would assert a rule nobody follows.
 *
 * USAGE:
 *   pnpm validate:fixture-exclusions
 *   tsx scripts/validate-fixture-exclusions.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));

/** The directory every list must exclude. */
export const GUARDED_FIXTURE = 'tests/fixtures/starter-snapshots';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ExclusionFinding {
  file: string;
  message: string;
}

export interface ExclusionResult {
  passed: boolean;
  findings: ExclusionFinding[];
  checked: Array<{ file: string; covered: boolean }>;
}

// ── Pure matchers ───────────────────────────────────────────────────────────

/**
 * True when a gitignore-style file excludes the directory.
 *
 * .prettierignore uses gitignore semantics, so a bare directory name covers
 * everything under it; a trailing slash or /** is equally valid. Comments and
 * blank lines are skipped.
 */
export function prettierIgnoreCovers(source: string, dir: string): boolean {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .some((line) => {
      const normalized = line.replace(/^\.\//, '').replace(/\/(\*\*)?$/, '');
      return normalized === dir;
    });
}

/**
 * True when a glob array covers the directory.
 *
 * Shared by the ESLint `ignores` array and the tsconfig `exclude` array,
 * which both use globs: "dir", "dir/**" and "dir/**\/*" all cover it.
 */
export function globListCovers(globs: string[], dir: string): boolean {
  return globs.some((glob) => {
    const normalized = glob
      .replace(/^\.\//, '')
      .replace(/\/\*\*\/\*$/, '')
      .replace(/\/\*\*$/, '')
      .replace(/\/$/, '');
    return normalized === dir;
  });
}

/**
 * Extracts a named string array from a JS/JSON source.
 *
 * Deliberately textual: eslint.config.js is executable JS that imports
 * plugins, so evaluating it to read one array would mean loading the whole
 * lint pipeline inside a validator.
 */
export function extractArray(source: string, key: string): string[] {
  const match = source.match(
    new RegExp(`"?${key}"?\\s*:\\s*\\[([\\s\\S]*?)\\]`)
  );
  if (!match) return [];
  return [...match[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(
    (m) => m[1] ?? m[2]
  );
}

// ── Filesystem shell ────────────────────────────────────────────────────────

export function validateFixtureExclusions(): ExclusionResult {
  const findings: ExclusionFinding[] = [];
  const checked: ExclusionResult['checked'] = [];

  const read = (rel: string): string =>
    fs.readFileSync(path.join(PROJECT_ROOT, rel), 'utf8');

  const record = (file: string, covered: boolean, how: string): void => {
    checked.push({ file, covered });
    if (!covered) {
      findings.push({
        file,
        message: `does not exclude ${GUARDED_FIXTURE}. These snapshots are recorded CLI output; ${how}`,
      });
    }
  };

  record(
    '.prettierignore',
    prettierIgnoreCovers(read('.prettierignore'), GUARDED_FIXTURE),
    'formatting them makes the diff meaningless. Add a line with the directory path'
  );

  record(
    'eslint.config.js',
    globListCovers(
      extractArray(read('eslint.config.js'), 'ignores'),
      GUARDED_FIXTURE
    ),
    `linting them reports errors in files nobody wrote. Add '${GUARDED_FIXTURE}/**' to the ignores array`
  );

  record(
    'tsconfig.tests.json',
    globListCovers(
      extractArray(read('tsconfig.tests.json'), 'exclude'),
      GUARDED_FIXTURE
    ),
    `type-checking them fails on fixtures that are not part of the project. Add '${GUARDED_FIXTURE}/**' to the exclude array`
  );

  return { passed: findings.length === 0, findings, checked };
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: ExclusionResult): void {
  console.log(pc.cyan('\nValidating fixture exclusions...\n'));

  for (const { file, covered } of result.checked) {
    console.log(`  ${covered ? pc.green('OK ') : pc.red('BAD')} ${file}`);
  }
  console.log('');

  if (result.findings.length > 0) {
    console.log(pc.red(`Errors (${result.findings.length}):`));
    for (const f of result.findings) {
      console.log(pc.red(`  [${f.file}] ${f.message}`));
    }
    console.log('');
  }

  if (result.passed) {
    console.log(
      pc.green(
        `Fixture exclusion validation passed! All ${result.checked.length} ignore lists cover ${GUARDED_FIXTURE}.\n`
      )
    );
  } else {
    console.log(
      pc.red(
        `Fixture exclusion validation failed with ${result.findings.length} error(s)\n`
      )
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  try {
    const result = validateFixtureExclusions();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during fixture exclusion validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
