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
import { validateCemSync } from '../../scripts/validate-cem-sync.js';

describe('validate:cem-sync', () => {
  it('should return a valid result structure', () => {
    const result = validateCemSync();

    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('stats');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('should report non-zero CEM and registry component counts', () => {
    const result = validateCemSync();

    expect(result.stats.cemComponents).toBeGreaterThan(0);
    expect(result.stats.registryComponents).toBeGreaterThan(0);
  });

  it('should have synced components when both sources are populated', () => {
    const result = validateCemSync();

    expect(result.stats.synced).toBeGreaterThan(0);
  });

  it('should categorize all findings with valid severity and category', () => {
    const result = validateCemSync();

    for (const finding of result.findings) {
      expect(['error', 'warning']).toContain(finding.severity);
      expect(finding.component).toBeTruthy();
      expect(finding.message).toBeTruthy();
      expect(['missing-from-registry', 'missing-from-cem']).toContain(
        finding.category
      );
    }
  });

  it('should pass when no error-severity findings exist', () => {
    const result = validateCemSync();

    const errors = result.findings.filter((f) => f.severity === 'error');
    expect(result.passed).toBe(errors.length === 0);
  });

  it('onlyInCem stat matches count of missing-from-registry findings', () => {
    const result = validateCemSync();

    const missing = result.findings.filter(
      (f) => f.category === 'missing-from-registry'
    ).length;
    expect(result.stats.onlyInCem).toBe(missing);
  });

  it('onlyInRegistry stat matches count of missing-from-cem findings', () => {
    const result = validateCemSync();

    const missing = result.findings.filter(
      (f) => f.category === 'missing-from-cem'
    ).length;
    expect(result.stats.onlyInRegistry).toBe(missing);
  });
});
