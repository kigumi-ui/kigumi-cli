/**
 * Options Schema Validation Tests
 *
 * Tests for src/schemas/options.ts schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  validators,
  validateOptions,
  initOptionsSchema,
} from '../../src/schemas/options.js';

describe('validators.init', () => {
  it('validates empty options', () => {
    const result = validators.init({});
    expect(result).toBeDefined();
  });

  it('validates full options', () => {
    const result = validators.init({
      framework: 'react',
      typescript: true,
      theme: 'awesome',
      palette: 'default',
      brand: 'blue',
      brandColor: 'red',
      token: 'abc123',
      componentsDir: 'src/ui',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      yes: true,
      install: false,
      cwd: '/tmp',
    });
    expect(result.framework).toBe('react');
    expect(result.yes).toBe(true);
    expect(result.install).toBe(false);
  });

  it('rejects invalid framework', () => {
    expect(() => validators.init({ framework: 'ember' })).toThrow(
      'Invalid options'
    );
  });
});

describe('validators.add', () => {
  it('validates empty options with defaults', () => {
    const result = validators.add({});
    expect(result.force).toBe(false);
    expect(result.all).toBe(false);
    expect(result.tests).toBe(false);
  });

  it('validates --from option', () => {
    const result = validators.add({ from: 'https://github.com/user/repo' });
    expect(result.from).toBe('https://github.com/user/repo');
  });

  it('validates force and all flags', () => {
    const result = validators.add({ force: true, all: true });
    expect(result.force).toBe(true);
    expect(result.all).toBe(true);
  });
});

describe('validateOptions', () => {
  it('throws formatted error on invalid input', () => {
    expect(() =>
      validateOptions(initOptionsSchema, { framework: 123 })
    ).toThrow('Invalid options');
  });

  it('formats error paths correctly', () => {
    expect.assertions(1);
    try {
      validateOptions(initOptionsSchema, { framework: 'ember' });
    } catch (e) {
      expect((e as Error).message).toContain('framework');
    }
  });
});
