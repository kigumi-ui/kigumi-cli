/**
 * Init Pro Token Tests
 *
 * The token a user gives `init` (the prompt, or --token) is a secret: it goes
 * through a masked prompt, so it never appears on screen, in a terminal
 * recording or in a shared session. It is also the token they mean: init's
 * own install uses it over one Kigumi finds elsewhere (issue #160).
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildConfigInteractive } from '../../src/commands/init/config-builder.js';
import { initCommand } from '../../src/commands/init/index.js';
import {
  resetOutputForTesting,
  setOutputForTesting,
} from '../../src/output/index.js';
import {
  resetPromptsForTesting,
  setPromptsForTesting,
} from '../../src/prompts/index.js';
import * as installer from '../../src/utils/dependency-installer.js';
import * as projectConfig from '../../src/utils/project-config.js';
import type { ProjectInfo } from '../../src/utils/detect-framework.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';

const projectInfo: ProjectInfo = {
  framework: 'react',
  typescript: true,
  packageManager: 'pnpm',
  hasVite: true,
  isNext: false,
  sourceLayout: 'src',
};

const options = {
  framework: 'react' as const,
  typescript: true,
  theme: 'default',
  palette: 'default',
  brand: 'blue',
  componentsDir: 'src/components/ui',
  stylesDir: 'src/styles',
};

describe('init Pro token prompt', () => {
  beforeEach(() => {
    resetPromptsForTesting();
  });

  afterEach(() => {
    resetPromptsForTesting();
  });

  it('asks for the token with a masked prompt', async () => {
    // No `text` script: a plain text prompt for the token fails loud.
    setPromptsForTesting(
      createTestPrompts({
        confirm: [true],
        password: ['typed-token-1234567890'],
      })
    );

    const { proToken } = await buildConfigInteractive(
      options,
      projectInfo,
      os.tmpdir(),
      createRecordingOutput(),
      'free'
    );

    expect(proToken).toBe('typed-token-1234567890');
  });

  it('does not ask when the user has no token', async () => {
    setPromptsForTesting(createTestPrompts({ confirm: [false] }));

    const { proToken } = await buildConfigInteractive(
      options,
      projectInfo,
      os.tmpdir(),
      createRecordingOutput(),
      'free'
    );

    expect(proToken).toBeUndefined();
  });
});

describe('init --token', () => {
  let projectDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let output: RecordingOutput;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    projectDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-init-token-'))
    );
    await fs.writeJSON(path.join(projectDir, 'package.json'), {
      name: 'app',
      version: '0.0.0',
      dependencies: { react: '^19.0.0' },
      devDependencies: { typescript: '^5.0.0', vite: '^7.0.0' },
    });
    // A token in the environment that is not the one the user passes.
    process.env.WEBAWESOME_NPM_TOKEN = 'environment-token-123456';
    process.env.KIGUMI_SKIP_GLOBAL_NPMRC = '1';
    output = createRecordingOutput();
    setOutputForTesting(output);
    vi.spyOn(installer, 'installDependencies').mockResolvedValue(undefined);
    vi.spyOn(projectConfig, 'configureVitePathAliases').mockResolvedValue(true);
    vi.spyOn(projectConfig, 'configureTSConfig').mockResolvedValue(true);
  });

  afterEach(async () => {
    process.env = originalEnv;
    resetOutputForTesting();
    vi.restoreAllMocks();
    await fs.remove(projectDir);
  });

  it('hands the --token value to the install init runs', async () => {
    await initCommand({
      cwd: projectDir,
      yes: true,
      framework: 'react',
      token: 'flag-token-1234567890',
    });

    expect(installer.installDependencies).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'pro', token: 'flag-token-1234567890' })
    );
  });

  // After an install the installer says it; Next Steps does not repeat it.
  // Without one, Next Steps is the only place that does.
  it.each([
    [true, 'after an install', false],
    [false, 'with --no-install', true],
  ])(
    'asks for WEBAWESOME_NPM_TOKEN in Next Steps only without an install (install: %s, %s)',
    async (install, _label, expected) => {
      delete process.env.WEBAWESOME_NPM_TOKEN;

      await initCommand({
        cwd: projectDir,
        yes: true,
        framework: 'react',
        token: 'flag-token-1234567890',
        install,
      });

      const said = JSON.stringify(output.calls);
      expect(
        said.includes('Set WEBAWESOME_NPM_TOKEN in your environment')
      ).toBe(expected);
    }
  );
});
