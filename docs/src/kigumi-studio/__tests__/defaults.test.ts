import { describe, it, expect } from 'vitest';
import { buildDefaultValues, DEFAULT_VALUES } from '../lib/defaults';
import { PROPERTY_DEFINITIONS } from '../lib/property-definitions';

describe('buildDefaultValues', () => {
  it('returns a record with one entry per PROPERTY_DEFINITION', () => {
    const defaults = buildDefaultValues();
    expect(Object.keys(defaults)).toHaveLength(PROPERTY_DEFINITIONS.length);
  });

  it('every key is a valid --wa-* CSS variable name', () => {
    const defaults = buildDefaultValues();
    for (const key of Object.keys(defaults)) {
      expect(key).toMatch(/^--wa-/);
    }
  });

  it('every value has non-empty light and dark strings', () => {
    const defaults = buildDefaultValues();
    for (const [key, val] of Object.entries(defaults)) {
      expect(val.light, `${key}.light`).toBeTruthy();
      expect(val.dark, `${key}.dark`).toBeTruthy();
    }
  });

  it('returns a fresh object on each call (no shared references)', () => {
    const a = buildDefaultValues();
    const b = buildDefaultValues();
    expect(a).not.toBe(b);
    a['--wa-color-brand'].light = 'MUTATED';
    expect(b['--wa-color-brand'].light).not.toBe('MUTATED');
  });

  it('matches property definitions defaultLight/defaultDark values', () => {
    const defaults = buildDefaultValues();
    for (const prop of PROPERTY_DEFINITIONS) {
      expect(defaults[prop.cssVar].light).toBe(prop.defaultLight);
      expect(defaults[prop.cssVar].dark).toBe(prop.defaultDark);
    }
  });
});

describe('DEFAULT_VALUES', () => {
  it('has same count as PROPERTY_DEFINITIONS', () => {
    expect(Object.keys(DEFAULT_VALUES)).toHaveLength(
      PROPERTY_DEFINITIONS.length
    );
  });

  it('is consistent with buildDefaultValues output', () => {
    const built = buildDefaultValues();
    for (const [key, val] of Object.entries(DEFAULT_VALUES)) {
      expect(val.light).toBe(built[key].light);
      expect(val.dark).toBe(built[key].dark);
    }
  });
});
