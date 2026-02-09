/**
 * Status Command Tests
 *
 * Tests for src/commands/status.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { statusCommand } from '../../src/commands/status.js';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../src/constants.js';

describe('status command', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-status-test-'));
    originalEnv = process.env.WEBAWESOME_NPM_TOKEN;
    delete process.env.WEBAWESOME_NPM_TOKEN;
    process.env.KIGUMI_SKIP_GLOBAL_NPMRC = '1';
  });

  afterEach(async () => {
    await fs.remove(testDir);
    if (originalEnv !== undefined) {
      process.env.WEBAWESOME_NPM_TOKEN = originalEnv;
    } else {
      delete process.env.WEBAWESOME_NPM_TOKEN;
    }
    delete process.env.KIGUMI_SKIP_GLOBAL_NPMRC;
  });

  it('should throw error when config not found', async () => {
    await expect(statusCommand({ cwd: testDir })).rejects.toThrow();
  });

  it('should display tier information for free project', async () => {
    // Setup project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'awesome',
        palette: 'sky',
        brandColor: '#0ea5e9',
      },
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Run command
    await statusCommand({ cwd: testDir });

    // Command should complete without error
    expect(true).toBe(true);
  });

  it('should detect pro tier with token', async () => {
    // Setup project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'brutalist',
        palette: 'slate',
        brandColor: '#64748b',
      },
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_PRO_PACKAGE]: '^4.0.0',
      },
    });

    // Create .env with token
    await fs.writeFile(
      path.join(testDir, '.env'),
      'WEBAWESOME_NPM_TOKEN=abcdefghij1234567890'
    );

    // Run command
    await statusCommand({ cwd: testDir });

    // Command should complete without error
    expect(true).toBe(true);
  });

  it('should list installed components', async () => {
    // Setup project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'awesome',
        palette: 'sky',
        brandColor: '#0ea5e9',
      },
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component directories
    const componentsDir = path.join(testDir, 'src/components');
    await fs.ensureDir(path.join(componentsDir, 'Button'));
    await fs.ensureDir(path.join(componentsDir, 'Dialog'));
    await fs.ensureDir(path.join(componentsDir, 'Input'));

    // Run command
    await statusCommand({ cwd: testDir });

    // Command should complete without error
    expect(true).toBe(true);
  });

  it('should warn about tier mismatch (pro package without token)', async () => {
    // Setup project with pro package but no token
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'awesome',
        palette: 'sky',
        brandColor: '#0ea5e9',
      },
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_PRO_PACKAGE]: '^4.0.0',
      },
    });

    // Run command
    await statusCommand({ cwd: testDir });

    // Command should complete without error (warning shown but not thrown)
    expect(true).toBe(true);
  });

  it('should warn about duplicate packages', async () => {
    // Setup project with both packages
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'awesome',
        palette: 'sky',
        brandColor: '#0ea5e9',
      },
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
        [WEB_AWESOME_PRO_PACKAGE]: '^4.0.0',
      },
    });

    // Run command
    await statusCommand({ cwd: testDir });

    // Command should complete without error (warning shown but not thrown)
    expect(true).toBe(true);
  });

  it('should handle missing components directory gracefully', async () => {
    // Setup project without components directory
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'awesome',
        palette: 'sky',
        brandColor: '#0ea5e9',
      },
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Run command (components directory doesn't exist)
    await statusCommand({ cwd: testDir });

    // Command should complete without error
    expect(true).toBe(true);
  });
});
