/**
 * CEM Sync Validation Tests
 *
 * Tests for scripts/validate-cem-sync.ts — verifies that every component in
 * CEM has a registry entry and vice versa.
 *
 * NOTE: These run against the current project state. If the registry or CEM
 * changes, assertions may need updating.
 */

import { describe, it, expect } from 'vitest';
import {
  validateCemSync,
  parseStringEnum,
  allowlistedKeysInRegistry,
} from '../../scripts/validate-cem-sync.js';

describe('validate:cem-sync', () => {
  it('should return a valid result structure', async () => {
    const result = await validateCemSync();

    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('stats');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('should report non-zero CEM and registry component counts', async () => {
    const result = await validateCemSync();

    expect(result.stats.metadataComponents).toBeGreaterThan(0);
    expect(result.stats.registryComponents).toBeGreaterThan(0);
  });

  it('should have synced components when both sources are populated', async () => {
    const result = await validateCemSync();

    expect(result.stats.synced).toBeGreaterThan(0);
  });

  it('should categorize all findings with valid severity and category', async () => {
    const result = await validateCemSync();

    for (const finding of result.findings) {
      expect(['error', 'warning']).toContain(finding.severity);
      expect(finding.component).toBeTruthy();
      expect(finding.message).toBeTruthy();
      expect([
        'missing-from-registry',
        'missing-from-cem',
        'prop-value-drift',
        'allowlisted-but-wrapped',
      ]).toContain(finding.category);
    }
  });

  it('should pass when no error-severity findings exist', async () => {
    const result = await validateCemSync();

    const errors = result.findings.filter((f) => f.severity === 'error');
    expect(result.passed).toBe(errors.length === 0);
  });

  it('onlyInCem stat matches count of missing-from-registry findings', async () => {
    const result = await validateCemSync();

    const missing = result.findings.filter(
      (f) => f.category === 'missing-from-registry'
    ).length;
    expect(result.stats.onlyInCem).toBe(missing);
  });

  it('onlyInRegistry stat matches count of missing-from-cem findings', async () => {
    const result = await validateCemSync();

    const missing = result.findings.filter(
      (f) => f.category === 'missing-from-cem'
    ).length;
    expect(result.stats.onlyInRegistry).toBe(missing);
  });

  it('propValueDrift stat matches count of prop-value-drift findings', async () => {
    const result = await validateCemSync();

    const drift = result.findings.filter(
      (f) => f.category === 'prop-value-drift'
    ).length;
    expect(result.stats.propValueDrift).toBe(drift);
  });

  it('reports whether the prop-value half actually ran', async (ctx) => {
    // Every assertion above holds just as well when no manifest was read --
    // which is how the silent no-op survived. This one asserts the premise the
    // others depend on, so a run that compared nothing cannot look like a run
    // that compared everything.
    const result = await validateCemSync();

    if (!result.cem.usable) {
      // No complete manifest here (fresh clone, no Pro install). That is a
      // legitimate environment, but it must surface as a skip, never as a
      // silent pass.
      ctx.skip();
      return;
    }

    expect(result.cem.outcome).toBe('complete');
    expect(result.cem.reason).toMatch(/\d+ components/);
  });
});

describe('parseStringEnum (prop-value drift discriminator)', () => {
  it('parses a pure string-literal union into its members', () => {
    expect(parseStringEnum("'small' | 'medium' | 'large'")).toEqual([
      'small',
      'medium',
      'large',
    ]);
  });

  it('recognises the widened WA 3.6.0 size union', () => {
    expect(
      parseStringEnum(
        "'xs' | 's' | 'm' | 'l' | 'xl' | 'small' | 'medium' | 'large'"
      )
    ).toEqual(['xs', 's', 'm', 'l', 'xl', 'small', 'medium', 'large']);
  });

  it('returns null for open-ended (non-enum) types', () => {
    expect(parseStringEnum('string')).toBeNull();
    expect(parseStringEnum('number')).toBeNull();
    expect(parseStringEnum(undefined)).toBeNull();
  });

  it('returns null for mixed unions that are not all string literals', () => {
    // A union mixing a literal with an open type is not a closed enum.
    expect(parseStringEnum("'small' | string")).toBeNull();
    expect(parseStringEnum("boolean | 'auto'")).toBeNull();
  });

  it('handles double-quoted literals', () => {
    expect(parseStringEnum('"a" | "b"')).toEqual(['a', 'b']);
  });
});

describe('allowlistedKeysInRegistry', () => {
  it('returns allowlist keys that also appear in the registry', () => {
    expect(
      allowlistedKeysInRegistry(
        ['video', 'button', 'data-grid'],
        new Set(['video', 'date-picker'])
      )
    ).toEqual(['video']);
  });

  it('returns empty when the allowlist and registry are disjoint', () => {
    expect(
      allowlistedKeysInRegistry(
        ['button', 'input'],
        new Set(['data-grid', 'date-picker'])
      )
    ).toEqual([]);
  });
});
