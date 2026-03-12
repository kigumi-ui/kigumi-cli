/**
 * Registry Validate Command Tests
 *
 * Tests for src/commands/registry/validate.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  log: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

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

describe('registryValidateAction', () => {
  let testDir: string;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockOutput.spinner.mockReturnValue(mockSpinner);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-reg-validate-'))
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should fail when registry.json does not exist', async () => {
    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    // Should report failure
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('registry.json exists')
    );
    expect(mockOutput.outro).toHaveBeenCalledWith(
      expect.stringContaining('failed')
    );
  });

  it('should fail on invalid JSON', async () => {
    await fs.writeFile(path.join(testDir, 'registry.json'), '{invalid json');

    const { registryValidateAction } =
      await import('../../src/commands/registry/validate.js');

    await registryValidateAction({ cwd: testDir });

    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid JSON')
    );
    expect(mockOutput.outro).toHaveBeenCalledWith(
      expect.stringContaining('failed')
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

    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Schema validation')
    );
    expect(mockOutput.outro).toHaveBeenCalledWith(
      expect.stringContaining('failed')
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

    expect(mockOutput.outro).toHaveBeenCalledWith(
      expect.stringContaining('valid')
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
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('file not found')
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

    expect(mockOutput.outro).toHaveBeenCalledWith(
      expect.stringContaining('valid')
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

    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('unexpected extension')
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
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Theme "dark"')
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
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('depends on "button"')
    );
    expect(mockOutput.outro).toHaveBeenCalledWith(
      expect.stringContaining('failed')
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

    expect(mockOutput.outro).toHaveBeenCalledWith(
      expect.stringContaining('valid')
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
    const failCalls = mockOutput.info.mock.calls.filter((call: string[]) =>
      call[0].includes('✗')
    );
    expect(failCalls.length).toBeGreaterThanOrEqual(2);
    expect(mockOutput.outro).toHaveBeenCalledWith(
      expect.stringContaining('failed')
    );
  });
});
