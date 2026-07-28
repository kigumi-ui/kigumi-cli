/**
 * Remote Installer — Local Source Tests
 *
 * Verifies that RemoteComponentInstaller works against a LocalRegistrySource
 * (sibling repos / monorepo registries), not just a GitHubRegistrySource.
 *
 * Uses the real github-fetcher (no mocks) so the local-filesystem code path
 * is exercised end-to-end. Lives in its own file to avoid the module-level
 * mocks in remote-installer.test.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';
import type { CommunityRegistry } from '../../src/schemas/community-registry.js';
import type { LocalRegistrySource } from '../../src/utils/github-fetcher.js';
import type { KigumiConfig } from '../../src/schemas/config.js';
import { createTestAddOptions } from './_helpers/add-options.js';

// Avoid touching ~/.kigumi/cache during tests by giving the registry-cache
// a fresh temp base for the cache reset performed in beforeEach.
vi.mock('../../src/utils/registry-cache.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/utils/registry-cache.js')
  >('../../src/utils/registry-cache.js');
  return {
    ...actual,
    getRegistryCache: vi.fn().mockReturnValue({
      getFile: vi.fn().mockResolvedValue(null),
      setFile: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    log: vi.fn(),
  };
}

const reactConfig: KigumiConfig = {
  framework: 'react' as const,
  typescript: true,
  componentsDir: 'src/components',
  utilsDir: 'src/lib',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
} as KigumiConfig;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RemoteComponentInstaller — local filesystem source', () => {
  let projectDir: string;
  let registryDir: string;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    projectDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-local-installer-proj-'))
    );
    registryDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-local-installer-reg-'))
    );
  });

  afterEach(async () => {
    await fs.remove(projectDir);
    await fs.remove(registryDir);
  });

  it('installs a component from a local registry directory', async () => {
    // Stage a "registry" with one component file on disk
    const componentRelPath = 'components/react/MyCard/MyCard.tsx';
    const cssRelPath = 'components/react/MyCard/MyCard.css';
    await fs.ensureDir(path.join(registryDir, 'components/react/MyCard'));
    await fs.writeFile(
      path.join(registryDir, componentRelPath),
      'export const MyCard = () => null;\n'
    );
    await fs.writeFile(
      path.join(registryDir, cssRelPath),
      '.my-card { color: red; }\n'
    );

    const localRegistry: CommunityRegistry = {
      name: 'local-test-registry',
      version: '0.1.0',
      frameworks: ['react'],
      components: {
        'my-card': {
          name: 'MyCard',
          description: 'Test card',
          dependencies: [],
          files: {
            react: {
              component: componentRelPath,
              css: cssRelPath,
              extras: [],
            },
          },
        },
      },
      themes: {},
    };

    const localSource: LocalRegistrySource = {
      kind: 'local',
      url: registryDir,
      absolutePath: registryDir,
    };

    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const installer = new RemoteComponentInstaller(
      projectDir,
      reactConfig,
      localSource,
      localRegistry,
      createMockOutput()
    );

    const results = await installer.installComponents(
      ['my-card'],
      createTestAddOptions()
    );

    // Installer reports success
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ name: 'MyCard', success: true });

    // The component file landed in the project's componentsDir
    const installedComponentPath = path.join(
      projectDir,
      'src/components/MyCard/MyCard.tsx'
    );
    const installedCssPath = path.join(
      projectDir,
      'src/components/MyCard/MyCard.css'
    );
    expect(await fs.pathExists(installedComponentPath)).toBe(true);
    expect(await fs.pathExists(installedCssPath)).toBe(true);

    // Content matches what was on the local registry disk
    expect(await fs.readFile(installedComponentPath, 'utf-8')).toBe(
      'export const MyCard = () => null;\n'
    );
    expect(await fs.readFile(installedCssPath, 'utf-8')).toBe(
      '.my-card { color: red; }\n'
    );
  });

  it('fails clearly when a referenced file is missing on the local source', async () => {
    // registry.json declares a file but it does not exist on disk
    const localRegistry: CommunityRegistry = {
      name: 'broken-local-registry',
      version: '0.1.0',
      frameworks: ['react'],
      components: {
        'missing-card': {
          name: 'MissingCard',
          dependencies: [],
          files: {
            react: {
              component: 'components/react/MissingCard/MissingCard.tsx',
              extras: [],
            },
          },
        },
      },
      themes: {},
    };

    const localSource: LocalRegistrySource = {
      kind: 'local',
      url: registryDir,
      absolutePath: registryDir,
    };

    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const installer = new RemoteComponentInstaller(
      projectDir,
      reactConfig,
      localSource,
      localRegistry,
      createMockOutput()
    );

    const results = await installer.installComponents(
      ['missing-card'],
      createTestAddOptions()
    );

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toMatch(/MissingCard\.tsx/);
  });
});
