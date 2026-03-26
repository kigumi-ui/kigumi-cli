/**
 * Update Check Tests
 *
 * Tests for src/utils/update-check.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkForUpdate,
  formatUpdateNotification,
} from '../../src/utils/update-check.js';

describe('checkForUpdate', () => {
  const originalEnv = process.env;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
      configurable: true,
    });
  });

  it('returns null when CI=true', async () => {
    process.env.CI = 'true';
    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null when NO_UPDATE_CHECK is set', async () => {
    process.env.NO_UPDATE_CHECK = '1';
    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null when not a TTY', async () => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
      configurable: true,
    });
    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null when fetch fails', async () => {
    // Remove skip conditions
    delete process.env.CI;
    delete process.env.NO_UPDATE_CHECK;

    // Mock fetch to reject
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await checkForUpdate();
    expect(result).toBeNull();

    globalThis.fetch = originalFetch;
  });
});

describe('formatUpdateNotification', () => {
  it('includes version info and instructions', () => {
    const message = formatUpdateNotification({
      currentVersion: '0.12.0',
      latestVersion: '0.13.0',
    });

    expect(message).toContain('0.12.0');
    expect(message).toContain('0.13.0');
    expect(message).toContain('npx kigumi@latest');
    expect(message).toContain('npx kigumi upgrade');
    expect(message).toContain('Changelog');
  });

  it('renders a box with borders', () => {
    const message = formatUpdateNotification({
      currentVersion: '1.0.0',
      latestVersion: '2.0.0',
    });

    // Should have top and bottom box-drawing characters
    expect(message).toContain('\u256D'); // top-left corner
    expect(message).toContain('\u256F'); // bottom-right corner
  });
});
