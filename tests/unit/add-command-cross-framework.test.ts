/**
 * Add Command — Cross-Framework Tests
 *
 * End-to-end tests through `addCommand` for the `--cross-framework`
 * opt-in flow. Uses a real local-filesystem registry source so the
 * full path (parseRegistrySource → fetchFile → stageForeignFiles) is
 * exercised without mocks.
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) instead of a module-level
 * mock for src/output/index.js. The registry-cache mock stays since
 * registry-cache has no DI seam yet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createTestAddOptions } from './_helpers/add-options.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

vi.mock('../../src/utils/registry-cache.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/utils/registry-cache.js')
  >('../../src/utils/registry-cache.js');
  return {
    ...actual,
    getRegistryCache: vi.fn().mockReturnValue({
      getFile: vi.fn().mockResolvedValue(null),
      setFile: vi.fn().mockResolvedValue(undefined),
      getRegistry: vi.fn().mockResolvedValue(null),
      setRegistry: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function writeKigumiConfig(
  projectDir: string,
  framework: 'react' | 'vue' | 'angular'
): Promise<void> {
  await fs.writeJSON(path.join(projectDir, 'kigumi.config.json'), {
    framework,
    typescript: true,
    componentsDir: 'src/components/ui',
    utilsDir: 'src/lib',
    stylesDir: 'src/styles',
    theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
  });
}

async function stageReactRegistry(registryDir: string): Promise<void> {
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

  await fs.writeJSON(path.join(registryDir, 'registry.json'), {
    $schema: 'https://kigumi.style/schemas/community-registry.json',
    name: 'react-team-registry',
    version: '0.1.0',
    frameworks: ['react'],
    components: {
      'login-example': {
        name: 'LoginExample',
        description: 'Login form composed of Card, Input, and Button',
        category: 'Authentication',
        files: {
          react: {
            component: 'src/components/examples/LoginExample.tsx',
            css: 'src/components/examples/LoginExample.css',
          },
        },
      },
    },
    themes: {},
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('addCommand --cross-framework (foreign-framework registry)', () => {
  let projectDir: string;
  let registryDir: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    projectDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-add-xfw-proj-'))
    );
    registryDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-add-xfw-reg-'))
    );
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    await clearTestSeams();
    process.exit = originalExit;
    await fs.remove(projectDir);
    await fs.remove(registryDir);
    vi.resetModules();
  });

  it('stages foreign files when --cross-framework is set on a vue project pointing at a react-only registry', async () => {
    await writeKigumiConfig(projectDir, 'vue');
    await stageReactRegistry(registryDir);

    const { addCommand } = await import('../../src/commands/add/index.js');

    await addCommand(
      ['login-example'],
      createTestAddOptions({
        from: registryDir,
        crossFramework: true,
        cwd: projectDir,
        yes: true,
      })
    );

    // Files staged
    const stagedDir = path.join(projectDir, '.kigumi/foreign/login-example');
    expect(await fs.pathExists(stagedDir)).toBe(true);
    expect(await fs.pathExists(path.join(stagedDir, 'LoginExample.tsx'))).toBe(
      true
    );
    expect(await fs.pathExists(path.join(stagedDir, 'LoginExample.css'))).toBe(
      true
    );
    const meta = await fs.readJSON(path.join(stagedDir, '_meta.json'));
    expect(meta.sourceFramework).toBe('react');
    expect(meta.targetFramework).toBe('vue');

    // Process should not have been killed by an error path
    expect(process.exit).not.toHaveBeenCalledWith(expect.any(Number));

    // Hand-off message printed for the agent skill discovery surface
    const handoffNote = output.calls.find(
      (c) =>
        c.method === 'note' &&
        c.args.some(
          (arg) =>
            typeof arg === 'string' && arg.includes('kigumi-cross-framework')
        )
    );
    expect(handoffNote).toBeDefined();
    // Hand-off prompt mentions the slug and target framework
    const handoffNoteText = handoffNote!.args.join(' ');
    expect(handoffNoteText).toContain('login-example');
    expect(handoffNoteText).toContain('vue');
  });

  it('fails (not stages) when --cross-framework is NOT set against a foreign-framework registry', async () => {
    await writeKigumiConfig(projectDir, 'vue');
    await stageReactRegistry(registryDir);

    const { addCommand } = await import('../../src/commands/add/index.js');

    await addCommand(
      ['login-example'],
      createTestAddOptions({
        from: registryDir,
        cwd: projectDir,
        yes: true,
      })
    );

    // No staged dir
    expect(await fs.pathExists(path.join(projectDir, '.kigumi/foreign'))).toBe(
      false
    );

    // The CLI should have invoked process.exit (error path through handleError)
    expect(process.exit).toHaveBeenCalled();
  });

  it('does not affect normal --from installs against same-framework registries', async () => {
    await writeKigumiConfig(projectDir, 'react');
    await stageReactRegistry(registryDir);

    const { addCommand } = await import('../../src/commands/add/index.js');

    await addCommand(
      ['login-example'],
      createTestAddOptions({
        from: registryDir,
        cwd: projectDir,
        yes: true,
      })
    );

    // Normal install path: file lands in componentsDir
    const installed = path.join(
      projectDir,
      'src/components/ui/LoginExample/LoginExample.tsx'
    );
    expect(await fs.pathExists(installed)).toBe(true);

    // No staged dir
    expect(await fs.pathExists(path.join(projectDir, '.kigumi/foreign'))).toBe(
      false
    );
  });
});
