/**
 * Starter Web Awesome Version Tests
 *
 * The starters once sat on Web Awesome 3.6.0 while the CLI targeted 3.13.0,
 * and the Starter job's nine components all existed in 3.6.0, so nothing
 * noticed (issue #138). The check compares against DEFAULT_WEBAWESOME_VERSION,
 * never a literal, so it cannot rot into protecting a stale value.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import semver from 'semver';
import {
  checkStarterWebAwesome,
  readInstalledWebAwesomeVersion,
} from '../../../scripts/check-starter-wa-version.js';
import { DEFAULT_WEBAWESOME_VERSION } from '../../../src/constants.js';

const target = DEFAULT_WEBAWESOME_VERSION;

describe('checkStarterWebAwesome', () => {
  it('passes a starter on the version the CLI targets', () => {
    expect(checkStarterWebAwesome(target, target).passed).toBe(true);
  });

  it('passes a starter ahead of the CLI, so starters can be bumped first', () => {
    const ahead = semver.inc(target, 'minor') as string;
    expect(checkStarterWebAwesome(ahead, target).passed).toBe(true);
  });

  it('fails a starter behind the CLI and names both versions', () => {
    const result = checkStarterWebAwesome('3.6.0', '3.13.0');

    expect(result.passed).toBe(false);
    expect(result.message).toContain('3.6.0');
    expect(result.message).toContain('3.13.0');
  });

  it('compares numerically, not as strings', () => {
    // '3.6.0' > '3.13.0' as strings; a string compare would pass this starter.
    expect(checkStarterWebAwesome('3.6.0', '3.13.0').passed).toBe(false);
    expect(checkStarterWebAwesome('3.13.0', '3.6.0').passed).toBe(true);
  });

  it('fails when Web Awesome is not installed, rather than passing unchecked', () => {
    expect(checkStarterWebAwesome(null, target).passed).toBe(false);
  });

  it('fails on a version it cannot read', () => {
    expect(checkStarterWebAwesome('latest', target).passed).toBe(false);
  });
});

describe('readInstalledWebAwesomeVersion', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-starter-wa-'));
  });

  afterEach(async () => {
    await fs.remove(dir);
  });

  async function install(pkg: string, version: string): Promise<void> {
    await fs.outputJson(path.join(dir, 'node_modules', pkg, 'package.json'), {
      name: pkg,
      version,
    });
  }

  it('reads the installed Free package', async () => {
    await install('@awesome.me/webawesome', '3.13.0');
    expect(readInstalledWebAwesomeVersion(dir)).toBe('3.13.0');
  });

  it('reads the installed Pro package', async () => {
    await install('@awesome.me/webawesome-pro', '3.12.0');
    expect(readInstalledWebAwesomeVersion(dir)).toBe('3.12.0');
  });

  it('returns null when neither package is installed', () => {
    expect(readInstalledWebAwesomeVersion(dir)).toBeNull();
  });
});
