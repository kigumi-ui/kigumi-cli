/**
 * Validation Error Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  InvalidFrameworkError,
  InvalidComponentError,
  InvalidThemeError,
  InvalidPaletteError,
} from '../../../src/errors/validation.js';
import { ErrorCode } from '../../../src/errors/base.js';

describe('ValidationError', () => {
  it('should create error with field and value', () => {
    const error = new ValidationError('framework', 'invalid', ['react', 'vue']);

    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.exitCode).toBe(2);
    expect(error.context.details?.field).toBe('framework');
    expect(error.context.details?.value).toBe('invalid');
    expect(error.context.details?.validValues).toEqual(['react', 'vue']);
  });

  it('should format with valid values', () => {
    const error = new ValidationError('framework', 'invalid', ['react', 'vue']);
    const formatted = error.format();

    expect(formatted).toContain('framework');
    expect(formatted).toContain('invalid');
    expect(formatted).toContain('react');
    expect(formatted).toContain('vue');
  });

  it('should work without valid values', () => {
    const error = new ValidationError('field', 'value');

    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.context.details?.validValues).toBeUndefined();
  });
});

describe('InvalidFrameworkError', () => {
  it('should create error with framework details', () => {
    const error = new InvalidFrameworkError('ember', [
      'react',
      'vue',
      'svelte',
    ]);

    expect(error.code).toBe(ErrorCode.INVALID_FRAMEWORK);
    expect(error.exitCode).toBe(2);
    expect(error.message).toContain('ember');
    expect(error.context.details?.framework).toBe('ember');
    expect(error.context.details?.supportedFrameworks).toEqual([
      'react',
      'vue',
      'svelte',
    ]);
  });

  it('should list supported frameworks in suggestions', () => {
    const error = new InvalidFrameworkError('ember', ['react', 'vue']);

    const suggestions = error.formatSuggestions();
    expect(suggestions).toContain('react');
    expect(suggestions).toContain('vue');
  });
});

describe('InvalidComponentError', () => {
  it('should create error with component name', () => {
    const error = new InvalidComponentError('invalid-component', [
      'button',
      'input',
    ]);

    expect(error.code).toBe(ErrorCode.INVALID_COMPONENT);
    expect(error.exitCode).toBe(2);
    expect(error.message).toContain('invalid-component');
    expect(error.context.details?.componentName).toBe('invalid-component');
    expect(error.context.details?.availableComponents).toEqual([
      'button',
      'input',
    ]);
  });

  it('should list available components', () => {
    const error = new InvalidComponentError('invalid', ['button', 'input']);

    const suggestions = error.formatSuggestions();
    expect(suggestions).toContain('button');
    expect(suggestions).toContain('input');
  });

  it('should work without available components list', () => {
    const error = new InvalidComponentError('invalid');

    expect(error.code).toBe(ErrorCode.INVALID_COMPONENT);
    const suggestions = error.formatSuggestions();
    expect(suggestions).toContain('kigumi list');
  });
});

describe('InvalidThemeError', () => {
  it('should create error with theme and tier info', () => {
    const error = new InvalidThemeError(
      'custom',
      ['default', 'awesome'],
      'free'
    );

    expect(error.code).toBe(ErrorCode.INVALID_THEME);
    expect(error.exitCode).toBe(2);
    expect(error.context.details?.theme).toBe('custom');
    expect(error.context.details?.availableThemes).toEqual([
      'default',
      'awesome',
    ]);
    expect(error.context.details?.tier).toBe('free');
  });

  it('should list available themes for tier', () => {
    const error = new InvalidThemeError(
      'custom',
      ['default', 'awesome'],
      'free'
    );

    const suggestions = error.formatSuggestions();
    expect(suggestions).toContain('free tier');
    expect(suggestions).toContain('default');
    expect(suggestions).toContain('awesome');
  });
});

describe('InvalidPaletteError', () => {
  it('should create error with palette info', () => {
    const error = new InvalidPaletteError('custom', ['default', 'bright']);

    expect(error.code).toBe(ErrorCode.INVALID_PALETTE);
    expect(error.exitCode).toBe(2);
    expect(error.context.details?.palette).toBe('custom');
    expect(error.context.details?.availablePalettes).toEqual([
      'default',
      'bright',
    ]);
  });

  it('should list available palettes', () => {
    const error = new InvalidPaletteError('custom', ['default', 'bright']);

    const suggestions = error.formatSuggestions();
    expect(suggestions).toContain('default');
    expect(suggestions).toContain('bright');
  });
});
