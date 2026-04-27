/**
 * Version Check Utility Tests
 *
 * Tests for src/utils/version-check.ts
 */

import { describe, it, expect } from 'vitest';
import {
  checkVersionCompatibility,
  satisfiesMinimum,
} from '../../src/utils/version-check.js';

describe('checkVersionCompatibility', () => {
  it('returns no-pin when configVersion is undefined', () => {
    const result = checkVersionCompatibility(undefined, '0.12.0');
    expect(result.status).toBe('no-pin');
  });

  it('returns match when versions are identical', () => {
    const result = checkVersionCompatibility('0.12.0', '0.12.0');
    expect(result.status).toBe('match');
  });

  it('returns match when only patch differs', () => {
    const result = checkVersionCompatibility('0.12.0', '0.12.1');
    expect(result.status).toBe('match');
  });

  it('returns minor-mismatch when minor differs', () => {
    const result = checkVersionCompatibility('0.11.0', '0.12.0');
    expect(result).toEqual({
      status: 'minor-mismatch',
      configVersion: '0.11.0',
      cliVersion: '0.12.0',
    });
  });

  it('returns minor-mismatch when CLI is older minor', () => {
    const result = checkVersionCompatibility('0.12.0', '0.11.0');
    expect(result.status).toBe('minor-mismatch');
  });

  it('returns major-mismatch when major differs', () => {
    const result = checkVersionCompatibility('0.12.0', '1.0.0');
    expect(result).toEqual({
      status: 'major-mismatch',
      configVersion: '0.12.0',
      cliVersion: '1.0.0',
    });
  });

  it('returns major-mismatch when CLI major is lower', () => {
    const result = checkVersionCompatibility('1.0.0', '0.12.0');
    expect(result.status).toBe('major-mismatch');
  });

  it('returns match for unparseable versions', () => {
    const result = checkVersionCompatibility('invalid', '0.12.0');
    expect(result.status).toBe('match');
  });

  it('returns match when both are unparseable', () => {
    const result = checkVersionCompatibility('foo', 'bar');
    expect(result.status).toBe('match');
  });
});

describe('satisfiesMinimum', () => {
  it('returns true when version is greater than minimum', () => {
    expect(satisfiesMinimum('1.2.0', '1.0.0')).toBe(true);
  });

  it('returns true when version equals minimum', () => {
    expect(satisfiesMinimum('1.0.0', '1.0.0')).toBe(true);
  });

  it('returns false when version is below minimum', () => {
    expect(satisfiesMinimum('0.9.0', '1.0.0')).toBe(false);
  });

  it('orders pre-releases correctly', () => {
    expect(satisfiesMinimum('1.0.0-beta.1', '1.0.0-alpha.1')).toBe(true);
    expect(satisfiesMinimum('1.0.0-alpha.1', '1.0.0-beta.1')).toBe(false);
  });

  it('treats stable as satisfying a pre-release minimum', () => {
    expect(satisfiesMinimum('1.0.0', '1.0.0-beta.1')).toBe(true);
  });

  it('returns false for invalid version input', () => {
    expect(satisfiesMinimum('invalid', '1.0.0')).toBe(false);
  });

  it('returns false for invalid minimum input', () => {
    expect(satisfiesMinimum('1.0.0', 'invalid')).toBe(false);
  });
});
