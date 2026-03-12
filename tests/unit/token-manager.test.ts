/**
 * Token Manager Tests
 *
 * Tests for src/utils/token-manager.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock @clack/prompts for promptForToken tests
vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
}));

describe('isValidTokenFormat', () => {
  it('should accept valid alphanumeric token', async () => {
    const { isValidTokenFormat } =
      await import('../../src/utils/token-manager.js');
    expect(isValidTokenFormat('abcdef1234567890')).toBe(true);
  });

  it('should accept tokens with hyphens and underscores', async () => {
    const { isValidTokenFormat } =
      await import('../../src/utils/token-manager.js');
    expect(isValidTokenFormat('abc-def_123-456')).toBe(true);
  });

  it('should reject empty string', async () => {
    const { isValidTokenFormat } =
      await import('../../src/utils/token-manager.js');
    expect(isValidTokenFormat('')).toBe(false);
  });

  it('should reject short tokens (< 10 chars)', async () => {
    const { isValidTokenFormat } =
      await import('../../src/utils/token-manager.js');
    expect(isValidTokenFormat('short')).toBe(false);
    expect(isValidTokenFormat('123456789')).toBe(false);
  });

  it('should accept exactly 10 character token', async () => {
    const { isValidTokenFormat } =
      await import('../../src/utils/token-manager.js');
    expect(isValidTokenFormat('1234567890')).toBe(true);
  });

  it('should reject tokens with special characters', async () => {
    const { isValidTokenFormat } =
      await import('../../src/utils/token-manager.js');
    expect(isValidTokenFormat('abc!def@ghi')).toBe(false);
    expect(isValidTokenFormat('token with spaces')).toBe(false);
  });

  it('should trim whitespace before validation', async () => {
    const { isValidTokenFormat } =
      await import('../../src/utils/token-manager.js');
    // Whitespace-padded but valid after trim
    expect(isValidTokenFormat('  1234567890  ')).toBe(true);
  });
});

describe('loadTokenFromEnv', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-token-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should load WEBAWESOME_NPM_TOKEN from .env', async () => {
    await fs.writeFile(
      path.join(testDir, '.env'),
      'WEBAWESOME_NPM_TOKEN=my-secret-token-12345\n'
    );

    const { loadTokenFromEnv } =
      await import('../../src/utils/token-manager.js');
    expect(await loadTokenFromEnv(testDir)).toBe('my-secret-token-12345');
  });

  it('should load WA_TOKEN (legacy) from .env', async () => {
    await fs.writeFile(
      path.join(testDir, '.env'),
      'WA_TOKEN=legacy-token-value-12345\n'
    );

    const { loadTokenFromEnv } =
      await import('../../src/utils/token-manager.js');
    expect(await loadTokenFromEnv(testDir)).toBe('legacy-token-value-12345');
  });

  it('should return null when .env does not exist', async () => {
    const { loadTokenFromEnv } =
      await import('../../src/utils/token-manager.js');
    expect(await loadTokenFromEnv(testDir)).toBeNull();
  });

  it('should return null for placeholder token', async () => {
    await fs.writeFile(
      path.join(testDir, '.env'),
      'WEBAWESOME_NPM_TOKEN=your-token-here\n'
    );

    const { loadTokenFromEnv } =
      await import('../../src/utils/token-manager.js');
    expect(await loadTokenFromEnv(testDir)).toBeNull();
  });

  it('should skip comment lines', async () => {
    await fs.writeFile(
      path.join(testDir, '.env'),
      '# This is a comment\n# WEBAWESOME_NPM_TOKEN=fake\nWEBAWESOME_NPM_TOKEN=real-token-value-123\n'
    );

    const { loadTokenFromEnv } =
      await import('../../src/utils/token-manager.js');
    expect(await loadTokenFromEnv(testDir)).toBe('real-token-value-123');
  });

  it('should return null for empty .env', async () => {
    await fs.writeFile(path.join(testDir, '.env'), '');

    const { loadTokenFromEnv } =
      await import('../../src/utils/token-manager.js');
    expect(await loadTokenFromEnv(testDir)).toBeNull();
  });
});

describe('saveTokenToEnv', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-save-token-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should create .env with token if it does not exist', async () => {
    const { saveTokenToEnv } = await import('../../src/utils/token-manager.js');
    await saveTokenToEnv('new-token-value-123', testDir);

    const content = await fs.readFile(path.join(testDir, '.env'), 'utf-8');
    expect(content).toContain('WEBAWESOME_NPM_TOKEN=new-token-value-123');
  });

  it('should update existing token in .env', async () => {
    await fs.writeFile(
      path.join(testDir, '.env'),
      'OTHER_VAR=hello\nWEBAWESOME_NPM_TOKEN=old-token\nANOTHER=world\n'
    );

    const { saveTokenToEnv } = await import('../../src/utils/token-manager.js');
    await saveTokenToEnv('updated-token-12345', testDir);

    const content = await fs.readFile(path.join(testDir, '.env'), 'utf-8');
    expect(content).toContain('WEBAWESOME_NPM_TOKEN=updated-token-12345');
    expect(content).not.toContain('old-token');
    // Preserve other vars
    expect(content).toContain('OTHER_VAR=hello');
    expect(content).toContain('ANOTHER=world');
  });

  it('should append token if not present in existing .env', async () => {
    await fs.writeFile(path.join(testDir, '.env'), 'OTHER_VAR=hello\n');

    const { saveTokenToEnv } = await import('../../src/utils/token-manager.js');
    await saveTokenToEnv('appended-token-12345', testDir);

    const content = await fs.readFile(path.join(testDir, '.env'), 'utf-8');
    expect(content).toContain('OTHER_VAR=hello');
    expect(content).toContain('WEBAWESOME_NPM_TOKEN=appended-token-12345');
  });
});

describe('promptForToken', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const p = await import('@clack/prompts');
    vi.mocked(p.isCancel).mockReturnValue(false);
  });

  it('should return token on valid input', async () => {
    const p = await import('@clack/prompts');
    vi.mocked(p.text).mockResolvedValueOnce('valid-token-12345');

    const { promptForToken } = await import('../../src/utils/token-manager.js');
    const result = await promptForToken();
    expect(result).toBe('valid-token-12345');
  });

  it('should return undefined on cancel', async () => {
    const p = await import('@clack/prompts');
    vi.mocked(p.isCancel).mockReturnValue(true);
    vi.mocked(p.text).mockResolvedValueOnce(Symbol('cancel'));

    const { promptForToken } = await import('../../src/utils/token-manager.js');
    const result = await promptForToken();
    expect(result).toBeUndefined();
  });
});
