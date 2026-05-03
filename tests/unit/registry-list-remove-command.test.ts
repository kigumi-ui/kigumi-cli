/**
 * Registry List & Remove Source Command Tests
 *
 * Tests for src/commands/registry/list-sources.ts and remove-source.ts.
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) instead of module-level
 * mocks for @clack/prompts and src/output/index.js.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

function createConfig(overrides: Record<string, unknown> = {}) {
  return {
    framework: 'react',
    typescript: true,
    componentsDir: 'src/components/ui',
    utilsDir: 'src/lib',
    theme: {
      selected: 'default',
      palette: 'default',
      brandColor: 'blue',
    },
    registries: [],
    ...overrides,
  };
}

describe('registryListSourcesAction', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;
  let exitMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-reg-list-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    originalExit = process.exit;
    exitMock = vi.fn();
    process.exit = exitMock as unknown as typeof process.exit;
  });

  afterEach(async () => {
    await clearTestSeams();
    process.chdir(originalCwd);
    process.exit = originalExit;
    await fs.remove(testDir);
  });

  it('should show message when no registries configured', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig()
    );

    const { registryListSourcesAction } =
      await import('../../src/commands/registry/list-sources.js');

    await registryListSourcesAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([
          expect.stringContaining('No community registries'),
        ]),
      })
    );
  });

  it('should list configured registries', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig({
        registries: [
          {
            url: 'https://github.com/user/components',
            name: 'awesome-components',
          },
          {
            url: 'https://github.com/org/themes',
            name: 'org-themes',
          },
        ],
      })
    );

    const { registryListSourcesAction } =
      await import('../../src/commands/registry/list-sources.js');

    await registryListSourcesAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([
          expect.stringContaining('awesome-components'),
        ]),
      })
    );
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([expect.stringContaining('org-themes')]),
      })
    );
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('2 registry')]),
      })
    );
  });

  it('should show usage hint', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig({
        registries: [{ url: 'https://github.com/user/reg', name: 'my-reg' }],
      })
    );

    const { registryListSourcesAction } =
      await import('../../src/commands/registry/list-sources.js');

    await registryListSourcesAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'note',
        args: expect.arrayContaining([
          'Usage',
          expect.stringContaining('kigumi add'),
        ]),
      })
    );
  });

  it('should exit with error code when config is missing', async () => {
    const { registryListSourcesAction } =
      await import('../../src/commands/registry/list-sources.js');

    await registryListSourcesAction({ cwd: testDir });

    // handleError calls process.exit with a non-zero exit code
    expect(exitMock).toHaveBeenCalledWith(expect.any(Number));
    const exitCode = exitMock.mock.calls[0][0];
    expect(exitCode).toBeGreaterThan(0);
    // Error output was generated
    expect(output.calls.some((c) => c.method === 'error')).toBe(true);
  });
});

describe('registryRemoveSourceAction', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;
  let exitMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-reg-remove-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    originalExit = process.exit;
    exitMock = vi.fn();
    process.exit = exitMock as unknown as typeof process.exit;
  });

  afterEach(async () => {
    await clearTestSeams();
    process.chdir(originalCwd);
    process.exit = originalExit;
    await fs.remove(testDir);
  });

  it('should remove registry by URL', async () => {
    const config = createConfig({
      registries: [
        { url: 'https://github.com/user/reg', name: 'my-reg' },
        { url: 'https://github.com/user/other', name: 'other-reg' },
      ],
    });
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

    const { registryRemoveSourceAction } =
      await import('../../src/commands/registry/remove-source.js');

    await registryRemoveSourceAction('https://github.com/user/reg', {
      cwd: testDir,
    });

    // Verify config was updated
    const updatedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(updatedConfig.registries).toHaveLength(1);
    expect(updatedConfig.registries[0].name).toBe('other-reg');

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('Removed')]),
      })
    );
  });

  it('should remove registry by name', async () => {
    const config = createConfig({
      registries: [{ url: 'https://github.com/user/reg', name: 'my-reg' }],
    });
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

    const { registryRemoveSourceAction } =
      await import('../../src/commands/registry/remove-source.js');

    await registryRemoveSourceAction('my-reg', { cwd: testDir });

    const updatedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(updatedConfig.registries).toHaveLength(0);
  });

  it('should warn when registry not found', async () => {
    const config = createConfig({
      registries: [{ url: 'https://github.com/user/reg', name: 'my-reg' }],
    });
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

    const { registryRemoveSourceAction } =
      await import('../../src/commands/registry/remove-source.js');

    await registryRemoveSourceAction('nonexistent', { cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'warning',
        args: expect.arrayContaining([expect.stringContaining('not found')]),
      })
    );
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('No changes')]),
      })
    );
  });

  it('should warn about affected components when removing registry', async () => {
    const config = createConfig({
      registries: [{ url: 'https://github.com/user/reg', name: 'my-reg' }],
      installedComponents: {
        button: {
          source: 'community',
          registryUrl: 'https://github.com/user/reg',
        },
        card: {
          source: 'community',
          registryUrl: 'https://github.com/user/reg',
        },
      },
    });
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);

    const { registryRemoveSourceAction } =
      await import('../../src/commands/registry/remove-source.js');

    await registryRemoveSourceAction('https://github.com/user/reg', {
      cwd: testDir,
    });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'warning',
        args: expect.arrayContaining([
          expect.stringContaining('2 installed component'),
        ]),
      })
    );
  });

  it('should exit with error code when config is missing', async () => {
    const { registryRemoveSourceAction } =
      await import('../../src/commands/registry/remove-source.js');

    await registryRemoveSourceAction('https://github.com/user/reg', {
      cwd: testDir,
    });

    // handleError calls process.exit with a non-zero exit code
    expect(exitMock).toHaveBeenCalledWith(expect.any(Number));
    const exitCode = exitMock.mock.calls[0][0];
    expect(exitCode).toBeGreaterThan(0);
    // Error output was generated
    expect(output.calls.some((c) => c.method === 'error')).toBe(true);
  });
});
