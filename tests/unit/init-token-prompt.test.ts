/**
 * Init Pro Token Prompt Tests
 *
 * `init` asks for a Web Awesome Pro token when it finds none. The answer is a
 * secret: it goes through a masked prompt, so it never appears on screen, in
 * a terminal recording or in a shared session.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildConfigInteractive } from '../../src/commands/init/config-builder.js';
import {
  resetPromptsForTesting,
  setPromptsForTesting,
} from '../../src/prompts/index.js';
import type { ProjectInfo } from '../../src/utils/detect-framework.js';
import { createRecordingOutput } from './_helpers/output.js';
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
      '/tmp/kigumi-token-prompt',
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
      '/tmp/kigumi-token-prompt',
      createRecordingOutput(),
      'free'
    );

    expect(proToken).toBeUndefined();
  });
});
