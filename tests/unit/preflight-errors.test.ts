/**
 * PreFlight Error Tests
 *
 * Tests for src/errors/preflight.ts
 */

import { describe, it, expect } from 'vitest';
import {
  PreFlightCheckError,
  MissingDependencyError,
  IncompatibleVersionError,
} from '../../src/errors/preflight.js';
import { CheckSeverity } from '../../src/checks/types.js';
import { ErrorCode } from '../../src/errors/base.js';

describe('PreFlightCheckError', () => {
  it('creates error with errors and warnings', () => {
    const results = [
      {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: 'err1',
        suggestion: ['fix it'],
      },
      { passed: false, severity: CheckSeverity.WARNING, message: 'warn1' },
      { passed: true, severity: CheckSeverity.INFO, message: 'ok' },
    ];

    const error = new PreFlightCheckError(results);
    expect(error.code).toBe(ErrorCode.PREFLIGHT_CHECK_FAILED);
    expect(error.message).toBe('Pre-flight checks failed');
    expect(error.suggestions).toHaveLength(1);
    expect(error.suggestions[0].title).toBe('err1');
    expect(error.suggestions[0].steps).toEqual(['fix it']);
  });

  it('uses generic suggestion when no check has suggestions', () => {
    const results = [
      {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: 'no suggestion error',
      },
    ];

    const error = new PreFlightCheckError(results);
    expect(error.suggestions[0].title).toBe('Fix the issues and try again');
    expect(error.suggestions[0].steps).toContain('no suggestion error');
  });

  it('skips checks with empty suggestion arrays', () => {
    const results = [
      {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: 'empty suggestion',
        suggestion: [],
      },
    ];

    const error = new PreFlightCheckError(results);
    expect(error.suggestions[0].title).toBe('Fix the issues and try again');
  });

  it('format() shows errors and warnings', () => {
    const results = [
      { passed: false, severity: CheckSeverity.ERROR, message: 'Bad config' },
      {
        passed: false,
        severity: CheckSeverity.WARNING,
        message: 'Old version',
      },
    ];

    const error = new PreFlightCheckError(results);
    const formatted = error.format();
    expect(formatted).toContain('Errors (1)');
    expect(formatted).toContain('✗ Bad config');
    expect(formatted).toContain('Warnings (1)');
    expect(formatted).toContain('⚠ Old version');
  });

  it('format() shows errors only when no warnings', () => {
    const results = [
      { passed: false, severity: CheckSeverity.ERROR, message: 'err' },
    ];

    const error = new PreFlightCheckError(results);
    const formatted = error.format();
    expect(formatted).toContain('Errors (1)');
    expect(formatted).not.toContain('Warnings');
  });

  it('format() shows warnings only when no errors', () => {
    const results = [
      { passed: false, severity: CheckSeverity.WARNING, message: 'warn' },
    ];

    const error = new PreFlightCheckError(results);
    const formatted = error.format();
    expect(formatted).toContain('Warnings (1)');
    expect(formatted).not.toContain('Errors (');
  });

  it('format() handles empty checks', () => {
    const results = [
      { passed: true, severity: CheckSeverity.INFO, message: 'all good' },
    ];

    const error = new PreFlightCheckError(results);
    const formatted = error.format();
    expect(formatted).toContain('Pre-flight checks failed:');
  });
});

describe('MissingDependencyError', () => {
  it('creates error for node_modules context', () => {
    const error = new MissingDependencyError('react', 'node_modules', 'pnpm');
    expect(error.code).toBe(ErrorCode.MISSING_DEPENDENCY);
    expect(error.message).toContain('react');
    expect(error.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('pnpm add react')])
    );
  });

  it('creates error for node_modules context with npm', () => {
    const error = new MissingDependencyError('react', 'node_modules', 'npm');
    expect(error.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('npm install react')])
    );
  });

  it('creates error for package.json context', () => {
    const error = new MissingDependencyError('vue', 'package.json', 'yarn');
    expect(error.suggestions[0].title).toBe('Add dependency to package.json');
    expect(error.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('yarn add vue')])
    );
  });

  it('creates error for package.json context with npm', () => {
    const error = new MissingDependencyError('vue', 'package.json', 'npm');
    expect(error.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('npm install vue')])
    );
  });

  it('creates error for global context', () => {
    const error = new MissingDependencyError('typescript', 'global', 'npm');
    expect(error.suggestions[0].title).toBe('Install global dependency');
    expect(error.suggestions[0].steps).toEqual(
      expect.arrayContaining([
        expect.stringContaining('npm install -g typescript'),
      ])
    );
  });
});

describe('IncompatibleVersionError', () => {
  it('creates error with version details', () => {
    const error = new IncompatibleVersionError('react', '16.0.0', '>=18.0.0');
    expect(error.code).toBe(ErrorCode.INCOMPATIBLE_VERSION);
    expect(error.message).toContain('react');
    expect(error.suggestions[0].steps).toEqual(
      expect.arrayContaining([
        expect.stringContaining('16.0.0'),
        expect.stringContaining('>=18.0.0'),
      ])
    );
  });
});
