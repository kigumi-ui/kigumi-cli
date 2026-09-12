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

// tsc has two diagnostic layouts and emits the pretty one by default even
// when its output is piped to a non-TTY:
//
//   plain  (--pretty false):  path/to/file.ts(12,34): error TS2345: ...
//   pretty (default):         path/to/file.ts:12:34 - error TS2345: ...
//
// `runTsc` forces `--pretty false`, so the plain form is what we actually
// parse. The pretty form is still accepted so that output captured from a
// bare `tsc` invocation (a developer piping by hand, a CI step that drops
// the flag) is not silently read as "no errors". Pretty output also wraps
// every field in ANSI escapes, which `stripAnsi` removes before matching.
const ERROR_LINE_PLAIN = /^(.+?)\((\d+),\d+\): error (TS\d+):/;
const ERROR_LINE_PRETTY = /^(.+?):(\d+):\d+ - error (TS\d+):/;

// The `/g` flag is safe on this shared module-level regex only because it is
// used with `String.replace`, which scans from the start each call. Switching
// a caller to `.test()` or `.exec()` would make `lastIndex` persist between
// calls and drop matches on every other line.
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '');
}

export function parseTscOutput(stdoutPlusStderr: string): TscError[] {
  const errors: TscError[] = [];
  // CRLF-tolerant split so Windows runs and any tooling that normalizes
  // line endings still parse the same way as Unix runs.
  for (const rawLine of stdoutPlusStderr.split(/\r?\n/)) {
    const line = stripAnsi(rawLine);
    const m = ERROR_LINE_PLAIN.exec(line) ?? ERROR_LINE_PRETTY.exec(line);
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

/**
 * Did tsc fail in a way the baseline gate cannot classify?
 *
 * tsc exits 0 when clean and non-zero otherwise, but the code alone does not
 * say why: on TypeScript 6.0.3 an ordinary type error and an unreadable
 * tsconfig both exit 2, and pointing `-p` at a missing file exits 1. So the
 * signal for "tsc itself broke" is a non-zero exit that produced no parseable
 * diagnostics, never the code's value.
 */
export function tscItselfFailed(
  exitCode: number,
  parsedErrorCount: number
): boolean {
  return exitCode !== 0 && parsedErrorCount === 0;
}

interface TscRunResult {
  output: string;
  exitCode: number;
}

function runTsc(): TscRunResult {
  try {
    // `--pretty false` pins the diagnostic layout. Without it tsc colours
    // and reformats its output even when piped, which the error regexes do
    // not match -- and an unparsed error list reads as "no errors".
    const result = execaSync(
      'npx',
      ['tsc', '--noEmit', '--pretty', 'false', '-p', TSCONFIG],
      {
        reject: false,
        stripFinalNewline: false,
      }
    );
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

  if (tscItselfFailed(tsc.exitCode, current.length)) {
    console.error(
      pc.red(
        `tsc exited ${tsc.exitCode} with no parseable error lines, so the ` +
          `baseline gate cannot classify the result. Either tsconfig.tests.json ` +
          `is unreadable or tsc changed its diagnostic format. Output:\n${tsc.output}`
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
