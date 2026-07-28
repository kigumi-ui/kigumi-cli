/**
 * Remote Installer — Cross-Framework Staging Tests
 *
 * Verifies that RemoteComponentInstaller, when given the
 * `crossFramework` option, stages source files into
 * `.kigumi/foreign/<slug>/` instead of installing them into
 * `componentsDir`. The staging is the CLI half of the cross-framework
 * conversion flow; an agent skill consumes the staged files later.
 *
 * Lives in its own file to avoid the module-level mocks in
 * remote-installer.test.ts (we want the real github-fetcher local-source
 * code path here).
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

const vueConfig: KigumiConfig = {
  framework: 'vue' as const,
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
} as KigumiConfig;

async function stageReactRegistry(registryDir: string): Promise<{
  registry: CommunityRegistry;
  source: LocalRegistrySource;
}> {
  // Real on-disk React component file
  await fs.ensureDir(path.join(registryDir, 'src/components/examples'));
  await fs.writeFile(
    path.join(registryDir, 'src/components/examples/LoginExample.tsx'),
    "import { Button, Input, Card } from '@/components/ui';\n" +
      'export const LoginExample = () => null;\n'
  );
  await fs.writeFile(
    path.join(registryDir, 'src/components/examples/LoginExample.css'),
    '.login-example { padding: 1rem; }\n'
  );

  const registry: CommunityRegistry = {
    name: 'react-team-registry',
    version: '0.1.0',
    frameworks: ['react'],
    components: {
      'login-example': {
        name: 'LoginExample',
        description: 'Login form composed of Card, Input, and Button',
        category: 'Authentication',
        dependencies: [],
        files: {
          react: {
            component: 'src/components/examples/LoginExample.tsx',
            css: 'src/components/examples/LoginExample.css',
            extras: [],
          },
        },
      },
    },
    themes: {},
  };

  const source: LocalRegistrySource = {
    kind: 'local',
    url: registryDir,
    absolutePath: registryDir,
  };

  return { registry, source };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RemoteComponentInstaller — cross-framework staging', () => {
  let projectDir: string;
  let registryDir: string;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    projectDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-xfw-proj-'))
    );
    registryDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-xfw-reg-'))
    );
  });

  afterEach(async () => {
    await fs.remove(projectDir);
    await fs.remove(registryDir);
  });

  it('stages foreign-framework files into .kigumi/foreign/<slug>/ when crossFramework is set', async () => {
    const { registry, source } = await stageReactRegistry(registryDir);
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const installer = new RemoteComponentInstaller(
      projectDir,
      vueConfig,
      source,
      registry,
      createMockOutput()
    );

    const results = await installer.installComponents(
      ['login-example'],
      createTestAddOptions({ crossFramework: true })
    );

    // The result is a successful "staged" install
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'LoginExample',
      success: true,
      staged: true,
      sourceFramework: 'react',
    });

    // Files land in .kigumi/foreign/login-example/, NOT in componentsDir
    const stagedDir = path.join(projectDir, '.kigumi/foreign/login-example');
    expect(await fs.pathExists(stagedDir)).toBe(true);
    expect(await fs.pathExists(path.join(stagedDir, 'LoginExample.tsx'))).toBe(
      true
    );
    expect(await fs.pathExists(path.join(stagedDir, 'LoginExample.css'))).toBe(
      true
    );
    expect(await fs.pathExists(path.join(stagedDir, '_meta.json'))).toBe(true);

    // Nothing was installed into the regular componentsDir
    const componentsTarget = path.join(
      projectDir,
      'src/components/ui/LoginExample'
    );
    expect(await fs.pathExists(componentsTarget)).toBe(false);
  });

  it('writes a _meta.json with sourceFramework and registry provenance', async () => {
    const { registry, source } = await stageReactRegistry(registryDir);
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const installer = new RemoteComponentInstaller(
      projectDir,
      vueConfig,
      source,
      registry,
      createMockOutput()
    );

    await installer.installComponents(
      ['login-example'],
      createTestAddOptions({ crossFramework: true })
    );

    const meta = await fs.readJSON(
      path.join(projectDir, '.kigumi/foreign/login-example/_meta.json')
    );

    expect(meta.sourceFramework).toBe('react');
    expect(meta.targetFramework).toBe('vue');
    expect(meta.componentSlug).toBe('login-example');
    expect(meta.componentName).toBe('LoginExample');
    expect(meta.sourceRegistryName).toBe('react-team-registry');
    expect(meta.sourceRegistryUrl).toBe(registryDir);
    expect(typeof meta.fetchedAt).toBe('string');
    // ISO 8601-ish
    expect(meta.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('overwrites a stale .kigumi/foreign/<slug>/ silently when run twice', async () => {
    const { registry, source } = await stageReactRegistry(registryDir);
    const stagedDir = path.join(projectDir, '.kigumi/foreign/login-example');

    // Pre-seed a stale file that should be removed by the next run
    await fs.ensureDir(stagedDir);
    await fs.writeFile(path.join(stagedDir, 'stale-leftover.txt'), 'old');

    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const installer = new RemoteComponentInstaller(
      projectDir,
      vueConfig,
      source,
      registry,
      createMockOutput()
    );

    await installer.installComponents(
      ['login-example'],
      createTestAddOptions({ crossFramework: true })
    );

    // Stale file is gone
    expect(
      await fs.pathExists(path.join(stagedDir, 'stale-leftover.txt'))
    ).toBe(false);
    // Fresh files are present
    expect(await fs.pathExists(path.join(stagedDir, 'LoginExample.tsx'))).toBe(
      true
    );
  });

  it('still installs normally (not stages) when comp.files has the target framework, even with crossFramework set', async () => {
    // Build a registry that has BOTH react and vue files for the component
    await fs.ensureDir(path.join(registryDir, 'src/components/examples'));
    await fs.writeFile(
      path.join(registryDir, 'src/components/examples/LoginExample.tsx'),
      'export const LoginExample = () => null;\n'
    );
    await fs.writeFile(
      path.join(registryDir, 'src/components/examples/LoginExample.vue'),
      '<template><div /></template>\n'
    );

    const registry: CommunityRegistry = {
      name: 'multi-framework-registry',
      version: '0.1.0',
      frameworks: ['react', 'vue'],
      components: {
        'login-example': {
          name: 'LoginExample',
          dependencies: [],
          files: {
            react: {
              component: 'src/components/examples/LoginExample.tsx',
              extras: [],
            },
            vue: {
              component: 'src/components/examples/LoginExample.vue',
              extras: [],
            },
          },
        },
      },
      themes: {},
    };

    const source: LocalRegistrySource = {
      kind: 'local',
      url: registryDir,
      absolutePath: registryDir,
    };

    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const installer = new RemoteComponentInstaller(
      projectDir,
      vueConfig,
      source,
      registry,
      createMockOutput()
    );

    const results = await installer.installComponents(
      ['login-example'],
      createTestAddOptions({ crossFramework: true })
    );

    expect(results[0].staged).toBeFalsy();
    // Vue file installed normally
    expect(
      await fs.pathExists(
        path.join(projectDir, 'src/components/ui/LoginExample/LoginExample.vue')
      )
    ).toBe(true);
    // No staging dir created
    expect(await fs.pathExists(path.join(projectDir, '.kigumi/foreign'))).toBe(
      false
    );
  });

  it('throws when crossFramework is NOT set and comp.files lacks the target framework', async () => {
    const { registry, source } = await stageReactRegistry(registryDir);
    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const installer = new RemoteComponentInstaller(
      projectDir,
      vueConfig,
      source,
      registry,
      createMockOutput()
    );

    // No crossFramework option — should throw at the per-component check
    await expect(
      installer.installComponents(['login-example'], createTestAddOptions())
    ).rejects.toThrow(/does not support vue/);
  });

  it('does not surface peerDependencies for staged components (F-116 follow-up)', async () => {
    const { registry, source } = await stageReactRegistry(registryDir);
    // Attach a peerDependency to the staged component — it must NOT show up
    // in the post-install note since cross-framework files are not wired
    // into the consumer's project tree.
    registry.components['login-example'].peerDependencies = {
      'react-aria': '^3.0.0',
    };

    const { RemoteComponentInstaller } =
      await import('../../src/commands/add/remote-installer.js');

    const output = createMockOutput();
    const installer = new RemoteComponentInstaller(
      projectDir,
      vueConfig,
      source,
      registry,
      output
    );

    await installer.installComponents(
      ['login-example'],
      createTestAddOptions({ crossFramework: true })
    );

    expect(output.note).not.toHaveBeenCalled();
  });
});
