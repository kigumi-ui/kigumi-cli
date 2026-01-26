/**
 * Tier Detection Tests
 *
 * Tests for src/utils/tier.ts:
 * - detectTier() - Async tier detection
 * - detectTierSync() - Sync tier detection
 * - getProToken() - Token extraction
 * - getWebAwesomePackage() - Package name lookup
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  detectTier,
  detectTierSync,
  getProToken,
  getWebAwesomePackage,
} from '../../src/utils/tier.js';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
  MIN_TOKEN_LENGTH,
} from '../../src/constants.js';

describe('tier detection', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-tier-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(testDir);
  });

  describe('detectTier', () => {
    it('should return "free" when no .env file exists', async () => {
      const tier = await detectTier(testDir);
      expect(tier).toBe('free');
    });

    it('should return "free" when .env exists but has no token', async () => {
      await fs.writeFile(path.join(testDir, '.env'), 'SOME_OTHER_VAR=value\n');
      const tier = await detectTier(testDir);
      expect(tier).toBe('free');
    });

    it('should return "free" when token is empty', async () => {
      await fs.writeFile(path.join(testDir, '.env'), 'WEBAWESOME_NPM_TOKEN=\n');
      const tier = await detectTier(testDir);
      expect(tier).toBe('free');
    });

    it('should return "free" when token is too short', async () => {
      // Token less than MIN_TOKEN_LENGTH characters
      const shortToken = 'x'.repeat(MIN_TOKEN_LENGTH - 1);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN=${shortToken}\n`
      );
      const tier = await detectTier(testDir);
      expect(tier).toBe('free');
    });

    it('should return "pro" when valid token exists', async () => {
      // Token at least MIN_TOKEN_LENGTH characters
      const validToken = 'x'.repeat(MIN_TOKEN_LENGTH);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN=${validToken}\n`
      );
      const tier = await detectTier(testDir);
      expect(tier).toBe('pro');
    });

    it('should return "pro" with longer token (typical Cloudsmith length)', async () => {
      // Cloudsmith tokens are typically 40+ characters
      const cloudsmithToken = 'a'.repeat(64);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN=${cloudsmithToken}\n`
      );
      const tier = await detectTier(testDir);
      expect(tier).toBe('pro');
    });

    it('should handle token with whitespace around equals sign', async () => {
      const validToken = 'x'.repeat(MIN_TOKEN_LENGTH);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN = ${validToken}\n`
      );
      const tier = await detectTier(testDir);
      expect(tier).toBe('pro');
    });

    it('should handle token with leading/trailing whitespace on line', async () => {
      const validToken = 'x'.repeat(MIN_TOKEN_LENGTH);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `  WEBAWESOME_NPM_TOKEN=${validToken}  \n`
      );
      const tier = await detectTier(testDir);
      expect(tier).toBe('pro');
    });

    it('should handle .env with multiple lines', async () => {
      const validToken = 'x'.repeat(MIN_TOKEN_LENGTH);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `OTHER_VAR=foo\nWEBAWESOME_NPM_TOKEN=${validToken}\nANOTHER_VAR=bar\n`
      );
      const tier = await detectTier(testDir);
      expect(tier).toBe('pro');
    });

    it('should handle token at exact minimum length boundary', async () => {
      // Exactly MIN_TOKEN_LENGTH - should be valid
      const minToken = 'x'.repeat(MIN_TOKEN_LENGTH);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN=${minToken}\n`
      );
      const tier = await detectTier(testDir);
      expect(tier).toBe('pro');

      // MIN_TOKEN_LENGTH - 1 - should be invalid
      const belowMinToken = 'x'.repeat(MIN_TOKEN_LENGTH - 1);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN=${belowMinToken}\n`
      );
      const tier2 = await detectTier(testDir);
      expect(tier2).toBe('free');
    });
  });

  describe('detectTierSync', () => {
    it('should return "free" when no .env file exists', () => {
      const tier = detectTierSync(testDir);
      expect(tier).toBe('free');
    });

    it('should return "free" when .env exists but has no token', async () => {
      await fs.writeFile(path.join(testDir, '.env'), 'SOME_OTHER_VAR=value\n');
      const tier = detectTierSync(testDir);
      expect(tier).toBe('free');
    });

    it('should return "pro" when valid token exists', async () => {
      const validToken = 'x'.repeat(MIN_TOKEN_LENGTH);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN=${validToken}\n`
      );
      const tier = detectTierSync(testDir);
      expect(tier).toBe('pro');
    });

    it('should match detectTier behavior for edge cases', async () => {
      // Empty token
      await fs.writeFile(path.join(testDir, '.env'), 'WEBAWESOME_NPM_TOKEN=\n');
      expect(detectTierSync(testDir)).toBe('free');

      // Short token
      await fs.writeFile(
        path.join(testDir, '.env'),
        'WEBAWESOME_NPM_TOKEN=short\n'
      );
      expect(detectTierSync(testDir)).toBe('free');

      // Valid token
      const validToken = 'x'.repeat(MIN_TOKEN_LENGTH);
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN=${validToken}\n`
      );
      expect(detectTierSync(testDir)).toBe('pro');
    });
  });

  describe('getProToken', () => {
    it('should return null when no .env file exists', async () => {
      const token = await getProToken(testDir);
      expect(token).toBeNull();
    });

    it('should return null when .env exists but has no token', async () => {
      await fs.writeFile(path.join(testDir, '.env'), 'SOME_OTHER_VAR=value\n');
      const token = await getProToken(testDir);
      expect(token).toBeNull();
    });

    it('should return token value when present', async () => {
      await fs.writeFile(
        path.join(testDir, '.env'),
        'WEBAWESOME_NPM_TOKEN=my-secret-token\n'
      );
      const token = await getProToken(testDir);
      expect(token).toBe('my-secret-token');
    });

    it('should trim whitespace from token', async () => {
      await fs.writeFile(
        path.join(testDir, '.env'),
        'WEBAWESOME_NPM_TOKEN=my-token  \n'
      );
      const token = await getProToken(testDir);
      expect(token).toBe('my-token');
    });

    it('should return null if token is empty', async () => {
      // When token is empty (WEBAWESOME_NPM_TOKEN=), the regex matches
      // but tokenMatch[1] is empty, so the ternary returns null
      await fs.writeFile(path.join(testDir, '.env'), 'WEBAWESOME_NPM_TOKEN=\n');
      const token = await getProToken(testDir);
      expect(token).toBeNull();
    });

    it('should extract token with special characters', async () => {
      const specialToken = 'abc123-xyz_789/test+token=end';
      await fs.writeFile(
        path.join(testDir, '.env'),
        `WEBAWESOME_NPM_TOKEN=${specialToken}\n`
      );
      const token = await getProToken(testDir);
      expect(token).toBe(specialToken);
    });
  });

  describe('getWebAwesomePackage', () => {
    it('should return free package for "free" tier', () => {
      const pkg = getWebAwesomePackage('free');
      expect(pkg).toBe(WEB_AWESOME_FREE_PACKAGE);
      expect(pkg).toBe('@awesome.me/webawesome');
    });

    it('should return pro package for "pro" tier', () => {
      const pkg = getWebAwesomePackage('pro');
      expect(pkg).toBe(WEB_AWESOME_PRO_PACKAGE);
      expect(pkg).toBe('@awesome.me/webawesome-pro');
    });
  });
});
