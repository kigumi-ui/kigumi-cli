/**
 * CEM Sync Validation Tests
 *
 * Tests for scripts/validate-cem-sync.ts - CEM-to-Registry drift detection
 *
 * NOTE: These are snapshot-style tests that run against the current project state
 * (real registry + real CEM metadata). If the registry or CEM changes,
 * some assertions may need updating.
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

  it('should detect event drift for components with CEM events but no registry events', () => {
    const result = validateCemSync();

    // We know from running the script that many components have events in CEM
    // but no events in registry (e.g., button, checkbox, icon)
    const eventDriftFindings = result.findings.filter(
      (f) => f.category === 'event-drift'
    );
    expect(eventDriftFindings.length).toBeGreaterThan(0);
  });

  it('should detect slot drift for components with CEM slots but no registry slots', () => {
    const result = validateCemSync();

    const slotDriftFindings = result.findings.filter(
      (f) => f.category === 'slot-drift'
    );
    expect(slotDriftFindings.length).toBeGreaterThan(0);
  });

  it('should detect method drift for components with CEM methods but no registry methods', () => {
    const result = validateCemSync();

    const methodDriftFindings = result.findings.filter(
      (f) => f.category === 'method-drift'
    );
    expect(methodDriftFindings.length).toBeGreaterThan(0);
  });

  it('should categorize all findings with valid severity levels', () => {
    const result = validateCemSync();

    for (const finding of result.findings) {
      expect(['error', 'warning']).toContain(finding.severity);
      expect(finding.component).toBeTruthy();
      expect(finding.message).toBeTruthy();
      expect([
        'missing-from-registry',
        'missing-from-cem',
        'event-drift',
        'slot-drift',
        'method-drift',
      ]).toContain(finding.category);
    }
  });

  it('should pass when no error-severity findings exist', () => {
    const result = validateCemSync();

    const errors = result.findings.filter((f) => f.severity === 'error');
    expect(result.passed).toBe(errors.length === 0);
  });

  it('should count stats consistently with findings', () => {
    const result = validateCemSync();

    const eventDrifts = result.findings.filter(
      (f) => f.category === 'event-drift'
    ).length;
    const slotDrifts = result.findings.filter(
      (f) => f.category === 'slot-drift'
    ).length;
    const methodDrifts = result.findings.filter(
      (f) => f.category === 'method-drift'
    ).length;

    expect(result.stats.eventDrifts).toBe(eventDrifts);
    expect(result.stats.slotDrifts).toBe(slotDrifts);
    expect(result.stats.methodDrifts).toBe(methodDrifts);
  });
});
