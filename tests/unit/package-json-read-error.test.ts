/**
 * package.json Read Error Surface Tests (issue #99)
 *
 * Tier and project detection read package.json through src/utils/package-json.ts.
 * A file that cannot be read or is not a JSON object is a problem in the user's
 * project, not a bug in Kigumi. These tests pin what a user actually sees, per
 * command and per path into the reader: a PackageJsonReadError or
 * PackageJsonInvalidError naming the file, a fix that matches the cause, and
 * exit code 4, never the generic "An unexpected error occurred ... please report".
 *
 * Commands that write to the project detect first (issue #121), so the tests
 * for them also check that a failed run left kigumi.config.json byte for byte
 * and wrote no files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { listCommand } from '../../src/commands/list.js';
import { initCommand } from '../../src/commands/init/index.js';
import { brandCommand } from '../../src/commands/brand.js';
import { paletteCommand } from '../../src/commands/palette.js';
import { themeCommand } from '../../src/commands/theme.js';
import { upgradeCommand } from '../../src/commands/upgrade.js';
import { diffCommand } from '../../src/commands/diff.js';
import { themeInstallAction } from '../../src/commands/theme/install.js';
import { CLI_VERSION } from '../../src/constants.js';
import { VERSION_MAP, getVersionEntry } from '../../src/utils/version-map.js';
import {
  PackageJsonReadError,
  PackageJsonInvalidError,
} from '../../src/errors/index.js';
import {
  setOutputForTesting,
  resetOutputForTesting,
} from '../../src/output/index.js';
import { createRecordingOutput } from './_helpers/output.js';

const CONFIG = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
};

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

describe('PackageJsonInvalidError', () => {
  const filePath = '/project/package.json';

  it('names the file, keeps the parse error, and exits 4', () => {
    const error = new PackageJsonInvalidError(
      filePath,
      new SyntaxError('Unexpected token } in JSON at position 12')
    );
    expect(error.message).toBe(`Invalid package.json at ${filePath}`);
    expect(error.context.details).toEqual({ filePath });
    expect(error.format()).toContain(
      'Caused by: Unexpected token } in JSON at position 12'
    );
    expect(error.exitCode).toBe(4);
  });

  it('tells the user to fix the file, not to make it readable or report a bug', () => {
    const text = new PackageJsonInvalidError(
      filePath,
      new SyntaxError('bad')
    ).formatSuggestions();
    expect(text).toContain('package.json must hold a single JSON object');
    expect(text).not.toMatch(/readable|chmod|report/i);
  });
});

describe('user-facing output when package.json is unreadable or invalid', () => {
  // realpath, so paths match what process.cwd() reports after a chdir.
  let testDir: string;
  let packageJsonPath: string;
  let configPath: string;
  let originalExit: typeof process.exit;
  let output: ReturnType<typeof createRecordingOutput>;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-pkg-read-'))
    );
    packageJsonPath = path.join(testDir, 'package.json');
    configPath = path.join(testDir, 'kigumi.config.json');
    output = createRecordingOutput();
    setOutputForTesting(output);
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    process.exit = originalExit;
    resetOutputForTesting();
    await fs.chmod(packageJsonPath, 0o644).catch((_error: unknown) => {
      // Only the EACCES case changes the mode; the others have nothing to undo.
    });
    await fs.remove(testDir);
  });

  function printed(): string {
    return output.calls
      .map((c) => c.args.map((a) => String(a ?? '')).join(' '))
      .join('\n');
  }

  /** The error block and the "How to fix" note, exactly as handleError emits them. */
  function reported(): { error: string; fix: string } {
    const error = output.calls.find((c) => c.method === 'error');
    const note = output.calls.find(
      (c) => c.method === 'note' && c.args[0] === 'How to fix'
    );
    return {
      error: String(error?.args[0] ?? ''),
      fix: String(note?.args[1] ?? ''),
    };
  }

  /**
   * Writes kigumi.config.json and returns its bytes. A command that fails on
   * package.json must leave exactly these bytes (issue #121), so the tests
   * compare text, not parsed JSON. The file is written compact, unlike
   * saveConfig's two-space output, so even a rewrite with unchanged values
   * changes the bytes.
   */
  async function writeConfig(extra: Record<string, unknown> = {}) {
    const text = JSON.stringify({ ...CONFIG, ...extra });
    await fs.writeFile(configPath, text);
    return text;
  }

  function configText(): Promise<string> {
    return fs.readFile(configPath, 'utf8');
  }

  /** brand, palette and theme set read process.cwd(), not a cwd option. */
  async function inProject(run: () => Promise<unknown>): Promise<void> {
    const originalCwd = process.cwd();
    process.chdir(testDir);
    try {
      await run();
    } finally {
      process.chdir(originalCwd);
    }
  }

  function expectDirectoryError(): void {
    const text = printed();
    expect(text).toContain(`Cannot read package.json at ${packageJsonPath}`);
    expect(text).toContain('package.json is a directory, not a file');
    expect(text).not.toContain('An unexpected error occurred');
    expect(text).not.toMatch(/report this issue/i);
    expect(process.exit).toHaveBeenCalledWith(4);
  }

  // The full rendering is pinned once per error class here; every command
  // reaches it through the same handleError, so the per-command tests below
  // check the message, the fix and the exit code.
  it('kigumi list renders the full error and fix for a directory at package.json', async () => {
    await fs.mkdir(packageJsonPath);

    await listCommand({ cwd: testDir });

    expect(reported()).toEqual({
      error: [
        `Cannot read package.json at ${packageJsonPath}`,
        '',
        'Details:',
        `  filePath: ${JSON.stringify(packageJsonPath)}`,
        '  code: "EISDIR"',
        '',
        'Caused by: EISDIR: illegal operation on a directory, read',
      ].join('\n'),
      fix: [
        'Make package.json readable:',
        '  1. package.json is a directory, not a file',
        '  2. Move or rename that directory',
        '  3. Restore your package.json file, then run the command again',
      ].join('\n'),
    });
    expect(process.exit).toHaveBeenCalledWith(4);
  });

  it.skipIf(process.getuid?.() === 0 || process.platform === 'win32')(
    'kigumi list renders the full error and permissions fix for an unreadable package.json',
    async () => {
      await fs.writeJSON(packageJsonPath, { name: 'locked' });
      await fs.chmod(packageJsonPath, 0o000);

      await listCommand({ cwd: testDir });

      expect(reported()).toEqual({
        error: [
          `Cannot read package.json at ${packageJsonPath}`,
          '',
          'Details:',
          `  filePath: ${JSON.stringify(packageJsonPath)}`,
          '  code: "EACCES"',
          '',
          `Caused by: EACCES: permission denied, open '${packageJsonPath}'`,
        ].join('\n'),
        fix: [
          'Make package.json readable:',
          '  1. Check who can read it: ls -l package.json',
          '  2. Give your user read access, e.g.: chmod u+r package.json',
          '  3. Then run the command again',
        ].join('\n'),
      });
      expect(process.exit).toHaveBeenCalledWith(4);
    }
  );

  // init reads package.json in project detection (detectFramework), before
  // it ever reaches detectTier.
  it('kigumi init reports a directory at package.json with exit code 4', async () => {
    await fs.mkdir(packageJsonPath);

    await initCommand({ cwd: testDir, yes: true });

    expectDirectoryError();
  });

  // Tier detection treats invalid JSON as "no tier signal", but init cannot
  // detect the project without it, so the invalid file reaches the user.
  it('kigumi init renders the full error and fix for invalid JSON in package.json', async () => {
    await fs.writeFile(packageJsonPath, '{ "name": "broken", }');

    await initCommand({ cwd: testDir, yes: true });

    const { error, fix } = reported();
    const [head, cause] = error.split('\n\nCaused by: ');
    expect(head).toBe(
      [
        `Invalid package.json at ${packageJsonPath}`,
        '',
        'Details:',
        `  filePath: ${JSON.stringify(packageJsonPath)}`,
      ].join('\n')
    );
    // fs-extra prefixes the parser's message with the path; the message
    // itself is Node's and its wording changes between Node versions.
    expect(cause?.startsWith(`${packageJsonPath}: `)).toBe(true);
    expect(fix).toBe(
      [
        'Fix package.json:',
        '  1. Fix the problem named under "Caused by" above',
        '  2. package.json must hold a single JSON object',
        '  3. Then run the command again',
      ].join('\n')
    );
    expect(printed()).not.toContain('An unexpected error occurred');
    expect(process.exit).toHaveBeenCalledWith(4);
  });

  // upgrade reads package.json in getProjectInfo, before detectTier, but only
  // when the Web Awesome version changes. Pick a project version from the real
  // version map whose Web Awesome version differs from the running CLI's.
  it('kigumi upgrade reports a directory at package.json and saves nothing', async () => {
    const current = getVersionEntry(CLI_VERSION);
    const older = VERSION_MAP.find(
      (entry) => entry.webAwesomeVersion !== current?.webAwesomeVersion
    );
    expect(
      current,
      `VERSION_MAP has no entry for ${CLI_VERSION}`
    ).toBeDefined();
    expect(older).toBeDefined();

    const before = await writeConfig({ kigumiVersion: older?.kigumiVersion });
    await fs.mkdir(packageJsonPath);

    await upgradeCommand({ cwd: testDir, yes: true });

    expectDirectoryError();
    // Issue #121: the version was not bumped before detection failed.
    expect(await configText()).toBe(before);
  });

  // The commands below detect the tier before they save (issue #121).
  it.each([
    ['brand', ['node', 'brand', 'red'], () => brandCommand],
    ['palette', ['node', 'palette', 'bright'], () => paletteCommand],
    ['theme set', ['node', 'theme', 'set', 'awesome'], () => themeCommand],
  ] as const)(
    'kigumi %s reports a directory at package.json and saves nothing',
    async (_name, argv, command) => {
      const before = await writeConfig();
      await fs.mkdir(packageJsonPath);

      await inProject(() => command().parseAsync([...argv]));

      expectDirectoryError();
      expect(await configText()).toBe(before);
    }
  );

  // theme install detects the tier before fetching or writing (issue #121).
  it('kigumi theme install reports a directory at package.json and writes nothing', async () => {
    const registryDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-pkg-read-registry-')
    );
    try {
      await fs.outputFile(
        path.join(registryDir, 'themes/midnight.css'),
        ':root { --wa-color-surface-default: #101014; }\n'
      );
      await fs.writeJSON(path.join(registryDir, 'registry.json'), {
        name: 'local-theme-registry',
        version: '0.1.0',
        frameworks: ['react'],
        components: {},
        themes: {
          midnight: {
            name: 'Midnight',
            description: 'A dark theme',
            files: { css: 'themes/midnight.css' },
          },
        },
      });
      const before = await writeConfig();
      await fs.mkdir(packageJsonPath);

      await themeInstallAction('midnight', { from: registryDir, cwd: testDir });

      expectDirectoryError();
      expect(
        await fs.pathExists(path.join(testDir, 'src/styles/community-themes'))
      ).toBe(false);
      expect(await configText()).toBe(before);
    } finally {
      await fs.remove(registryDir);
    }
  });

  // diff reports every generation error as a missing file, so the tier has to
  // be detected before the per-component loop for the broken package.json to
  // be named at all.
  it('kigumi diff reports a directory at package.json instead of missing files', async () => {
    await writeConfig();
    await fs.mkdir(packageJsonPath);

    await diffCommand(['button'], { cwd: testDir });

    expectDirectoryError();
    expect(printed()).not.toMatch(/missing/i);
  });
});
