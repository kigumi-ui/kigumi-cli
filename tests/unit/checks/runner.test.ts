/**
 * Check Runner Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CheckRunner } from '../../../src/checks/runner.js';
import { CheckSeverity, type Check, type CheckContext, type CheckResult } from '../../../src/checks/types.js';

// Mock check that always passes
class PassingCheck implements Check {
  readonly id = 'passing';
  readonly name = 'Passing Check';
  readonly description = 'Always passes';

  async run(): Promise<CheckResult> {
    return {
      passed: true,
      severity: CheckSeverity.INFO,
      message: 'Check passed',
    };
  }
}

// Mock check that always fails with error
class FailingCheck implements Check {
  readonly id = 'failing';
  readonly name = 'Failing Check';
  readonly description = 'Always fails';

  async run(): Promise<CheckResult> {
    return {
      passed: false,
      severity: CheckSeverity.ERROR,
      message: 'Check failed',
      suggestion: ['Fix the issue'],
    };
  }
}

// Mock check that produces warning
class WarningCheck implements Check {
  readonly id = 'warning';
  readonly name = 'Warning Check';
  readonly description = 'Produces a warning';

  async run(): Promise<CheckResult> {
    return {
      passed: false,
      severity: CheckSeverity.WARNING,
      message: 'This is a warning',
      suggestion: ['Consider fixing this'],
    };
  }
}

// Mock check that throws error
class ThrowingCheck implements Check {
  readonly id = 'throwing';
  readonly name = 'Throwing Check';
  readonly description = 'Throws an error';

  async run(): Promise<CheckResult> {
    throw new Error('Unexpected error');
  }
}

describe('CheckRunner', () => {
  let runner: CheckRunner;
  let context: CheckContext;

  beforeEach(() => {
    runner = new CheckRunner();
    context = { cwd: '/test' };
  });

  describe('add()', () => {
    it('should add a check', () => {
      const check = new PassingCheck();
      const result = runner.add(check);

      expect(result).toBe(runner); // Should return this for chaining
    });

    it('should support chaining', () => {
      const result = runner
        .add(new PassingCheck())
        .add(new PassingCheck());

      expect(result).toBe(runner);
    });
  });

  describe('addAll()', () => {
    it('should add multiple checks', () => {
      const checks = [new PassingCheck(), new PassingCheck()];
      const result = runner.addAll(checks);

      expect(result).toBe(runner);
    });
  });

  describe('run()', () => {
    it('should return empty array if no checks', async () => {
      const results = await runner.run(context);
      expect(results).toEqual([]);
    });

    it('should run passing checks', async () => {
      runner.add(new PassingCheck());

      const results = await runner.run(context);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
      expect(results[0].message).toBe('Check passed');
    });

    it('should run multiple checks sequentially', async () => {
      runner
        .add(new PassingCheck())
        .add(new PassingCheck());

      const results = await runner.run(context);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.passed)).toBe(true);
    });

    it('should stop on first error by default', async () => {
      runner
        .add(new PassingCheck())
        .add(new FailingCheck())
        .add(new PassingCheck()); // Should not run

      const results = await runner.run(context);

      expect(results).toHaveLength(2); // Only first 2 checks
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(false);
    });

    it('should not stop on warnings', async () => {
      runner
        .add(new WarningCheck())
        .add(new PassingCheck());

      const results = await runner.run(context);

      expect(results).toHaveLength(2);
      expect(results[0].severity).toBe(CheckSeverity.WARNING);
      expect(results[1].passed).toBe(true);
    });

    it('should continue on error if stopOnError=false', async () => {
      runner = new CheckRunner({ stopOnError: false });
      runner
        .add(new FailingCheck())
        .add(new PassingCheck());

      const results = await runner.run(context);

      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(false);
      expect(results[1].passed).toBe(true);
    });

    it('should handle check exceptions', async () => {
      runner.add(new ThrowingCheck());

      const results = await runner.run(context);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].severity).toBe(CheckSeverity.ERROR);
      expect(results[0].message).toContain('Unexpected error');
    });

    it('should run checks in parallel if configured', async () => {
      runner = new CheckRunner({ parallel: true });
      runner
        .add(new PassingCheck())
        .add(new PassingCheck())
        .add(new PassingCheck());

      const results = await runner.run(context);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.passed)).toBe(true);
    });
  });

  describe('hasErrors()', () => {
    it('should return true if there are errors', () => {
      const results: CheckResult[] = [
        { passed: false, severity: CheckSeverity.ERROR, message: 'Error' },
      ];

      expect(runner.hasErrors(results)).toBe(true);
    });

    it('should return false if there are only warnings', () => {
      const results: CheckResult[] = [
        { passed: false, severity: CheckSeverity.WARNING, message: 'Warning' },
      ];

      expect(runner.hasErrors(results)).toBe(false);
    });

    it('should return false if all checks passed', () => {
      const results: CheckResult[] = [
        { passed: true, severity: CheckSeverity.INFO, message: 'OK' },
      ];

      expect(runner.hasErrors(results)).toBe(false);
    });
  });

  describe('hasWarnings()', () => {
    it('should return true if there are warnings', () => {
      const results: CheckResult[] = [
        { passed: false, severity: CheckSeverity.WARNING, message: 'Warning' },
      ];

      expect(runner.hasWarnings(results)).toBe(true);
    });

    it('should return false if there are only errors', () => {
      const results: CheckResult[] = [
        { passed: false, severity: CheckSeverity.ERROR, message: 'Error' },
      ];

      expect(runner.hasWarnings(results)).toBe(false);
    });
  });

  describe('getErrors()', () => {
    it('should return only errors', () => {
      const results: CheckResult[] = [
        { passed: false, severity: CheckSeverity.ERROR, message: 'Error 1' },
        { passed: false, severity: CheckSeverity.WARNING, message: 'Warning' },
        { passed: false, severity: CheckSeverity.ERROR, message: 'Error 2' },
      ];

      const errors = runner.getErrors(results);

      expect(errors).toHaveLength(2);
      expect(errors.every((e) => e.severity === CheckSeverity.ERROR)).toBe(true);
    });
  });

  describe('getWarnings()', () => {
    it('should return only warnings', () => {
      const results: CheckResult[] = [
        { passed: false, severity: CheckSeverity.ERROR, message: 'Error' },
        { passed: false, severity: CheckSeverity.WARNING, message: 'Warning 1' },
        { passed: false, severity: CheckSeverity.WARNING, message: 'Warning 2' },
      ];

      const warnings = runner.getWarnings(results);

      expect(warnings).toHaveLength(2);
      expect(warnings.every((w) => w.severity === CheckSeverity.WARNING)).toBe(true);
    });
  });

  describe('formatResults()', () => {
    it('should format errors and warnings', () => {
      const results: CheckResult[] = [
        { passed: false, severity: CheckSeverity.ERROR, message: 'Error 1' },
        { passed: false, severity: CheckSeverity.WARNING, message: 'Warning 1' },
      ];

      const formatted = runner.formatResults(results);

      expect(formatted).toContain('Errors (1)');
      expect(formatted).toContain('Error 1');
      expect(formatted).toContain('Warnings (1)');
      expect(formatted).toContain('Warning 1');
    });

    it('should handle empty results', () => {
      const formatted = runner.formatResults([]);

      expect(formatted).toBe('');
    });
  });

  describe('clear()', () => {
    it('should clear all checks', async () => {
      runner.add(new PassingCheck());
      runner.clear();

      const results = await runner.run(context);

      expect(results).toEqual([]);
    });
  });
});
