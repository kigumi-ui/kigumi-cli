/**
 * Registry Connect Command Tests
 *
 * Tests for src/commands/registry/add-source.ts (`registryConnectAction`),
 * focusing on local-filesystem registry sources.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { CommunityRegistry } from '../../src/schemas/community-registry.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSpinner = {
  start: vi.fn(),
  stop: vi.fn(),
  message: vi.fn(),
  error: vi.fn(),
};

const mockOutput = {
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

vi.mock('../../src/output/index.js', () => ({
  getOutput: () => mockOutput,
  ConsoleOutput: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function writeKigumiConfig(
  projectDir: string,
  framework: 'react' | 'vue' | 'angular'
): Promise<void> {
  await fs.writeJSON(path.join(projectDir, 'kigumi.config.json'), {
    $schema: 'https://kigumi.style/schemas/kigumi-config.json',
    framework,
    typescript: true,
    componentsDir: 'src/components',
    utilsDir: 'src/lib',
    stylesDir: 'src/styles',
    theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
  });
}

async function writeRegistryJson(
  registryDir: string,
  registry: Partial<CommunityRegistry> & { name: string; frameworks: string[] }
): Promise<void> {
  await fs.writeJSON(path.join(registryDir, 'registry.json'), {
    $schema: 'https://kigumi.style/schemas/community-registry.json',
    version: '0.1.0',
    components: {},
    themes: {},
    ...registry,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('registryConnectAction — local filesystem source', () => {
  let projectDir: string;
  let registryDir: string;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockOutput.spinner.mockReturnValue(mockSpinner);

    projectDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-connect-proj-'))
    );
    registryDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-connect-reg-'))
    );

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    process.exit = originalExit;
    await fs.remove(projectDir);
    await fs.remove(registryDir);
  });

  it('connects to a local registry via absolute path', async () => {
    await writeKigumiConfig(projectDir, 'react');
    await writeRegistryJson(registryDir, {
      name: 'sibling-react-registry',
      frameworks: ['react'],
    });

    const { registryConnectAction } =
      await import('../../src/commands/registry/add-source.js');

    await registryConnectAction(registryDir, { cwd: projectDir });

    const config = await fs.readJSON(
      path.join(projectDir, 'kigumi.config.json')
    );
    expect(config.registries).toHaveLength(1);
    expect(config.registries[0].name).toBe('sibling-react-registry');
    expect(config.registries[0].url).toBe(registryDir);
  });

  it('connects to a local registry via relative path resolved from cwd', async () => {
    await writeKigumiConfig(projectDir, 'react');
    await writeRegistryJson(registryDir, {
      name: 'sibling-react-registry',
      frameworks: ['react'],
    });

    const relativeFromProject = path.relative(projectDir, registryDir);

    const { registryConnectAction } =
      await import('../../src/commands/registry/add-source.js');

    await registryConnectAction(relativeFromProject, { cwd: projectDir });

    const config = await fs.readJSON(
      path.join(projectDir, 'kigumi.config.json')
    );
    expect(config.registries).toHaveLength(1);
    // Stored URL is the resolved absolute path
    expect(config.registries[0].url).toBe(registryDir);
  });

  it('does not duplicate when the same local registry is connected twice', async () => {
    await writeKigumiConfig(projectDir, 'react');
    await writeRegistryJson(registryDir, {
      name: 'sibling-react-registry',
      frameworks: ['react'],
    });

    const { registryConnectAction } =
      await import('../../src/commands/registry/add-source.js');

    await registryConnectAction(registryDir, { cwd: projectDir });
    await registryConnectAction(registryDir, { cwd: projectDir });

    const config = await fs.readJSON(
      path.join(projectDir, 'kigumi.config.json')
    );
    expect(config.registries).toHaveLength(1);
  });

  it('warns (does not throw) when connecting a foreign-framework registry', async () => {
    // Vue project, React-only registry — used to throw, now should warn
    // and still register so the user can use --cross-framework later.
    await writeKigumiConfig(projectDir, 'vue');
    await writeRegistryJson(registryDir, {
      name: 'react-team-registry',
      frameworks: ['react'],
    });

    const { registryConnectAction } =
      await import('../../src/commands/registry/add-source.js');

    await registryConnectAction(registryDir, { cwd: projectDir });

    // Registry was added despite framework mismatch
    const config = await fs.readJSON(
      path.join(projectDir, 'kigumi.config.json')
    );
    expect(config.registries).toHaveLength(1);
    expect(config.registries[0].name).toBe('react-team-registry');

    // A warning was emitted that mentions both frameworks and --cross-framework
    const warningCalls = mockOutput.warning.mock.calls.flat() as string[];
    const hasFrameworkWarning = warningCalls.some(
      (msg) =>
        typeof msg === 'string' &&
        msg.includes('react') &&
        msg.includes('vue') &&
        msg.includes('--cross-framework')
    );
    expect(hasFrameworkWarning).toBe(true);
  });
});
