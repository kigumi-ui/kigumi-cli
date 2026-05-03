/**
 * Registry Validate Command Tests
 *
 * Tests for src/commands/registry/validate.ts.
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

describe('registryValidateAction', () => {
  let testDir: string;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-reg-validate-'))
    );
  });

  afterEach(async () => {
    await clearTestSeams();
    await fs.remove(testDir);
  });

  it('should fail when registry.json does not exist', async () => {
    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    // Should report failure
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([
          expect.stringContaining('registry.json exists'),
        ]),
      })
    );
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('failed')]),
      })
    );
  });

  it('should fail on invalid JSON', async () => {
    await fs.writeFile(path.join(testDir, 'registry.json'), '{invalid json');

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([expect.stringContaining('Valid JSON')]),
      })
    );
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('failed')]),
      })
    );
  });

  it('should fail on invalid schema', async () => {
    await fs.writeJSON(path.join(testDir, 'registry.json'), {
      name: 'test',
      // missing required fields
    });

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([
          expect.stringContaining('Schema validation'),
        ]),
      })
    );
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('failed')]),
      })
    );
  });

  it('should pass on valid minimal registry', async () => {
    const validRegistry = {
      name: 'test-registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {},
      themes: {},
    };
    await fs.writeJSON(path.join(testDir, 'registry.json'), validRegistry);

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('valid')]),
      })
    );
  });

  it('should detect missing referenced files', async () => {
    const registry = {
      name: 'test-registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {
        button: {
          name: 'Button',
          files: {
            react: {
              component: 'components/react/button.tsx',
              extras: [],
            },
          },
          dependencies: [],
        },
      },
      themes: {},
    };
    await fs.writeJSON(path.join(testDir, 'registry.json'), registry);

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    // Should report file not found
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([
          expect.stringContaining('file not found'),
        ]),
      })
    );
  });

  it('should pass when referenced files exist', async () => {
    const registry = {
      name: 'test-registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {
        button: {
          name: 'Button',
          files: {
            react: {
              component: 'components/react/button.tsx',
              extras: [],
            },
          },
          dependencies: [],
        },
      },
      themes: {},
    };
    await fs.writeJSON(path.join(testDir, 'registry.json'), registry);

    // Create the referenced file
    await fs.ensureDir(path.join(testDir, 'components/react'));
    await fs.writeFile(
      path.join(testDir, 'components/react/button.tsx'),
      'export const Button = () => <button />;'
    );

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('valid')]),
      })
    );
  });

  it('should detect wrong file extensions for framework', async () => {
    const registry = {
      name: 'test-registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {
        button: {
          name: 'Button',
          files: {
            react: {
              component: 'components/react/button.vue', // Wrong ext for React
              extras: [],
            },
          },
          dependencies: [],
        },
      },
      themes: {},
    };
    await fs.writeJSON(path.join(testDir, 'registry.json'), registry);

    // Create the file
    await fs.ensureDir(path.join(testDir, 'components/react'));
    await fs.writeFile(path.join(testDir, 'components/react/button.vue'), '');

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([
          expect.stringContaining('unexpected extension'),
        ]),
      })
    );
  });

  it('should validate theme files', async () => {
    const registry = {
      name: 'test-registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {},
      themes: {
        dark: {
          name: 'Dark',
          files: {
            css: 'themes/dark.css',
          },
        },
      },
    };
    await fs.writeJSON(path.join(testDir, 'registry.json'), registry);

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    // Should report theme file not found
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([expect.stringContaining('Theme "dark"')]),
      })
    );
  });

  it('should detect missing dependency references', async () => {
    const registry = {
      name: 'test-registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {
        card: {
          name: 'Card',
          files: {
            react: {
              component: 'components/react/card.tsx',
              extras: [],
            },
          },
          dependencies: ['button'], // button is NOT in registry
        },
      },
      themes: {},
    };
    await fs.writeJSON(path.join(testDir, 'registry.json'), registry);
    await fs.ensureDir(path.join(testDir, 'components/react'));
    await fs.writeFile(path.join(testDir, 'components/react/card.tsx'), '');

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    // Should report dependency error
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'info',
        args: expect.arrayContaining([
          expect.stringContaining('depends on "button"'),
        ]),
      })
    );
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('failed')]),
      })
    );
  });

  it('should pass when dependencies are valid', async () => {
    const registry = {
      name: 'test-registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {
        button: {
          name: 'Button',
          files: {
            react: {
              component: 'components/react/button.tsx',
              extras: [],
            },
          },
          dependencies: [],
        },
        card: {
          name: 'Card',
          files: {
            react: {
              component: 'components/react/card.tsx',
              extras: [],
            },
          },
          dependencies: ['button'], // button IS in registry
        },
      },
      themes: {},
    };
    await fs.writeJSON(path.join(testDir, 'registry.json'), registry);
    await fs.ensureDir(path.join(testDir, 'components/react'));
    await fs.writeFile(path.join(testDir, 'components/react/button.tsx'), '');
    await fs.writeFile(path.join(testDir, 'components/react/card.tsx'), '');

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('valid')]),
      })
    );
  });

  it('should report multiple failures in a single run', async () => {
    // Invalid schema + intentionally wrong to test multi-error output
    await fs.writeJSON(path.join(testDir, 'registry.json'), {
      name: 'test',
      version: '1.0.0',
      frameworks: ['react'],
      components: {
        card: {
          name: 'Card',
          files: {
            react: {
              component: 'components/react/card.vue', // Wrong extension
              extras: [],
            },
          },
          dependencies: ['missing-dep'], // Missing dep
        },
      },
      themes: {
        dark: {
          name: 'Dark',
          files: { css: 'themes/nonexistent.css' }, // Missing file
        },
      },
    });

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    // Should have multiple failures
    const failCalls = output.calls.filter(
      (c) =>
        c.method === 'info' &&
        typeof c.args[0] === 'string' &&
        c.args[0].includes('✗')
    );
    expect(failCalls.length).toBeGreaterThanOrEqual(2);
    expect(output.calls).toContainEqual(
      expect.objectContaining({
        method: 'outro',
        args: expect.arrayContaining([expect.stringContaining('failed')]),
      })
    );
  });
});
