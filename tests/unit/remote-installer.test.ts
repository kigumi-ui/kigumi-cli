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
import { createTestAddOptions } from './_helpers/add-options.js';

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
  kind: 'github',
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

    await installer.installComponents(['my-card'], createTestAddOptions());

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

    await installer.installComponents(['my-card'], createTestAddOptions());

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
    const results = await installer.installComponents(
      ['my-card'],
      createTestAddOptions()
    );
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('Network error');

    // Component directory should be cleaned up (no partial state)
    const componentDir = path.join(tempDir, 'src/components/MyCard');
    expect(await fs.pathExists(componentDir)).toBe(false);

    // No snapshot should exist
    const snapshot = await loadSnapshot(tempDir, 'MyCard');
    expect(snapshot).toBeNull();
  });

  // ── Bug 2: Community --force silently overwrites (no diff) ──

  it('overwrites existing files with per-file labels on --force', async () => {
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

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      output
    );

    await installer.installComponents(
      ['my-card'],
      createTestAddOptions({ force: true })
    );

    // File overwritten with fetched content
    const content = await fs.readFile(
      path.join(componentDir, 'MyCard.tsx'),
      'utf-8'
    );
    expect(content).toBe('// fetched component');

    // Snapshot saved with new content
    const snapshot = await loadSnapshot(tempDir, 'MyCard');
    expect(snapshot!['MyCard.tsx']).toBe('// fetched component');

    // Per-file labels are shown for modified files
    const warnCalls = vi.mocked(output.warn).mock.calls.flat();
    expect(warnCalls.some((c) => c.includes('Modified'))).toBe(true);
  });

  // ── Per-file modification detection ──

  it('shows per-file Modified/Unchanged labels when only CSS differs', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    // Pre-create component with matching component but different CSS
    const componentDir = path.join(tempDir, 'src/components/MyCard');
    await fs.ensureDir(componentDir);
    await fs.writeFile(
      path.join(componentDir, 'MyCard.tsx'),
      '// fetched component',
      'utf-8'
    );
    await fs.writeFile(
      path.join(componentDir, 'MyCard.css'),
      '/* user modified css */',
      'utf-8'
    );

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      output
    );

    await installer.installComponents(
      ['my-card'],
      createTestAddOptions({ force: true })
    );

    const warnCalls = vi.mocked(output.warn).mock.calls.flat();
    const infoCalls = vi.mocked(output.info).mock.calls.flat();

    // CSS is modified, component is unchanged
    expect(
      warnCalls.some((c) => c.includes('Modified') && c.includes('MyCard.css'))
    ).toBe(true);
    expect(
      infoCalls.some((c) => c.includes('Unchanged') && c.includes('MyCard.tsx'))
    ).toBe(true);
  });

  it('skips silently when all files are identical', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    // Pre-create component with identical content
    const componentDir = path.join(tempDir, 'src/components/MyCard');
    await fs.ensureDir(componentDir);
    await fs.writeFile(
      path.join(componentDir, 'MyCard.tsx'),
      '// fetched component',
      'utf-8'
    );
    await fs.writeFile(
      path.join(componentDir, 'MyCard.css'),
      '/* fetched css */',
      'utf-8'
    );

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      output
    );

    const results = await installer.installComponents(
      ['my-card'],
      createTestAddOptions()
    );

    // Should be skipped since all files are identical
    expect(results[0].skipped).toBe(true);

    // No Modified/Unchanged labels shown (skipped entirely)
    const warnCalls = vi.mocked(output.warn).mock.calls.flat();
    expect(warnCalls.some((c) => c.includes('Modified'))).toBe(false);
  });

  it('skips when all files are identical even with --force', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    // Pre-create component with identical content
    const componentDir = path.join(tempDir, 'src/components/MyCard');
    await fs.ensureDir(componentDir);
    await fs.writeFile(
      path.join(componentDir, 'MyCard.tsx'),
      '// fetched component',
      'utf-8'
    );
    await fs.writeFile(
      path.join(componentDir, 'MyCard.css'),
      '/* fetched css */',
      'utf-8'
    );

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      output
    );

    const results = await installer.installComponents(
      ['my-card'],
      createTestAddOptions({ force: true })
    );

    // Should still skip -- force bypasses prompts, not identity checks
    expect(results[0].skipped).toBe(true);
  });

  it('shows diffs for multiple modified files', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    // Pre-create component with both files different
    const componentDir = path.join(tempDir, 'src/components/MyCard');
    await fs.ensureDir(componentDir);
    await fs.writeFile(
      path.join(componentDir, 'MyCard.tsx'),
      '// user modified component',
      'utf-8'
    );
    await fs.writeFile(
      path.join(componentDir, 'MyCard.css'),
      '/* user modified css */',
      'utf-8'
    );

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      output
    );

    await installer.installComponents(
      ['my-card'],
      createTestAddOptions({ force: true })
    );

    const warnCalls = vi.mocked(output.warn).mock.calls.flat();

    // Both files shown as modified
    expect(
      warnCalls.some((c) => c.includes('Modified') && c.includes('MyCard.tsx'))
    ).toBe(true);
    expect(
      warnCalls.some((c) => c.includes('Modified') && c.includes('MyCard.css'))
    ).toBe(true);
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

    await installer.installComponents(['my-card'], createTestAddOptions());

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

    await installer.installComponents(['my-card'], createTestAddOptions());

    const snapshot = await loadSnapshot(tempDir, 'MyCard');
    const diskContent = await fs.readFile(
      path.join(tempDir, 'src/components/MyCard/MyCard.tsx'),
      'utf-8'
    );

    expect(snapshot).not.toBeNull();
    expect(snapshot!['MyCard.tsx']).toBe(diskContent);
  });
});

