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
  listOptionsSchema,
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

  it('validates tier option', () => {
    const result = validators.init({ tier: 'pro' });
    expect(result.tier).toBe('pro');
  });

  it('rejects invalid tier', () => {
    expect(() => validators.init({ tier: 'enterprise' })).toThrow();
  });
});

describe('validators.add', () => {
  it('validates empty options with defaults', () => {
    const result = validators.add({});
    expect(result.overwrite).toBe(false);
    expect(result.all).toBe(false);
    expect(result.tests).toBe(false);
  });

  it('validates --from option', () => {
    const result = validators.add({ from: 'https://github.com/user/repo' });
    expect(result.from).toBe('https://github.com/user/repo');
  });

  it('validates overwrite and all flags', () => {
    const result = validators.add({ overwrite: true, all: true });
    expect(result.overwrite).toBe(true);
    expect(result.all).toBe(true);
  });
});

describe('validators.list', () => {
  it('validates empty options', () => {
    const result = validators.list({});
    expect(result.json).toBe(false);
  });

  it('validates tier filter', () => {
    const result = validators.list({ tier: 'free', category: 'form' });
    expect(result.tier).toBe('free');
    expect(result.category).toBe('form');
  });

  it('validates json flag', () => {
    const result = validators.list({ json: true });
    expect(result.json).toBe(true);
  });
});

describe('validators.themeSet', () => {
  it('validates empty options', () => {
    const result = validators.themeSet({});
    expect(result).toBeDefined();
  });

  it('validates cwd option', () => {
    const result = validators.themeSet({ cwd: '/tmp' });
    expect(result.cwd).toBe('/tmp');
  });
});

describe('validators.palette', () => {
  it('validates empty options', () => {
    const result = validators.palette({});
    expect(result).toBeDefined();
  });
});

describe('validators.brand', () => {
  it('validates empty options', () => {
    const result = validators.brand({});
    expect(result).toBeDefined();
  });
});

describe('validateOptions', () => {
  it('throws formatted error on invalid input', () => {
    expect(() =>
      validateOptions(initOptionsSchema, { framework: 123 })
    ).toThrow('Invalid options');
  });

  it('formats error paths correctly', () => {
    try {
      validateOptions(listOptionsSchema, { tier: 'invalid' });
    } catch (e) {
      expect((e as Error).message).toContain('tier');
    }
  });
});
