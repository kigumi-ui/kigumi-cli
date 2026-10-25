/* eslint-disable no-console */
/**
 * Bug injection for a PR's guards: put each bug back, run the test that
 * should catch it, record whether it went red, restore the file.
 *
 *   pnpm sabotage <cases.json>
 *
 * cases.json is a list of `SabotageCase`. `find` must occur exactly once in
 * `file`, so a pattern a formatter has since reflowed is reported, never
 * silently skipped. A case counts as red only when vitest printed its
 * `Tests` summary with at least one failure: a run that crashed before
 * collecting tests, or printed no summary, did not run the check and is
 * reported as such (docs/adr/0003). Every file is restored, also on Ctrl+C.
 * The output is a Markdown table for the PR log.
 */

import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { isEntryPoint } from './is-entry-point.js';

export interface SabotageCase {
  /** What is injected, as the PR log names it. */
  name: string;
  /** File to break, relative to the repo root. */
  file: string;
  find: string;
  replace: string;
  /** Test file or directory to run, relative to `cwd`. */
  test: string;
  /** Directory vitest runs in, relative to the repo root (default: root). */
  cwd?: string;
}

export interface VitestSummary {
  failed: number;
  passed: number;
}

export type Verdict = 'red' | 'green' | 'did-not-run';

/** `source` with its one occurrence of `find` replaced. */
export function injectOnce(
  source: string,
  find: string,
  replace: string
): string {
  const count = source.split(find).length - 1;
  if (count !== 1) {
    throw new Error(
      `pattern occurs ${count} times, expected exactly once (reflowed by a formatter?)`
    );
  }
  return source.replace(find, () => replace);
}

export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
}

/** The counts on vitest's last `Tests` line; undefined when it ran none. */
export function parseVitestSummary(output: string): VitestSummary | undefined {
  const line = stripAnsi(output)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^Tests\s/.test(l))
    .at(-1);
  if (!line) return undefined;
  const count = (label: string) =>
    Number(line.match(new RegExp(`(\\d+) ${label}`))?.[1] ?? 0);
  const summary = { failed: count('failed'), passed: count('passed') };
  return summary.failed + summary.passed > 0 ? summary : undefined;
}

export function judge(summary: VitestSummary | undefined): Verdict {
  if (!summary) return 'did-not-run';
  return summary.failed > 0 ? 'red' : 'green';
}

/** The titles of the tests vitest marked failed. */
export function failedTitles(output: string): string[] {
  return stripAnsi(output)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('×'))
    .map((l) =>
      l
        .slice(1)
        .trim()
        .replace(/\s+\d+ms$/, '')
    );
}

function tableRow(
  sabotage: SabotageCase,
  verdict: Verdict,
  detail: string
): string {
  const cell = (text: string) => text.replaceAll('|', '\\|');
  return `| ${cell(sabotage.name)} | \`${cell(sabotage.test)}\` | ${verdict}: ${cell(detail)} |`;
}

function main(): void {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error('Usage: pnpm sabotage <cases.json>');
    process.exit(2);
  }
  const root = process.cwd();
  const cases = JSON.parse(readFileSync(specPath, 'utf8')) as SabotageCase[];

  // Restore whatever is broken right now if the run is interrupted.
  let broken: { file: string; original: string } | undefined;
  process.on('SIGINT', () => {
    if (broken) writeFileSync(broken.file, broken.original);
    process.exit(130);
  });

  const rows: string[] = [];
  let allRed = true;
  for (const sabotage of cases) {
    const file = path.resolve(root, sabotage.file);
    const original = readFileSync(file, 'utf8');
    let injected: string;
    try {
      injected = injectOnce(original, sabotage.find, sabotage.replace);
    } catch (error) {
      allRed = false;
      rows.push(tableRow(sabotage, 'did-not-run', (error as Error).message));
      continue;
    }

    broken = { file, original };
    writeFileSync(file, injected);
    let output: string;
    try {
      const run = spawnSync('npx', ['vitest', 'run', sabotage.test], {
        cwd: path.resolve(root, sabotage.cwd ?? '.'),
        encoding: 'utf8',
      });
      output = `${run.stdout}\n${run.stderr}`;
    } finally {
      writeFileSync(file, original);
      broken = undefined;
    }

    const summary = parseVitestSummary(output);
    const verdict = judge(summary);
    if (verdict !== 'red') allRed = false;
    const detail = summary
      ? `${summary.failed} failed / ${summary.failed + summary.passed}` +
        (verdict === 'red' ? `: ${failedTitles(output).join('; ')}` : '')
      : 'no Tests summary, the check never ran';
    rows.push(tableRow(sabotage, verdict, detail));
  }

  console.log('| Injected | Test run | Result |');
  console.log('| --- | --- | --- |');
  for (const row of rows) console.log(row);
  if (!allRed) {
    console.error('\nNot every injected bug went red.');
    process.exit(1);
  }
}

if (isEntryPoint(import.meta.url)) {
  main();
}
