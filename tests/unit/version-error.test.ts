/**
 * Version Error Tests
 *
 * Tests for src/errors/version.ts
 */

import { describe, it, expect } from 'vitest';
import { VersionMismatchError } from '../../src/errors/version.js';
import { ErrorCode } from '../../src/errors/base.js';

describe('VersionMismatchError', () => {
  it('has correct error code', () => {
    const error = new VersionMismatchError('0.11.0', '1.0.0');
    expect(error.code).toBe(ErrorCode.VERSION_MISMATCH);
  });

  it('has exit code 7', () => {
    const error = new VersionMismatchError('0.11.0', '1.0.0');
    expect(error.exitCode).toBe(7);
  });

  it('includes versions in message', () => {
    const error = new VersionMismatchError('0.11.0', '1.0.0');
    expect(error.message).toContain('1.0.0');
    expect(error.message).toContain('0.11.0');
  });

  it('provides actionable suggestions', () => {
    const error = new VersionMismatchError('0.11.0', '1.0.0');
    expect(error.suggestions.length).toBe(2);
    expect(error.suggestions[0].steps[0]).toContain('npx kigumi@0.11.0');
    expect(error.suggestions[1].steps[0]).toContain('npx kigumi@1.0.0 upgrade');
  });

  it('stores versions as properties', () => {
    const error = new VersionMismatchError('0.11.0', '1.0.0');
    expect(error.configVersion).toBe('0.11.0');
    expect(error.cliVersion).toBe('1.0.0');
  });
});
