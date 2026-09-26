/**
 * Theme Install — Local Source Tests
 *
 * `kigumi add --from ../sibling-repo` accepts local filesystem registries, so
 * `kigumi theme install <name> --from ../sibling-repo` must accept them too.
 *
 * Uses the real github-fetcher (no mocks) so the local-filesystem path is
 * exercised end to end.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';

function createMockOutput(): OutputInterface {
  const mockSpinner: OutputSpinner = {
    start: vi.fn(),
    message: vi.fn(),
    stop: vi.fn(),
    error: vi.fn(),
  };

  return {
    intro: vi.fn(),
    outro: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    note: vi.fn(),
    spinner: vi.fn().mockReturnValue(mockSpinner),
    debug: vi.fn(),
  };
}

const mockOutput = createMockOutput();

vi.mock('../../src/output/index.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/output/index.js')
  >('../../src/output/index.js');
  return { ...actual, getOutput: () => mockOutput };
});

// Keep the theme install from shelling out to regenerate the setup file.
vi.mock('../../src/utils/regenerate.js', () => ({
  regenerateKigumiSetup: vi.fn().mockResolvedValue(undefined),
}));

async function stageThemeRegistry(registryDir: string): Promise<void> {
  await fs.ensureDir(path.join(registryDir, 'themes'));
  await fs.writeFile(
    path.join(registryDir, 'themes/midnight.css'),
    ':root { --wa-color-surface-default: #101014; }\n'
  );

  await fs.writeJSON(path.join(registryDir, 'registry.json'), {
    $schema: 'https://kigumi.style/schemas/community-registry.json',
    name: 'sibling-theme-registry',
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
}

describe('theme install — local filesystem source', () => {
  let projectDir: string;
  let registryDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    projectDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-theme-proj-'))
    );
    registryDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-theme-reg-'))
    );

    await fs.writeJSON(path.join(projectDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
    });

    await stageThemeRegistry(registryDir);
  });

  afterEach(async () => {
    await fs.remove(projectDir);
    await fs.remove(registryDir);
  });

  it('installs a theme from an absolute local registry path', async () => {
    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');

    await themeInstallAction('midnight', {
      from: registryDir,
      cwd: projectDir,
    });

    const installedCss = path.join(
      projectDir,
      'src/styles/community-themes/midnight.css'
    );
    expect(await fs.pathExists(installedCss)).toBe(true);
    expect(await fs.readFile(installedCss, 'utf-8')).toContain(
      '--wa-color-surface-default'
    );

    const config = await fs.readJSON(
      path.join(projectDir, 'kigumi.config.json')
    );
    expect(config.theme.selected).toBe('midnight');
    expect(config.installedThemes.midnight).toMatchObject({
      source: 'community',
      registryUrl: registryDir,
    });
  });

  it('resolves a relative local registry path against the project cwd', async () => {
    // Place a registry as a sibling of the project directory so `../name`
    // resolves the way a user in a monorepo would expect.
    const siblingName = path.basename(registryDir);
    const relativeFrom = path.join('..', siblingName);

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');

    await themeInstallAction('midnight', {
      from: relativeFrom,
      cwd: projectDir,
    });

    expect(
      await fs.pathExists(
        path.join(projectDir, 'src/styles/community-themes/midnight.css')
      )
    ).toBe(true);
  });

  // Issue #121: both theme files are fetched before either is written, so a
  // failed download leaves no half-installed theme behind.
  it('writes nothing when one of the theme files cannot be fetched', async () => {
    const registryPath = path.join(registryDir, 'registry.json');
    const registry = await fs.readJSON(registryPath);
    registry.themes.midnight.files.variables = 'themes/missing-variables.css';
    await fs.writeJSON(registryPath, registry);
    const configPath = path.join(projectDir, 'kigumi.config.json');
    // Compared as text: a reformatted rewrite would still parse equal.
    const configBefore = await fs.readFile(configPath, 'utf8');

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);
    try {
      const { themeInstallAction } =
        await import('../../src/commands/theme/install.js');
      await themeInstallAction('midnight', {
        from: registryDir,
        cwd: projectDir,
      });

      expect(exitSpy).toHaveBeenCalledWith(expect.any(Number));
      expect(exitSpy).not.toHaveBeenCalledWith(0);
    } finally {
      exitSpy.mockRestore();
    }

    expect(
      await fs.pathExists(
        path.join(projectDir, 'src/styles/community-themes/midnight.css')
      )
    ).toBe(false);
    expect(await fs.readFile(configPath, 'utf8')).toBe(configBefore);
  });
});
