/**
 * Parity Validation Tests
 *
 * Tests for scripts/validate-parity.ts - Cross-framework parity checking
 *
 * NOTE: These are snapshot-style tests that run against the current project state
 * (real registry + real template directories). If the registry or templates change,
 * some assertions may need updating.
 */

import { describe, it, expect } from 'vitest';
import { validateParity } from '../../scripts/validate-parity.js';

describe('validate:parity', () => {
  it('should return a valid result structure', async () => {
    const result = await validateParity();

    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('stats');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('should report non-zero total components', async () => {
    const result = await validateParity();

    expect(result.stats.totalComponents).toBeGreaterThan(0);
  });

  it('should report no findings against the real repo state', async () => {
    // The registry and templates are expected to be in sync on a clean tree.
    // Detection itself is proven separately, against a synthetic registry, so
    // this assertion does not depend on debt existing to be meaningful.
    const result = await validateParity();

    expect(result.findings).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('should categorize all findings with valid severity levels', async () => {
    const result = await validateParity();

    for (const finding of result.findings) {
      expect(['error', 'warning']).toContain(finding.severity);
      expect(finding.component).toBeTruthy();
      expect(finding.message).toBeTruthy();
      expect(['registry-files-gap', 'orphaned-template']).toContain(
        finding.category
      );
    }
  });

  it('should pass when no error-severity findings exist', async () => {
    const result = await validateParity();

    const errors = result.findings.filter((f) => f.severity === 'error');
    expect(result.passed).toBe(errors.length === 0);
  });

  it('should count registryFilesGaps consistently with findings', async () => {
    const result = await validateParity();

    const gapCount = result.findings.filter(
      (f) => f.category === 'registry-files-gap'
    ).length;
    expect(result.stats.registryFilesGaps).toBe(gapCount);
  });
});
