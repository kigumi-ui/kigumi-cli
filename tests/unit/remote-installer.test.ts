/**
 * Remote Installer Snapshot Tests
 *
 * Verifies that RemoteComponentInstaller saves snapshots after installing
 * community components, and that snapshot content matches written files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';
import type { CommunityRegistry } from '../../src/schemas/community-registry.js';
import type { GitHubRegistrySource } from '../../src/utils/github-fetcher.js';
import type { KigumiConfig } from '../../src/schemas/config.js';

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

vi.mock('../../src/utils/github-fetcher.js', () => ({
  fetchFile: vi
    .fn()
    .mockImplementation((_source: unknown, remotePath: string) => {
      const basename = remotePath.split('/').pop();
      if (basename?.endsWith('.tsx'))
        return Promise.resolve('// fetched component');
      if (basename?.endsWith('.css'))
        return Promise.resolve('/* fetched css */');
      if (basename?.endsWith('.ts'))
        return Promise.resolve('// fetched helper');
      return Promise.resolve('// unknown');
    }),
}));

vi.mock('../../src/utils/registry-cache.js', () => ({
  getRegistryCache: vi.fn().mockReturnValue({
    getFile: vi.fn().mockResolvedValue(null),
    setFile: vi.fn().mockResolvedValue(undefined),
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const testSource: GitHubRegistrySource = {
  owner: 'test-owner',
  repo: 'test-repo',
  branch: 'main',
  url: 'https://github.com/test-owner/test-repo',
};

const testConfig: KigumiConfig = {
  framework: 'react' as const,
  typescript: true,
  componentsDir: 'src/components',
  utilsDir: 'src/lib',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
} as KigumiConfig;

const baseRegistry: CommunityRegistry = {
  name: 'test-registry',
  version: '1.0.0',
  frameworks: ['react'],
  components: {
    'my-card': {
      name: 'MyCard',
      description: 'Test card',
      dependencies: [],
      files: {
        react: {
          component: 'react/MyCard/MyCard.tsx',
          css: 'react/MyCard/MyCard.css',
          extras: [],
        },
      },
    },
  },
  themes: {},
};

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RemoteComponentInstaller - snapshot saving', () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-remote-installer-'))
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('saves a snapshot containing component and CSS keys after install', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');
    const { loadSnapshot } = await import('../../src/utils/snapshot.js');

    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      createMockOutput()
    );

    await installer.installComponents(['my-card'], {});

    const snapshot = await loadSnapshot(tempDir, 'MyCard');

    expect(snapshot).not.toBeNull();
    expect(snapshot).toHaveProperty('MyCard.tsx');
    expect(snapshot).toHaveProperty('MyCard.css');
    expect(snapshot!['MyCard.tsx']).toBe('// fetched component');
    expect(snapshot!['MyCard.css']).toBe('/* fetched css */');
  });

  it('snapshot does not contain extras files', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');
    const { loadSnapshot } = await import('../../src/utils/snapshot.js');

    // Build a registry with an extras entry
    const registryWithExtras: CommunityRegistry = {
      ...baseRegistry,
      components: {
        'my-card': {
          ...baseRegistry.components['my-card'],
          files: {
            react: {
              component: 'react/MyCard/MyCard.tsx',
              css: 'react/MyCard/MyCard.css',
              extras: ['react/MyCard/helpers.ts'],
            },
          },
        },
      },
    };

    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      registryWithExtras,
      createMockOutput()
    );

    await installer.installComponents(['my-card'], {});

    const snapshot = await loadSnapshot(tempDir, 'MyCard');

    expect(snapshot).not.toBeNull();
    // Core files are present
    expect(snapshot).toHaveProperty('MyCard.tsx');
    expect(snapshot).toHaveProperty('MyCard.css');
    // Extras must NOT be in the snapshot
    expect(snapshot).not.toHaveProperty('helpers.ts');
  });

  // ── Bug 1: Partial download failure cleans up ──

  it('cleans up component directory on download failure', async () => {
    const { fetchFile } = await import('../../src/utils/github-fetcher.js');
    // Component succeeds, CSS fails
    vi.mocked(fetchFile)
      .mockResolvedValueOnce('// fetched component')
      .mockRejectedValueOnce(new Error('Network error'));

    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');
    const { loadSnapshot } = await import('../../src/utils/snapshot.js');

    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      createMockOutput()
    );

    // Error is caught per-component and returned as { success: false }
    const results = await installer.installComponents(['my-card'], {});
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('Network error');

    // Component directory should be cleaned up (no partial state)
    const componentDir = path.join(tempDir, 'src/components/MyCard');
    expect(await fs.pathExists(componentDir)).toBe(false);

    // No snapshot should exist
    const snapshot = await loadSnapshot(tempDir, 'MyCard');
    expect(snapshot).toBeNull();
  });

  // ── Bug 2: Community --overwrite silently overwrites (no diff) ──

  it('overwrites existing files without diff on --overwrite', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');
    const { loadSnapshot } = await import('../../src/utils/snapshot.js');

    // Pre-create component with different content
    const componentDir = path.join(tempDir, 'src/components/MyCard');
    await fs.ensureDir(componentDir);
    await fs.writeFile(
      path.join(componentDir, 'MyCard.tsx'),
      '// user modified',
      'utf-8'
    );

    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      createMockOutput()
    );

    await installer.installComponents(['my-card'], { overwrite: true });

    // File overwritten with fetched content
    const content = await fs.readFile(
      path.join(componentDir, 'MyCard.tsx'),
      'utf-8'
    );
    expect(content).toBe('// fetched component');

    // Snapshot saved with new content
    const snapshot = await loadSnapshot(tempDir, 'MyCard');
    expect(snapshot!['MyCard.tsx']).toBe('// fetched component');

    // TODO: Community --overwrite does not show diff (unlike builtin installer).
    // This is a known limitation since community components are pre-rendered.
  });

  // ── Edge: Community component without CSS ──

  it('saves snapshot with only component file when no CSS exists', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');
    const { loadSnapshot } = await import('../../src/utils/snapshot.js');

    const noCssRegistry: CommunityRegistry = {
      ...baseRegistry,
      components: {
        'my-card': {
          name: 'MyCard',
          description: 'Card without CSS',
          dependencies: [],
          files: {
            react: {
              component: 'react/MyCard/MyCard.tsx',
              extras: [],
            },
          },
        },
      },
    };

    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      noCssRegistry,
      createMockOutput()
    );

    await installer.installComponents(['my-card'], {});

    const snapshot = await loadSnapshot(tempDir, 'MyCard');
    expect(snapshot).not.toBeNull();
    expect(snapshot!['MyCard.tsx']).toBe('// fetched component');
    expect(Object.keys(snapshot!)).toEqual(['MyCard.tsx']);

    // Only component file on disk, no CSS
    const files = await fs.readdir(path.join(tempDir, 'src/components/MyCard'));
    expect(files).toEqual(['MyCard.tsx']);
  });

  it('snapshot content matches the file written to disk', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');
    const { loadSnapshot } = await import('../../src/utils/snapshot.js');

    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      createMockOutput()
    );

    await installer.installComponents(['my-card'], {});

    const snapshot = await loadSnapshot(tempDir, 'MyCard');
    const diskContent = await fs.readFile(
      path.join(tempDir, 'src/components/MyCard/MyCard.tsx'),
      'utf-8'
    );

    expect(snapshot).not.toBeNull();
    expect(snapshot!['MyCard.tsx']).toBe(diskContent);
  });
});
