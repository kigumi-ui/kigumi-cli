/**
 * package.json Read Error Surface Tests (issue #99)
 *
 * Tier and project detection read package.json through src/utils/package-json.ts.
 * A read failure is the user's filesystem, not a bug in Kigumi. These tests pin
 * what a user actually sees, per command and per path into the reader: a
 * PackageJsonReadError naming the file, a fix that matches the cause, and exit
 * code 4, never the generic "An unexpected error occurred ... please report".
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { listCommand } from '../../src/commands/list.js';
import { initCommand } from '../../src/commands/init/index.js';
import { brandCommand } from '../../src/commands/brand.js';
import { upgradeCommand } from '../../src/commands/upgrade.js';
import { CLI_VERSION } from '../../src/constants.js';
import { VERSION_MAP, getVersionEntry } from '../../src/utils/version-map.js';
import { PackageJsonReadError } from '../../src/errors/index.js';
import {
  setOutputForTesting,
  resetOutputForTesting,
} from '../../src/output/index.js';
import { createRecordingOutput } from './_helpers/output.js';

function errnoError(code: string): Error {
  return Object.assign(new Error(`${code}: simulated`), { code });
}

describe('PackageJsonReadError', () => {
  const filePath = '/project/package.json';

  it('names the file and keeps the errno code', () => {
    const error = new PackageJsonReadError(filePath, errnoError('EISDIR'));
    expect(error.message).toBe(`Cannot read package.json at ${filePath}`);
    expect(error.context.details).toEqual({ filePath, code: 'EISDIR' });
    expect(error.format()).toContain('Caused by: EISDIR: simulated');
  });

  it('exits with the file-system code, not the unknown-error code', () => {
    expect(
      new PackageJsonReadError(filePath, errnoError('EACCES')).exitCode
    ).toBe(4);
  });

  it.each([
    ['EACCES', 'chmod u+r package.json'],
    ['EPERM', 'chmod u+r package.json'],
    ['EISDIR', 'package.json is a directory, not a file'],
    ['EIO', 'Confirm package.json is a regular file your user can read'],
  ])('suggests a fix that matches %s', (code, expected) => {
    const error = new PackageJsonReadError(filePath, errnoError(code));
    expect(error.formatSuggestions()).toContain(expected);
  });

  it('never tells the user to report a Kigumi bug', () => {
    for (const code of ['EACCES', 'EISDIR', 'EIO']) {
      const text = new PackageJsonReadError(
        filePath,
        errnoError(code)
      ).formatSuggestions();
      expect(text).not.toMatch(/report/i);
    }
  });

  it('accepts a non-Error cause', () => {
    const error = new PackageJsonReadError(filePath, 'boom');
    expect(error.context.cause?.message).toBe('boom');
    expect(error.context.details).toEqual({ filePath, code: undefined });
  });
});

describe('user-facing output when package.json is unreadable', () => {
  let testDir: string;
  let originalExit: typeof process.exit;
  let output: ReturnType<typeof createRecordingOutput>;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-pkg-read-'));
    output = createRecordingOutput();
    setOutputForTesting(output);
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    process.exit = originalExit;
    resetOutputForTesting();
    await fs.chmod(path.join(testDir, 'package.json'), 0o644).catch(() => {
      // Only the EACCES case changes the mode; the others have nothing to undo.
    });
    await fs.remove(testDir);
  });

  function printed(): string {
    return output.calls
      .map((c) => c.args.map((a) => String(a ?? '')).join(' '))
      .join('\n');
  }

  it('kigumi list reports a directory at package.json with exit code 4', async () => {
    const packageJsonPath = path.join(testDir, 'package.json');
    await fs.mkdir(packageJsonPath);

    await listCommand({ cwd: testDir });

    const text = printed();
    expect(text).toContain(`Cannot read package.json at ${packageJsonPath}`);
    expect(text).toContain('package.json is a directory, not a file');
    expect(text).not.toContain('An unexpected error occurred');
    expect(text).not.toMatch(/report this issue/i);
    expect(process.exit).toHaveBeenCalledWith(4);
  });

  it.skipIf(process.getuid?.() === 0 || process.platform === 'win32')(
    'kigumi list reports an unreadable package.json with a permissions fix',
    async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      await fs.writeJSON(packageJsonPath, { name: 'locked' });
      await fs.chmod(packageJsonPath, 0o000);

      await listCommand({ cwd: testDir });

      const text = printed();
      expect(text).toContain(`Cannot read package.json at ${packageJsonPath}`);
      expect(text).toContain('chmod u+r package.json');
      expect(text).not.toContain('An unexpected error occurred');
      expect(process.exit).toHaveBeenCalledWith(4);
    }
  );

  // init reads package.json in project detection (detectFramework), before
  // it ever reaches detectTier.
  it('kigumi init reports a directory at package.json with exit code 4', async () => {
    const packageJsonPath = path.join(testDir, 'package.json');
    await fs.mkdir(packageJsonPath);

    await initCommand({ cwd: testDir, yes: true });

    const text = printed();
    expect(text).toContain(`Cannot read package.json at ${packageJsonPath}`);
    expect(text).toContain('package.json is a directory, not a file');
    expect(text).not.toContain('An unexpected error occurred');
    expect(text).not.toMatch(/report this issue/i);
    expect(process.exit).toHaveBeenCalledWith(4);
  });

  // upgrade reads package.json in getProjectInfo, before detectTier, but only
  // when the Web Awesome version changes. Pick a project version from the real
  // version map whose Web Awesome version differs from the running CLI's.
  it('kigumi upgrade reports a directory at package.json with exit code 4', async () => {
    const current = getVersionEntry(CLI_VERSION);
    const older = VERSION_MAP.find(
      (entry) => entry.webAwesomeVersion !== current?.webAwesomeVersion
    );
    expect(
      current,
      `VERSION_MAP has no entry for ${CLI_VERSION}`
    ).toBeDefined();
    expect(older).toBeDefined();

    const packageJsonPath = path.join(testDir, 'package.json');
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
      kigumiVersion: older?.kigumiVersion,
    });
    await fs.mkdir(packageJsonPath);

    await upgradeCommand({ cwd: testDir, yes: true });

    const text = printed();
    expect(text).toContain(`Cannot read package.json at ${packageJsonPath}`);
    expect(text).toContain('package.json is a directory, not a file');
    expect(text).not.toContain('An unexpected error occurred');
    expect(text).not.toMatch(/report this issue/i);
    expect(process.exit).toHaveBeenCalledWith(4);
  });

  // brand reaches tier detection through regenerateKigumiSetup, which calls
  // detectTierSync. brand reads process.cwd(), not a cwd option.
  it('kigumi brand reports a directory at package.json with exit code 4', async () => {
    const originalCwd = process.cwd();
    const projectDir = fs.realpathSync(testDir);
    const packageJsonPath = path.join(projectDir, 'package.json');
    await fs.writeJSON(path.join(projectDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
    });
    await fs.mkdir(packageJsonPath);

    process.chdir(projectDir);
    try {
      await brandCommand.parseAsync(['node', 'brand', 'red']);
    } finally {
      process.chdir(originalCwd);
    }

    const text = printed();
    expect(text).toContain(`Cannot read package.json at ${packageJsonPath}`);
    expect(text).toContain('package.json is a directory, not a file');
    expect(text).not.toContain('An unexpected error occurred');
    expect(text).not.toMatch(/report this issue/i);
    expect(process.exit).toHaveBeenCalledWith(4);
  });
});
