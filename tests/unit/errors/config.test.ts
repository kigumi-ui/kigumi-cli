/**
 * Configuration Error Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ConfigNotFoundError,
  ConfigInvalidError,
  ConfigParseError,
  ConfigFieldMissingError,
  ConfigFieldInvalidError,
} from '../../../src/errors/config.js';
import { ErrorCode } from '../../../src/errors/base.js';

describe('ConfigNotFoundError', () => {
  it('should create error with correct properties', () => {
    const error = new ConfigNotFoundError('/test/path');

    expect(error.code).toBe(ErrorCode.CONFIG_NOT_FOUND);
    expect(error.exitCode).toBe(1);
    expect(error.message).toContain('not found');
    expect(error.context.details?.cwd).toBe('/test/path');
  });

  it('should provide kigumi init suggestion', () => {
    const error = new ConfigNotFoundError('/test/path');

    expect(error.suggestions).toHaveLength(2);
    expect(error.suggestions[0].title.toLowerCase()).toContain('init');
    expect(error.suggestions[0].steps.some((s) => s.includes('kigumi init'))).toBe(true);
  });
});

describe('ConfigInvalidError', () => {
  it('should create error with validation errors', () => {
    const validationErrors = ['Missing field: framework', 'Invalid value for typescript'];
    const error = new ConfigInvalidError(validationErrors, '/path/to/config.json');

    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.exitCode).toBe(1);
    expect(error.context.details?.errors).toEqual(validationErrors);
    expect(error.context.details?.filePath).toBe('/path/to/config.json');
  });

  it('should format errors as bullet list', () => {
    const validationErrors = ['Error 1', 'Error 2'];
    const error = new ConfigInvalidError(validationErrors);
    const formatted = error.format();

    expect(formatted).toContain('Error 1');
    expect(formatted).toContain('Error 2');
    expect(formatted).toContain('  -');
  });

  it('should provide fix suggestions', () => {
    const error = new ConfigInvalidError(['Test error']);

    expect(error.suggestions.length).toBeGreaterThan(0);
    expect(error.suggestions.some((s) => s.title.includes('Fix'))).toBe(true);
  });
});

describe('ConfigParseError', () => {
  it('should create error with parse cause', () => {
    const cause = new SyntaxError('Unexpected token');
    const error = new ConfigParseError('/path/to/config.json', cause);

    expect(error.code).toBe(ErrorCode.CONFIG_PARSE_ERROR);
    expect(error.exitCode).toBe(1);
    expect(error.context.details?.filePath).toBe('/path/to/config.json');
    expect(error.context.cause).toBe(cause);
  });

  it('should suggest JSON validation', () => {
    const cause = new SyntaxError('Unexpected token');
    const error = new ConfigParseError('/path/to/config.json', cause);

    expect(error.suggestions.some((s) =>
      s.steps.some((step) => step.toLowerCase().includes('json'))
    )).toBe(true);
  });
});

describe('ConfigFieldMissingError', () => {
  it('should create error for missing field', () => {
    const error = new ConfigFieldMissingError('framework', '/path/to/config.json');

    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.message).toContain('framework');
    expect(error.context.details?.field).toBe('framework');
  });

  it('should suggest adding the field', () => {
    const error = new ConfigFieldMissingError('framework');

    expect(error.suggestions[0].steps.some((s) => s.includes('"framework"'))).toBe(true);
  });
});

describe('ConfigFieldInvalidError', () => {
  it('should create error with field details', () => {
    const error = new ConfigFieldInvalidError(
      'framework',
      'invalid-framework',
      'string',
      ['react', 'vue', 'svelte']
    );

    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.context.details?.field).toBe('framework');
    expect(error.context.details?.value).toBe('invalid-framework');
    expect(error.context.details?.expectedType).toBe('string');
    expect(error.context.details?.validValues).toEqual(['react', 'vue', 'svelte']);
  });

  it('should show valid values in suggestions', () => {
    const error = new ConfigFieldInvalidError(
      'framework',
      'invalid',
      'string',
      ['react', 'vue']
    );

    const suggestions = error.formatSuggestions();
    expect(suggestions).toContain('react');
    expect(suggestions).toContain('vue');
  });

  it('should work without valid values list', () => {
    const error = new ConfigFieldInvalidError('typescript', 'invalid', 'boolean');

    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.context.details?.validValues).toBeUndefined();
  });
});
