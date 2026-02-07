/**
 * Token Detection Tests
 *
 * Tests the fallback chain for Pro token detection:
 * 1. Environment variable ($WEBAWESOME_NPM_TOKEN)
 * 2. Global ~/.npmrc
 * 3. Project .env file
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  describeTokenSource,
  detectProToken,
  detectProTokenSync,
  getTokenSource,
  getTokenSourceSync,
} from '../../src/utils/token.js';

describe('token detection', () => {
  let testDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Create temp directory for tests
    testDir = path.join(os.tmpdir(), `kigumi-token-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Save original env
    originalEnv = { ...process.env };

    // Clear token from env
    delete process.env.WEBAWESOME_NPM_TOKEN;
  });

  afterEach(async () => {
    // Restore original env
    process.env = originalEnv;

    // Cleanup test directory
    await fs.remove(testDir);
  });

  describe('environment variable priority', () => {
    it('should detect token from environment variable first', async () => {
      // Set env variable
      process.env.WEBAWESOME_NPM_TOKEN = 'env-token-12345';

      // Also create .env file with different token
      await fs.writeFile(
        path.join(testDir, '.env'),
        'WEBAWESOME_NPM_TOKEN=dotenv-token-67890\n'
      );

      const token = await detectProToken(testDir);
      expect(token).toBe('env-token-12345');

      const source = await getTokenSource(testDir);
      expect(source).toBe('env');
    });

    it('should return null for too-short env token', async () => {
      process.env.WEBAWESOME_NPM_TOKEN = 'short';

      const token = await detectProToken(testDir);
      expect(token).toBeNull();
    });

    it('should trim whitespace from env token', async () => {
      process.env.WEBAWESOME_NPM_TOKEN = '  env-token-12345  ';

      const token = await detectProToken(testDir);
      expect(token).toBe('env-token-12345');
    });
  });

  describe('.env file fallback', () => {
    it('should detect token from .env when no env variable', async () => {
      await fs.writeFile(
        path.join(testDir, '.env'),
        'WEBAWESOME_NPM_TOKEN=dotenv-token-67890\n'
      );

      const token = await detectProToken(testDir);
      expect(token).toBe('dotenv-token-67890');

      const source = await getTokenSource(testDir);
      expect(source).toBe('dotenv');
    });

    it('should handle .env with other variables', async () => {
      await fs.writeFile(
        path.join(testDir, '.env'),
        'OTHER_VAR=value\nWEBAWESOME_NPM_TOKEN=my-test-token-123\nANOTHER=val\n'
      );

      const token = await detectProToken(testDir);
      expect(token).toBe('my-test-token-123');
    });

    it('should return null for empty .env token', async () => {
      await fs.writeFile(path.join(testDir, '.env'), 'WEBAWESOME_NPM_TOKEN=\n');

      const token = await detectProToken(testDir);
      expect(token).toBeNull();
    });

    it('should return null when .env does not exist', async () => {
      const token = await detectProToken(testDir);
      expect(token).toBeNull();

      const source = await getTokenSource(testDir);
      expect(source).toBeNull();
    });
  });

  describe('sync versions', () => {
    it('detectProTokenSync should work like async version', async () => {
      await fs.writeFile(
        path.join(testDir, '.env'),
        'WEBAWESOME_NPM_TOKEN=sync-test-token-12345\n'
      );

      const token = detectProTokenSync(testDir);
      expect(token).toBe('sync-test-token-12345');
    });

    it('getTokenSourceSync should work like async version', async () => {
      process.env.WEBAWESOME_NPM_TOKEN = 'env-sync-token-12345';

      const source = getTokenSourceSync(testDir);
      expect(source).toBe('env');
    });
  });

  describe('describeTokenSource', () => {
    it('should describe env source', () => {
      expect(describeTokenSource('env')).toContain('environment variable');
      expect(describeTokenSource('env')).toContain('WEBAWESOME_NPM_TOKEN');
    });

    it('should describe npmrc source', () => {
      expect(describeTokenSource('npmrc')).toContain('~/.npmrc');
    });

    it('should describe dotenv source', () => {
      expect(describeTokenSource('dotenv')).toContain('.env');
    });

    it('should handle null source', () => {
      expect(describeTokenSource(null)).toBe('unknown');
    });
  });
});
