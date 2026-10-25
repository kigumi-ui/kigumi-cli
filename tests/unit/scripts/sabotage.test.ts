/**
 * Tests for the bug-injection runner's verdicts.
 *
 * A sabotage run is evidence only when the injected bug reached the test
 * and the test failed. The two ways it passes for the wrong reason: the
 * pattern no longer matches (a formatter reflowed the line, so nothing was
 * injected), and vitest crashed before collecting tests (so nothing ran).
 * Both must be reported as did-not-run, never as red or green.
 */
import { describe, it, expect } from 'vitest';
import {
  failedTitles,
  injectOnce,
  judge,
  parseVitestSummary,
} from '../../../scripts/sabotage.js';

const ESC = '\x1b';

describe('injectOnce', () => {
  it('replaces the one occurrence', () => {
    expect(injectOnce('a && b', '&&', '||')).toBe('a || b');
  });

  it('refuses a pattern that no longer occurs', () => {
    expect(() => injectOnce('a &&\n  b', 'a && b', 'x')).toThrow(
      /occurs 0 times/
    );
  });

  it('refuses a pattern that occurs more than once', () => {
    expect(() => injectOnce('a; a;', 'a;', 'b;')).toThrow(/occurs 2 times/);
  });

  it('inserts the replacement literally, $ signs included', () => {
    expect(injectOnce('x', 'x', '$&$1')).toBe('$&$1');
  });
});

describe('parseVitestSummary and judge', () => {
  it('reads a red run through colour codes', () => {
    const output = `${ESC}[2m      Tests ${ESC}[22m ${ESC}[1m${ESC}[31m1 failed${ESC}[39m${ESC}[22m${ESC}[2m | ${ESC}[22m${ESC}[1m${ESC}[32m43 passed${ESC}[39m${ESC}[22m${ESC}[90m (44)${ESC}[39m`;
    const summary = parseVitestSummary(output);
    expect(summary).toEqual({ failed: 1, passed: 43 });
    expect(judge(summary)).toBe('red');
  });

  it('reads a green run', () => {
    const summary = parseVitestSummary('      Tests  299 passed (299)');
    expect(judge(summary)).toBe('green');
  });

  it('a run that collected no tests did not run', () => {
    const output = [
      ' Test Files  1 failed (1)',
      '      Tests  no tests',
      'TypeError: document.adoptedStyleSheets is not iterable',
    ].join('\n');
    expect(judge(parseVitestSummary(output))).toBe('did-not-run');
  });

  it('a run with no summary at all did not run', () => {
    expect(judge(parseVitestSummary('command not found: vitest'))).toBe(
      'did-not-run'
    );
  });

  it('reads the Tests line, not the Test Files line', () => {
    const output = [
      ' Test Files  1 failed (1)',
      '      Tests  2 failed | 41 passed (43)',
    ].join('\n');
    expect(parseVitestSummary(output)).toEqual({ failed: 2, passed: 41 });
  });
});

describe('failedTitles', () => {
  it('lists the failed tests without their timing', () => {
    const output = [
      `     ${ESC}[31m×${ESC}[39m a switch locks the value in the mode being edited 5ms`,
      '     ✓ starts with nothing locked 3ms',
    ].join('\n');
    expect(failedTitles(output)).toEqual([
      'a switch locks the value in the mode being edited',
    ]);
  });
});
