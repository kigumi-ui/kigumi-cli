/**
 * Config & Filesystem Error Tests
 *
 * Tests for src/errors/config.ts, src/errors/filesystem.ts, src/errors/tier.ts
 */

import { describe, it, expect } from 'vitest';
import {
  ConfigNotFoundError,
  ConfigInvalidError,
  ConfigParseError,
  ConfigFieldMissingError,
  ConfigFieldInvalidError,
} from '../../src/errors/config.js';
import {
  FileNotFoundError,
  FileReadError,
  FileWriteError,
  DirectoryNotFoundError,
  PermissionDeniedError,
  ComponentExistsError,
} from '../../src/errors/filesystem.js';
import { ErrorCode } from '../../src/errors/base.js';
import {
  TierRestrictionError,
  ProComponentRequiredError,
  ProThemeRequiredError,
  TokenRequiredError,
  TokenInvalidError,
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

  it('ConfigParseError with cause', () => {
    const err = new ConfigParseError(
      '/tmp/config.json',
      new Error('Unexpected token')
    );
    expect(err.code).toBe(ErrorCode.CONFIG_PARSE_ERROR);
    expect(err.context.cause).toBeDefined();
  });

  it('ConfigFieldMissingError', () => {
    const err = new ConfigFieldMissingError('framework');
    expect(err.message).toContain('framework');
  });

  it('ConfigFieldInvalidError with valid values', () => {
    const err = new ConfigFieldInvalidError('framework', 'ember', 'string', [
      'react',
      'vue',
    ]);
    expect(err.suggestions[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('react')])
    );
  });

  it('ConfigFieldInvalidError without valid values', () => {
    const err = new ConfigFieldInvalidError('port', 'abc', 'number');
    expect(err.suggestions[0].steps).not.toEqual(
      expect.arrayContaining([expect.stringContaining('Valid values')])
    );
  });
});

describe('Filesystem errors', () => {
  it('FileNotFoundError', () => {
    const err = new FileNotFoundError('/tmp/missing.ts');
    expect(err.code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect(err.exitCode).toBe(4);
  });

  it('FileReadError', () => {
    const err = new FileReadError('/tmp/file.ts', new Error('EACCES'));
    expect(err.code).toBe(ErrorCode.FILE_READ_ERROR);
  });

  it('FileWriteError', () => {
    const err = new FileWriteError('/tmp/file.ts', new Error('ENOSPC'));
    expect(err.code).toBe(ErrorCode.FILE_WRITE_ERROR);
  });

  it('DirectoryNotFoundError', () => {
    const err = new DirectoryNotFoundError('/tmp/missing');
    expect(err.code).toBe(ErrorCode.DIRECTORY_NOT_FOUND);
  });

  it('PermissionDeniedError', () => {
    const err = new PermissionDeniedError('/tmp/secret', 'read');
    expect(err.code).toBe(ErrorCode.PERMISSION_DENIED);
  });

  it('ComponentExistsError', () => {
    const err = new ComponentExistsError('button', '/src/components/button');
    expect(err.code).toBe(ErrorCode.FILE_WRITE_ERROR);
    expect(err.suggestions).toHaveLength(2);
  });
});

describe('Tier errors', () => {
  it('TierRestrictionError', () => {
    const err = new TierRestrictionError('premium-charts', 'pro', 'free');
    expect(err.code).toBe(ErrorCode.TIER_RESTRICTION);
    expect(err.exitCode).toBe(3);
    expect(err.suggestions).toHaveLength(2);
  });

  it('ProComponentRequiredError with alternatives', () => {
    const err = new ProComponentRequiredError('data-grid', ['table', 'list']);
    expect(err.code).toBe(ErrorCode.PRO_COMPONENT_REQUIRED);
    expect(err.suggestions).toHaveLength(2);
    expect(err.suggestions[1].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('table')])
    );
  });

  it('ProComponentRequiredError without alternatives', () => {
    const err = new ProComponentRequiredError('data-grid');
    expect(err.suggestions).toHaveLength(1);
  });

  it('ProComponentRequiredError with empty alternatives', () => {
    const err = new ProComponentRequiredError('data-grid', []);
    expect(err.suggestions).toHaveLength(1);
  });

  it('ProThemeRequiredError', () => {
    const err = new ProThemeRequiredError('sleek', ['awesome', 'default']);
    expect(err.code).toBe(ErrorCode.PRO_THEME_REQUIRED);
  });

  it('TokenRequiredError', () => {
    const err = new TokenRequiredError();
    expect(err.code).toBe(ErrorCode.TOKEN_REQUIRED);
    expect(err.suggestions).toHaveLength(2);
  });

  it('TokenInvalidError with 401', () => {
    const err = new TokenInvalidError(401, 'Unauthorized');
    expect(err.code).toBe(ErrorCode.TOKEN_INVALID);
    expect(err.suggestions[1].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('401')])
    );
  });

  it('TokenInvalidError without status code', () => {
    const err = new TokenInvalidError();
    expect(err.code).toBe(ErrorCode.TOKEN_INVALID);
  });

  it('TokenInvalidError with message only', () => {
    const err = new TokenInvalidError(undefined, 'Token expired');
    expect(err.suggestions[1].steps).toEqual(
      expect.arrayContaining([expect.stringContaining('Token expired')])
    );
  });
});
