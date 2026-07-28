/**
 * Config & Tier Error Tests
 *
 * Tests for src/errors/config.ts, src/errors/tier.ts
 */

import { describe, it, expect } from 'vitest';
import {
  ConfigNotFoundError,
  ConfigInvalidError,
} from '../../src/errors/config.js';
import { ErrorCode } from '../../src/errors/base.js';
import {
  TierRestrictionError,
  ProThemeRequiredError,
} from '../../src/errors/tier.js';

describe('Config errors', () => {
  it('ConfigNotFoundError', () => {
    const err = new ConfigNotFoundError('/tmp');
    expect(err.code).toBe(ErrorCode.CONFIG_NOT_FOUND);
    expect(err.exitCode).toBe(1);
  });

  it('ConfigInvalidError format', () => {
    const err = new ConfigInvalidError(
      ['missing framework'],
      '/tmp/config.json'
    );
    expect(err.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(err.format()).toContain('missing framework');
  });
});

describe('Tier errors', () => {
  it('TierRestrictionError', () => {
    const err = new TierRestrictionError('premium-charts', 'pro', 'free');
    expect(err.code).toBe(ErrorCode.TIER_RESTRICTION);
    expect(err.exitCode).toBe(3);
    expect(err.suggestions).toHaveLength(2);
  });

  it('ProThemeRequiredError', () => {
    const err = new ProThemeRequiredError('sleek', ['awesome', 'default']);
    expect(err.code).toBe(ErrorCode.PRO_THEME_REQUIRED);
  });
});
