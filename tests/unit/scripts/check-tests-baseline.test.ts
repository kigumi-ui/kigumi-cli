import { describe, it, expect } from 'vitest';
import {
  parseTscOutput,
  stripAnsi,
  tscItselfFailed,
  loadBaseline,
  diffBaseline,
  formatBaseline,
  type TscError,
} from '../../../scripts/check-tests-baseline.js';

describe('parseTscOutput', () => {
  it('parses a single tsc error line', () => {
    const out =
      'tests/unit/foo.test.ts(12,34): error TS2345: Argument of type ... is not assignable to parameter of type ...';
    const result = parseTscOutput(out);
    expect(result).toEqual([
      { file: 'tests/unit/foo.test.ts', line: 12, code: 'TS2345' },
    ]);
  });

  it('parses multiple errors with continuation lines mixed in', () => {
    const out = [
      'tests/unit/a.test.ts(1,2): error TS2345: Foo',
      '  some continuation context line that is not an error',
      'tests/unit/b.test.ts(3,4): error TS2769: Bar',
    ].join('\n');
    const result = parseTscOutput(out);
    expect(result).toEqual([
      { file: 'tests/unit/a.test.ts', line: 1, code: 'TS2345' },
      { file: 'tests/unit/b.test.ts', line: 3, code: 'TS2769' },
    ]);
  });

  it('returns an empty array on empty input', () => {
    expect(parseTscOutput('')).toEqual([]);
  });

  it('ignores lines that look error-ish but carry no TS error code', () => {
    const out = [
      'Found 5 errors in 2 files.',
      "tests/unit/a.test.ts:12 - some other tool's diagnostic",
      'tests/unit/a.test.ts:12:3 - warning TS6133: unused',
    ].join('\n');
    expect(parseTscOutput(out)).toEqual([]);
  });

  it('parses CRLF-terminated lines (Windows or normalized output)', () => {
    const out =
      'tests/unit/a.test.ts(1,2): error TS2345: Foo\r\n' +
      'tests/unit/b.test.ts(3,4): error TS2769: Bar\r\n';
    expect(parseTscOutput(out)).toEqual([
      { file: 'tests/unit/a.test.ts', line: 1, code: 'TS2345' },
      { file: 'tests/unit/b.test.ts', line: 3, code: 'TS2769' },
    ]);
  });

  // tsc emits its pretty layout by default even when piped to a non-TTY, so
  // output captured without `--pretty false` uses `file:line:col - error` and
  // wraps every field in ANSI escapes. Parsing only the plain layout made the
  // gate read a real failure as a clean run. The ANSI case below is verbatim
  // TypeScript 6.0.3 output, escape bytes included.
  it('parses pretty-format lines (file:line:col - error)', () => {
    const out =
      "tests/unit/a.test.ts:1:14 - error TS2322: Type 'string' is not assignable to type 'number'.";
    expect(parseTscOutput(out)).toEqual([
      { file: 'tests/unit/a.test.ts', line: 1, code: 'TS2322' },
    ]);
  });

  it('parses real ANSI-coloured tsc output', () => {
    const out = [
      "\u001b[96mtests/unit/_probe.test.ts\u001b[0m:\u001b[93m1\u001b[0m:\u001b[93m14\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2322: \u001b[0mType 'string' is not assignable to type 'number'.",
      '',
      "\u001b[7m1\u001b[0m export const broken: number = 'nope';",
      '\u001b[7m \u001b[0m \u001b[91m             ~~~~~~\u001b[0m',
      '',
      'Found 1 error in tests/unit/_probe.test.ts\u001b[90m:1\u001b[0m',
    ].join('\n');
    expect(parseTscOutput(out)).toEqual([
      { file: 'tests/unit/_probe.test.ts', line: 1, code: 'TS2322' },
    ]);
  });

  it('parses a Windows absolute path, whose drive letter contains a colon', () => {
    const out =
      'C:\\repo\\tests\\unit\\a.test.ts(1,2): error TS2345: Foo\n' +
      'C:\\repo\\tests\\unit\\b.test.ts:3:4 - error TS2769: Bar';
    expect(parseTscOutput(out)).toEqual([
      { file: 'C:\\repo\\tests\\unit\\a.test.ts', line: 1, code: 'TS2345' },
      { file: 'C:\\repo\\tests\\unit\\b.test.ts', line: 3, code: 'TS2769' },
    ]);
  });
});

describe('stripAnsi', () => {
  it('removes SGR escape sequences and leaves plain text untouched', () => {
    expect(stripAnsi('\u001b[96mfoo\u001b[0m')).toBe('foo');
    expect(stripAnsi('already plain')).toBe('already plain');
  });
});

