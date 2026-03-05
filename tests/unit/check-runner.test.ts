/**
 * CheckRunner Tests
 *
 * Tests for src/checks/runner.ts
 */

import { describe, it, expect } from 'vitest';
import { CheckRunner } from '../../src/checks/runner.js';
import {
  CheckSeverity,
  type Check,
  type CheckContext,
  type CheckResult,
} from '../../src/checks/types.js';

function makeCheck(name: string, result: Partial<CheckResult>): Check {
  return {
    name,
    run: async () => ({
      passed: true,
      severity: CheckSeverity.ERROR,
      message: name,
      ...result,
    }),
  };
}

function throwingCheck(name: string): Check {
  return {
    name,
    run: async () => {
      throw new Error('unexpected failure');
    },
  };
}

const ctx: CheckContext = { cwd: '/tmp' };

describe('CheckRunner', () => {
  it('returns empty array with no checks', async () => {
    const runner = new CheckRunner();
    expect(await runner.run(ctx)).toEqual([]);
  });

  it('runs checks sequentially by default', async () => {
    const order: number[] = [];
    const runner = new CheckRunner();
    runner.add({
      name: 'first',
      run: async () => {
        order.push(1);
        return { passed: true, severity: CheckSeverity.ERROR, message: 'ok' };
      },
    });
    runner.add({
      name: 'second',
      run: async () => {
        order.push(2);
        return { passed: true, severity: CheckSeverity.ERROR, message: 'ok' };
      },
    });
    await runner.run(ctx);
    expect(order).toEqual([1, 2]);
  });

  it('stops on first error when stopOnError is true (default)', async () => {
    const runner = new CheckRunner();
    runner
      .add(makeCheck('pass', { passed: true }))
      .add(makeCheck('fail', { passed: false, severity: CheckSeverity.ERROR }))
      .add(makeCheck('never', { passed: true }));

    const results = await runner.run(ctx);
    expect(results).toHaveLength(2);
  });

  it('continues after error when stopOnError is false', async () => {
    const runner = new CheckRunner({ stopOnError: false });
    runner
      .add(makeCheck('pass', { passed: true }))
      .add(makeCheck('fail', { passed: false, severity: CheckSeverity.ERROR }))
      .add(makeCheck('also-runs', { passed: true }));

    const results = await runner.run(ctx);
    expect(results).toHaveLength(3);
  });

  it('does not stop on warning even with stopOnError', async () => {
    const runner = new CheckRunner();
    runner
      .add(
        makeCheck('warn', { passed: false, severity: CheckSeverity.WARNING })
      )
      .add(makeCheck('pass', { passed: true }));

    const results = await runner.run(ctx);
    expect(results).toHaveLength(2);
  });

  it('catches throwing checks in sequential mode', async () => {
    const runner = new CheckRunner();
    runner.add(throwingCheck('broken'));

    const results = await runner.run(ctx);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('unexpected failure');
  });

  it('stops after throwing check when stopOnError is true', async () => {
    const runner = new CheckRunner();
    runner
      .add(throwingCheck('broken'))
      .add(makeCheck('never', { passed: true }));

    const results = await runner.run(ctx);
    expect(results).toHaveLength(1);
  });

  it('continues after throwing check when stopOnError is false', async () => {
    const runner = new CheckRunner({ stopOnError: false });
    runner
      .add(throwingCheck('broken'))
      .add(makeCheck('runs', { passed: true }));

    const results = await runner.run(ctx);
    expect(results).toHaveLength(2);
  });

  it('runs checks in parallel', async () => {
    const runner = new CheckRunner({ parallel: true });
    runner
      .add(makeCheck('a', { passed: true }))
      .add(makeCheck('b', { passed: false, severity: CheckSeverity.ERROR }))
      .add(makeCheck('c', { passed: true }));

    const results = await runner.run(ctx);
    expect(results).toHaveLength(3);
  });

  it('catches throwing checks in parallel mode', async () => {
    const runner = new CheckRunner({ parallel: true });
    runner.add(throwingCheck('broken')).add(makeCheck('ok', { passed: true }));

    const results = await runner.run(ctx);
    expect(results).toHaveLength(2);
    expect(results[0].passed).toBe(false);
    expect(results[1].passed).toBe(true);
  });

  it('addAll adds multiple checks', async () => {
    const runner = new CheckRunner();
    runner.addAll([
      makeCheck('a', { passed: true }),
      makeCheck('b', { passed: true }),
    ]);

    const results = await runner.run(ctx);
    expect(results).toHaveLength(2);
  });

  it('hasErrors detects errors', () => {
    const runner = new CheckRunner();
    const results: CheckResult[] = [
      { passed: true, severity: CheckSeverity.ERROR, message: 'ok' },
      { passed: false, severity: CheckSeverity.ERROR, message: 'fail' },
    ];
    expect(runner.hasErrors(results)).toBe(true);
  });

  it('hasErrors returns false when no errors', () => {
    const runner = new CheckRunner();
    const results: CheckResult[] = [
      { passed: true, severity: CheckSeverity.ERROR, message: 'ok' },
      { passed: false, severity: CheckSeverity.WARNING, message: 'warn' },
    ];
    expect(runner.hasErrors(results)).toBe(false);
  });

  it('hasWarnings detects warnings', () => {
    const runner = new CheckRunner();
    const results: CheckResult[] = [
      { passed: false, severity: CheckSeverity.WARNING, message: 'warn' },
    ];
    expect(runner.hasWarnings(results)).toBe(true);
  });

  it('getErrors returns only errors', () => {
    const runner = new CheckRunner();
    const results: CheckResult[] = [
      { passed: false, severity: CheckSeverity.ERROR, message: 'err' },
      { passed: false, severity: CheckSeverity.WARNING, message: 'warn' },
      { passed: true, severity: CheckSeverity.ERROR, message: 'ok' },
    ];
    expect(runner.getErrors(results)).toHaveLength(1);
  });

  it('getWarnings returns only warnings', () => {
    const runner = new CheckRunner();
    const results: CheckResult[] = [
      { passed: false, severity: CheckSeverity.ERROR, message: 'err' },
      { passed: false, severity: CheckSeverity.WARNING, message: 'warn' },
    ];
    expect(runner.getWarnings(results)).toHaveLength(1);
  });

  it('formatResults formats errors and warnings', () => {
    const runner = new CheckRunner();
    const results: CheckResult[] = [
      { passed: false, severity: CheckSeverity.ERROR, message: 'Bad config' },
      {
        passed: false,
        severity: CheckSeverity.WARNING,
        message: 'Old version',
      },
    ];
    const formatted = runner.formatResults(results);
    expect(formatted).toContain('Errors (1)');
    expect(formatted).toContain('Bad config');
    expect(formatted).toContain('Warnings (1)');
    expect(formatted).toContain('Old version');
  });

  it('formatResults handles empty results', () => {
    const runner = new CheckRunner();
    expect(runner.formatResults([])).toBe('');
  });

  it('formatResults handles errors only', () => {
    const runner = new CheckRunner();
    const results: CheckResult[] = [
      { passed: false, severity: CheckSeverity.ERROR, message: 'err' },
    ];
    const formatted = runner.formatResults(results);
    expect(formatted).toContain('Errors');
    expect(formatted).not.toContain('Warnings');
  });

  it('clear removes all checks', async () => {
    const runner = new CheckRunner();
    runner.add(makeCheck('a', { passed: true }));
    runner.clear();
    expect(await runner.run(ctx)).toEqual([]);
  });
});
