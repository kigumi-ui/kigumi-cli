/**
 * Validation & Community Registry Error Tests
 *
 * Tests for src/errors/validation.ts, src/errors/community-registry.ts, src/errors/base.ts
 */

import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { ValidationError } from '../../src/errors/validation.js';
import {
  CommunityRegistryNotFoundError,
  CommunityRegistryInvalidError,
  CommunityComponentNotFoundError,
  FrameworkMismatchError,
  CircularDependencyError,
} from '../../src/errors/community-registry.js';
import {
  UnknownError,
  UserCancelledError,
  ErrorCode,
} from '../../src/errors/base.js';

describe('ValidationError', () => {
  it('creates with valid values list', () => {
    const err = new ValidationError('framework', 'ember', ['react', 'vue']);
    expect(err.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(err.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('react')])
    );
  });

  it('creates without valid values', () => {
    const err = new ValidationError('name', '');
    expect(err.suggestions[0].steps).not.toEqual(
      expect.arrayContaining([expect.stringContaining('Valid values')])
    );
  });

  it('creates with zodError', () => {
    const zodErr = new ZodError([
      { code: 'custom', message: 'bad', path: ['field'] },
    ]);
    const err = new ValidationError('opts', {}, undefined, zodErr);
    expect(err.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('field: bad')])
    );
  });

  it('format() includes valid values when present', () => {
    const err = new ValidationError('tier', 'gold', ['free', 'pro']);
    const f = err.format();
    expect(f).toContain('free');
    expect(f).toContain('Received');
  });

  it('format() includes zod errors when present', () => {
    const zodErr = new ZodError([
      { code: 'custom', message: 'invalid', path: ['x'] },
    ]);
    const err = new ValidationError('opts', 'bad', undefined, zodErr);
    const f = err.format();
    expect(f).toContain('Validation errors');
    expect(f).toContain('x: invalid');
  });

  it('format() without valid values or zod errors', () => {
    const err = new ValidationError('name', 'bad');
    const f = err.format();
    expect(f).toContain('Received');
    expect(f).not.toContain('Valid values');
  });
});

describe('CommunityRegistryNotFoundError', () => {
  it('creates with url', () => {
    const err = new CommunityRegistryNotFoundError(
      'https://github.com/user/repo'
    );
    expect(err.code).toBe(ErrorCode.REGISTRY_ERROR);
  });

  it('creates with cause', () => {
    const cause = new Error('404');
    const err = new CommunityRegistryNotFoundError(
      'https://github.com/user/repo',
      cause
    );
    expect(err.context.cause).toBe(cause);
  });
});

describe('CommunityRegistryInvalidError', () => {
  it('creates with errors', () => {
    const err = new CommunityRegistryInvalidError('url', ['missing name']);
    expect(err.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('missing name')])
    );
  });
});

describe('CommunityComponentNotFoundError', () => {
  it('creates with available components', () => {
    const err = new CommunityComponentNotFoundError('foo', 'reg', [
      'bar',
      'baz',
    ]);
    expect(err.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('bar')])
    );
  });

  it('creates with empty available list', () => {
    const err = new CommunityComponentNotFoundError('foo', 'reg', []);
    expect(err.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('no components')])
    );
  });
});

describe('FrameworkMismatchError', () => {
  it('creates with framework info', () => {
    const err = new FrameworkMismatchError('reg', ['react'], 'vue');
    expect(err.code).toBe(ErrorCode.INVALID_FRAMEWORK);
  });
});

describe('CircularDependencyError', () => {
  it('creates with cycle', () => {
    const err = new CircularDependencyError(['a', 'b', 'a']);
    expect(err.message).toContain('a → b → a');
  });
});

describe('UnknownError', () => {
  it('wraps KigumiError as-is', () => {
    const original = new UserCancelledError();
    expect(UnknownError.from(original)).toBe(original);
  });

  it('wraps Error', () => {
    const err = UnknownError.from(new Error('boom'));
    expect(err.message).toContain('boom');
  });

  it('wraps non-Error', () => {
    const err = UnknownError.from('string error');
    expect(err.message).toContain('string error');
  });
});

describe('KigumiError base', () => {
  it('format() includes details', () => {
    const err = new UnknownError('test', new Error('cause'));
    const f = err.format();
    expect(f).toContain('Caused by: cause');
    expect(f).toContain('Details');
  });

  it('formatSuggestions() returns empty for no suggestions', () => {
    const err = new UserCancelledError();
    expect(err.formatSuggestions()).toBe('');
  });

  it('formatSuggestions() formats steps', () => {
    const err = new UnknownError('test');
    expect(err.formatSuggestions()).toContain('1.');
  });

  it('toJSON() returns structured data', () => {
    const err = new UserCancelledError();
    const json = err.toJSON();
    expect(json.code).toBe(ErrorCode.USER_CANCELLED);
    expect(json.exitCode).toBe(0);
  });

  it('exit codes map correctly', () => {
    expect(new UserCancelledError().exitCode).toBe(0);
  });
});