describe('tscItselfFailed', () => {
  // Exit codes below are measured against TypeScript 6.0.3, not assumed:
  // a plain type error and an unreadable tsconfig both exit 2, and pointing
  // `-p` at a missing file exits 1. So the exit code cannot classify the
  // failure on its own; only the absence of parseable diagnostics can.
  it('is false on a clean run', () => {
    expect(tscItselfFailed(0, 0)).toBe(false);
  });

  it('is false when tsc reported diagnostics we could parse', () => {
    // A type error exits 2 and yields parseable lines: the gate handles it.
    expect(tscItselfFailed(2, 1)).toBe(false);
  });

  it('is true when tsc failed but produced nothing parseable', () => {
    // A missing `-p` target exits 1 with only a TS5058 banner. The previous
    // `exitCode > 1` condition let exactly this case through.
    expect(tscItselfFailed(1, 0)).toBe(true);
    expect(tscItselfFailed(2, 0)).toBe(true);
  });
});

describe('loadBaseline', () => {
  it('parses a baseline JSON object into TscError records', () => {
    const json = JSON.stringify({
      'tests/unit/a.test.ts:12': 'TS2345',
      'tests/unit/b.test.ts:34': 'TS2769',
    });
    const result = loadBaseline(json);
    expect(result).toEqual([
      { file: 'tests/unit/a.test.ts', line: 12, code: 'TS2345' },
      { file: 'tests/unit/b.test.ts', line: 34, code: 'TS2769' },
    ]);
  });

  it('returns an empty array for an empty baseline object', () => {
    expect(loadBaseline('{}')).toEqual([]);
  });
});

describe('diffBaseline', () => {
  const e = (file: string, line: number, code: string): TscError => ({
    file,
    line,
    code,
  });

  it('returns empty diff when current matches baseline', () => {
    const errors = [e('a.ts', 1, 'TS2345'), e('b.ts', 2, 'TS2769')];
    const result = diffBaseline(errors, errors);
    expect(result.novel).toEqual([]);
    expect(result.fixed).toEqual([]);
    expect(result.unchanged).toEqual(errors);
  });

  it('flags novel errors not in baseline', () => {
    const baseline = [e('a.ts', 1, 'TS2345')];
    const current = [e('a.ts', 1, 'TS2345'), e('b.ts', 2, 'TS2769')];
    const result = diffBaseline(current, baseline);
    expect(result.novel).toEqual([e('b.ts', 2, 'TS2769')]);
    expect(result.fixed).toEqual([]);
  });

  it('reports baseline-only errors as fixed', () => {
    const baseline = [e('a.ts', 1, 'TS2345'), e('b.ts', 2, 'TS2769')];
    const current = [e('a.ts', 1, 'TS2345')];
    const result = diffBaseline(current, baseline);
    expect(result.novel).toEqual([]);
    expect(result.fixed).toEqual([e('b.ts', 2, 'TS2769')]);
  });

  it('treats different error codes at same file:line as novel + fixed', () => {
    const baseline = [e('a.ts', 1, 'TS2345')];
    const current = [e('a.ts', 1, 'TS2769')];
    const result = diffBaseline(current, baseline);
    expect(result.novel).toEqual([e('a.ts', 1, 'TS2769')]);
    expect(result.fixed).toEqual([e('a.ts', 1, 'TS2345')]);
  });

  it('treats moved files as novel + fixed', () => {
    const baseline = [e('tests/unit/a.test.ts', 1, 'TS2345')];
    const current = [e('tests/unit/sub/a.test.ts', 1, 'TS2345')];
    const result = diffBaseline(current, baseline);
    expect(result.novel).toEqual([e('tests/unit/sub/a.test.ts', 1, 'TS2345')]);
    expect(result.fixed).toEqual([e('tests/unit/a.test.ts', 1, 'TS2345')]);
  });
});

describe('formatBaseline', () => {
  // formatBaseline always appends a trailing '\n' for clean file writes
  // (POSIX text-file convention). Both the populated and empty-set
  // variants must keep that newline; the implementation in the wrapper
  // produces it via the closing '}\n'.
  it('emits a sorted canonical JSON object', () => {
    const errors = [
      { file: 'tests/unit/b.test.ts', line: 2, code: 'TS2769' },
      { file: 'tests/unit/a.test.ts', line: 12, code: 'TS2345' },
      { file: 'tests/unit/a.test.ts', line: 3, code: 'TS2345' },
    ];
    const json = formatBaseline(errors);
    expect(json).toBe(
      [
        '{',
        '  "tests/unit/a.test.ts:3": "TS2345",',
        '  "tests/unit/a.test.ts:12": "TS2345",',
        '  "tests/unit/b.test.ts:2": "TS2769"',
        '}',
        '',
      ].join('\n')
    );
  });

  it('emits {} for an empty error set', () => {
    expect(formatBaseline([])).toBe('{}\n');
  });
});
