/**
 * Version Check Utility Tests
 *
 * Tests for src/utils/version-check.ts
 */

import { describe, it, expect } from 'vitest';
import { checkVersionCompatibility } from '../../src/utils/version-check.js';

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
