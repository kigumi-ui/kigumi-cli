#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Tests Type-Check Baseline Gate
 *
 * Runs `tsc --noEmit -p tsconfig.tests.json` and diffs the result against
 * `tests/.tsc-baseline.json`. Exits 0 if no novel errors. Exits 1 if any
 * error appeared that is not in the baseline.
 *
 * Modes:
 *   default             diff against baseline (the gate)
 *   --update-baseline   regenerate the baseline from the current run
 */

import { execaSync } from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const BASELINE_PATH = path.join(PROJECT_ROOT, 'tests/.tsc-baseline.json');
const TSCONFIG = path.join(PROJECT_ROOT, 'tsconfig.tests.json');

export interface TscError {
  file: string;
  line: number;
  code: string;
}

export interface BaselineDiff {
  novel: TscError[];
  fixed: TscError[];
  unchanged: TscError[];
}

const ERROR_LINE = /^([^()]+)\((\d+),\d+\): error (TS\d+):/;

export function parseTscOutput(stdoutPlusStderr: string): TscError[] {
  const errors: TscError[] = [];
  // CRLF-tolerant split so Windows runs and any tooling that normalizes
  // line endings still parse the same way as Unix runs.
  for (const line of stdoutPlusStderr.split(/\r?\n/)) {
    const m = ERROR_LINE.exec(line);
    if (!m) continue;
    errors.push({ file: m[1], line: Number(m[2]), code: m[3] });
  }
  return errors;
}

export function loadBaseline(json: string): TscError[] {
  const obj = JSON.parse(json) as Record<string, string>;
  return Object.entries(obj).map(([key, code]) => {
    const sep = key.lastIndexOf(':');
    return { file: key.slice(0, sep), line: Number(key.slice(sep + 1)), code };
  });
}

const errorKey = (e: TscError): string => `${e.file}:${e.line}:${e.code}`;

export function diffBaseline(
  current: TscError[],
  baseline: TscError[]
): BaselineDiff {
  const baselineSet = new Set(baseline.map(errorKey));
  const currentSet = new Set(current.map(errorKey));
  return {
    novel: current.filter((e) => !baselineSet.has(errorKey(e))),
    fixed: baseline.filter((e) => !currentSet.has(errorKey(e))),
    unchanged: current.filter((e) => baselineSet.has(errorKey(e))),
  };
}

export function formatBaseline(errors: TscError[]): string {
  if (errors.length === 0) return '{}\n';
  const sorted = [...errors].sort((a, b) =>
    a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)
  );
  const body = sorted
    .map(
      (e) =>
        `  ${JSON.stringify(`${e.file}:${e.line}`)}: ${JSON.stringify(e.code)}`
    )
    .join(',\n');
  return `{\n${body}\n}\n`;
}

interface TscRunResult {
  output: string;
  exitCode: number;
}

function runTsc(): TscRunResult {
  try {
    const result = execaSync('npx', ['tsc', '--noEmit', '-p', TSCONFIG], {
      reject: false,
      stripFinalNewline: false,
    });
    return {
      output: `${result.stdout}\n${result.stderr}`,
      exitCode: result.exitCode ?? 0,
    };
  } catch (err) {
    // execaSync throws when the binary itself can't be spawned (e.g., npx
    // missing, ENOENT). Surface as a hard failure with a clear message.
    console.error(pc.red(`Failed to launch tsc: ${(err as Error).message}`));
    process.exit(2);
  }
}

function main(): void {
  const updateMode = process.argv.includes('--update-baseline');
  const tsc = runTsc();
  const current = parseTscOutput(tsc.output);

  // tsc exits 0 on success, 1 on type errors, 2+ on bad arguments / config
  // problems / unrecoverable issues. Distinguish "type errors found" (which
  // we diff against the baseline) from "tsc itself broke" (which the
  // baseline gate cannot rescue).
  if (tsc.exitCode > 1 && current.length === 0) {
    console.error(
      pc.red(
        `tsc exited ${tsc.exitCode} with no parseable error lines. ` +
          `tsconfig.tests.json is likely broken. Output:\n${tsc.output}`
      )
    );
    process.exit(tsc.exitCode);
  }

  if (updateMode) {
    fs.writeFileSync(BASELINE_PATH, formatBaseline(current), 'utf8');
    console.log(pc.green(`Baseline updated: ${current.length} entries`));
    process.exit(0);
  }

  const baselineExists = fs.existsSync(BASELINE_PATH);
  const baseline = baselineExists
    ? loadBaseline(fs.readFileSync(BASELINE_PATH, 'utf8'))
    : [];
  const diff = diffBaseline(current, baseline);

  if (diff.novel.length > 0) {
    console.error(
      pc.red(`\n❌ ${diff.novel.length} novel tests/ type error(s):\n`)
    );
    for (const e of diff.novel) {
      console.error(`  ${e.file}:${e.line} ${e.code}`);
    }
    console.error(
      pc.red(
        `\nFix the error or run \`pnpm check:tests --update-baseline\` if intentional.\n`
      )
    );
    process.exit(1);
  }

  if (diff.fixed.length > 0) {
    console.log(
      pc.cyan(
        `✓ ${diff.fixed.length} baseline entr${diff.fixed.length === 1 ? 'y' : 'ies'} fixed. ` +
          `Run \`pnpm check:tests --update-baseline\` to shrink the baseline.\n`
      )
    );
  }

  console.log(
    pc.green(
      `✓ tests/ type-check passed (${current.length} allowlisted, ${diff.novel.length} novel)\n`
    )
  );
  process.exit(0);
}

const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('check-tests-baseline.ts') ||
  process.argv[1]?.endsWith('check-tests-baseline.js');

if (invokedDirectly) {
  main();
}