describe('RemoteComponentInstaller - peerDependencies surfacing (F-116)', () => {
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

  it('emits a single note listing every installed component peerDependency', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const registryWithPeerDeps: CommunityRegistry = {
      ...baseRegistry,
      components: {
        'my-card': {
          ...baseRegistry.components['my-card'],
          peerDependencies: { 'react-aria': '^3.0.0' },
        },
        chart: {
          name: 'Chart',
          dependencies: [],
          files: {
            react: { component: 'react/Chart/Chart.tsx', extras: [] },
          },
          peerDependencies: { recharts: '^2.0.0' },
        },
      },
    };

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      registryWithPeerDeps,
      output
    );

    await installer.installComponents(
      ['my-card', 'chart'],
      createTestAddOptions()
    );

    expect(output.note).toHaveBeenCalledTimes(1);
    const [title, body] = vi.mocked(output.note).mock.calls[0];
    expect(title).toBe('Peer dependencies');
    expect(body).toContain('react-aria@^3.0.0');
    expect(body).toContain('recharts@^2.0.0');
  });

  it('does not emit a note when no installed component has peerDependencies', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      baseRegistry,
      output
    );

    await installer.installComponents(['my-card'], createTestAddOptions());

    expect(output.note).not.toHaveBeenCalled();
  });

  it('does not include peerDependencies from skipped components', async () => {
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const registryWithPeerDeps: CommunityRegistry = {
      ...baseRegistry,
      components: {
        'my-card': {
          ...baseRegistry.components['my-card'],
          peerDependencies: { 'react-aria': '^3.0.0' },
        },
      },
    };

    // Pre-create the component with identical content so the installer
    // marks it as skipped.
    const componentDir = path.join(tempDir, 'src/components/MyCard');
    await fs.ensureDir(componentDir);
    await fs.writeFile(
      path.join(componentDir, 'MyCard.tsx'),
      '// fetched component',
      'utf-8'
    );
    await fs.writeFile(
      path.join(componentDir, 'MyCard.css'),
      '/* fetched css */',
      'utf-8'
    );

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      tempDir,
      testConfig,
      testSource,
      registryWithPeerDeps,
      output
    );

    await installer.installComponents(['my-card'], createTestAddOptions());

    expect(output.note).not.toHaveBeenCalled();
  });
});
