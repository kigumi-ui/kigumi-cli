/**
 * Base Error Class Tests
 */

import { describe, it, expect } from 'vitest';
import {
  KigumiError,
  UserCancelledError,
  UnknownError,
  ErrorCode,
} from '../../../src/errors/base.js';

describe('KigumiError', () => {
  class TestError extends KigumiError {
    constructor() {
      super(
        ErrorCode.VALIDATION_FAILED,
        'Test error message',
        { testDetail: 'value' },
        [
          {
            title: 'Test suggestion',
            steps: ['Step 1', 'Step 2'],
          },
        ]
      );
    }
  }

  it('should create error with correct properties', () => {
    const error = new TestError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(KigumiError);
    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.message).toBe('Test error message');
    expect(error.exitCode).toBe(2); // Validation errors = exit code 2
    expect(error.context.details).toEqual({ testDetail: 'value' });
    expect(error.suggestions).toHaveLength(1);
  });

  it('should map error codes to correct exit codes', () => {
    const testCases: Array<[ErrorCode, number]> = [
      [ErrorCode.USER_CANCELLED, 0],
      [ErrorCode.CONFIG_NOT_FOUND, 1],
      [ErrorCode.CONFIG_INVALID, 1],
      [ErrorCode.VALIDATION_FAILED, 2],
      [ErrorCode.INVALID_FRAMEWORK, 2],
      [ErrorCode.TIER_RESTRICTION, 3],
      [ErrorCode.PRO_COMPONENT_REQUIRED, 3],
      [ErrorCode.FILE_NOT_FOUND, 4],
      [ErrorCode.FILE_WRITE_ERROR, 4],
      [ErrorCode.DEPENDENCY_INSTALL_FAILED, 5],
      [ErrorCode.NETWORK_ERROR, 5],
      [ErrorCode.PREFLIGHT_CHECK_FAILED, 6],
      [ErrorCode.MISSING_DEPENDENCY, 6],
    ];

    for (const [code, expectedExitCode] of testCases) {
      class TestError extends KigumiError {
        constructor() {
          super(code, 'Test');
        }
      }
      const error = new TestError();
      expect(error.exitCode).toBe(expectedExitCode);
    }
  });

  it('should format error message', () => {
    const error = new TestError();
    const formatted = error.format();

    expect(formatted).toContain('Test error message');
    expect(formatted).toContain('Details:');
    expect(formatted).toContain('testDetail');
  });

  it('should format suggestions', () => {
    const error = new TestError();
    const suggestions = error.formatSuggestions();

    expect(suggestions).toContain('Test suggestion');
    expect(suggestions).toContain('1. Step 1');
    expect(suggestions).toContain('2. Step 2');
  });

  it('should convert to JSON', () => {
    const error = new TestError();
    const json = error.toJSON();

    expect(json).toHaveProperty('name');
    expect(json).toHaveProperty('code');
    expect(json).toHaveProperty('exitCode');
    expect(json).toHaveProperty('message');
    expect(json).toHaveProperty('context');
    expect(json).toHaveProperty('suggestions');
    expect(json).toHaveProperty('stack');
  });

  it('should include cause in context', () => {
    const cause = new Error('Original error');

    class TestErrorWithCause extends KigumiError {
      constructor() {
        super(ErrorCode.FILE_READ_ERROR, 'Failed to read file', {}, [], cause);
      }
    }

    const error = new TestErrorWithCause();
    expect(error.context.cause).toBe(cause);

    const formatted = error.format();
    expect(formatted).toContain('Caused by: Original error');
  });
});

describe('UserCancelledError', () => {
  it('should have exit code 0', () => {
    const error = new UserCancelledError();
    expect(error.exitCode).toBe(0);
    expect(error.code).toBe(ErrorCode.USER_CANCELLED);
  });

  it('should have default message', () => {
    const error = new UserCancelledError();
    expect(error.message).toBe('Operation cancelled by user');
  });

  it('should accept custom message', () => {
    const error = new UserCancelledError('Custom cancel message');
    expect(error.message).toBe('Custom cancel message');
  });
});

describe('UnknownError', () => {
  it('should wrap regular Error', () => {
    const originalError = new Error('Something went wrong');
    const error = UnknownError.from(originalError);

    expect(error).toBeInstanceOf(UnknownError);
    expect(error.code).toBe(ErrorCode.UNKNOWN);
    expect(error.message).toContain('Something went wrong');
    expect(error.context.cause).toBe(originalError);
  });

  it('should return KigumiError as-is', () => {
    const originalError = new UserCancelledError();
    const error = UnknownError.from(originalError);

    expect(error).toBe(originalError);
  });

  it('should wrap non-Error values', () => {
    const error = UnknownError.from('String error');

    expect(error).toBeInstanceOf(UnknownError);
    expect(error.message).toContain('String error');
  });

  it('should include suggestion to report issue', () => {
    const error = new UnknownError('Test', new Error());

    expect(error.suggestions).toHaveLength(1);
    expect(error.suggestions[0].title).toContain('unexpected error');
    expect(error.suggestions[0].steps.some((s) => s.includes('github'))).toBe(
      true
    );
  });
});
