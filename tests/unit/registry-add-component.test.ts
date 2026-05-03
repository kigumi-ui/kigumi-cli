/**
 * Tests for `registryAddComponentAction`.
 *
 * Light-spy convention (cluster S, F-126): only the genuinely interactive
 * `prompts` keys are spied; output decoration runs unmocked. Assertions go
 * through real fs side-effects on the temp registry.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import * as p from '../../src/prompts/index.js';
import { registryAddComponentAction } from '../../src/commands/registry/add-component.js';
import type { CommunityRegistry } from '../../src/schemas/community-registry.js';

function makeRegistryJson(
  overrides: Partial<CommunityRegistry> = {}
): CommunityRegistry {
  return {
    $schema: 'https://kigumi.style/community-registry-schema.json',
    name: 'test-registry',
    version: '0.1.0',
    frameworks: ['react'],
    components: {},
    themes: {},
    ...overrides,
  };
}

describe('registryAddComponentAction', () => {
  let tempDir: string;
  let originalExit: typeof process.exit;
  let textSpy: ReturnType<typeof vi.spyOn>;
  let multiselectSpy: ReturnType<typeof vi.spyOn>;
  let isCancelSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-pr-p2-add-comp-')
    );
    textSpy = vi.spyOn(p, 'text');
    multiselectSpy = vi.spyOn(p, 'multiselect');
    isCancelSpy = vi.spyOn(p, 'isCancel').mockReturnValue(false);
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    textSpy.mockRestore();
    multiselectSpy.mockRestore();
    isCancelSpy.mockRestore();
    process.exit = originalExit;
    await fs.remove(tempDir);
  });

  it('writes a new entry with --slug --name --component --css flags (happy path)', async () => {
    await fs.writeJSON(path.join(tempDir, 'registry.json'), makeRegistryJson());
    await fs.ensureDir(path.join(tempDir, 'components/react/Button'));
    await fs.writeFile(
      path.join(tempDir, 'components/react/Button/Button.tsx'),
      '// stub'
    );
    await fs.writeFile(
      path.join(tempDir, 'components/react/Button/Button.css'),
      '/* stub */'
    );

    // Prompts triggered with all flags + empty existing components:
    // description, category, test (3 text calls), no multiselect (no deps).
    textSpy
      .mockResolvedValueOnce('A button')
      .mockResolvedValueOnce('Actions')
      .mockResolvedValueOnce('');

    await registryAddComponentAction({
      slug: 'wa-button',
      name: 'WA Button',
      component: 'components/react/Button/Button.tsx',
      css: 'components/react/Button/Button.css',
      cwd: tempDir,
    });

    const written = (await fs.readJSON(
      path.join(tempDir, 'registry.json')
    )) as CommunityRegistry;
    expect(written.components['wa-button']).toBeDefined();
    expect(written.components['wa-button']).toMatchObject({
      name: 'WA Button',
      description: 'A button',
      category: 'Actions',
      dependencies: [],
      files: {
        react: {
          component: 'components/react/Button/Button.tsx',
          css: 'components/react/Button/Button.css',
          extras: [],
        },
      },
    });
  });

  it('returns without writing when registry.json is missing', async () => {
    await registryAddComponentAction({ cwd: tempDir });
    expect(await fs.pathExists(path.join(tempDir, 'registry.json'))).toBe(
      false
    );
    expect(textSpy).not.toHaveBeenCalled();
  });

  it('returns without writing when registry.json fails Zod parse', async () => {
    await fs.writeJSON(path.join(tempDir, 'registry.json'), {
      broken: true,
    });
    await registryAddComponentAction({ cwd: tempDir });
    const stillBroken = await fs.readJSON(path.join(tempDir, 'registry.json'));
    expect(stillBroken).toEqual({ broken: true });
    expect(textSpy).not.toHaveBeenCalled();
  });

  it('rejects duplicate slug via the slug prompt validate function', async () => {
    await fs.writeJSON(
      path.join(tempDir, 'registry.json'),
      makeRegistryJson({
        components: {
          'wa-existing': {
            name: 'Existing',
            dependencies: [],
            files: {
              react: { component: 'a.tsx', extras: [] },
            },
          },
        },
      })
    );
    await fs.ensureDir(path.join(tempDir, 'components/react/New'));
    await fs.writeFile(
      path.join(tempDir, 'components/react/New/New.tsx'),
      '// stub'
    );

    // Cancel right after the slug prompt to exit before any further work.
    // This call queue still drives the slug prompt invocation so we can
    // capture its validate function.
    textSpy.mockResolvedValueOnce('wa-new');
    isCancelSpy.mockReturnValueOnce(true);

    await registryAddComponentAction({ cwd: tempDir });

    const slugPromptArgs = textSpy.mock.calls[0][0] as {
      validate?: (v: string) => string | undefined;
    };
    expect(slugPromptArgs.validate?.('wa-existing')).toMatch(/already exists/);
    expect(slugPromptArgs.validate?.('Has-Caps')).toMatch(/kebab-case/);
    expect(slugPromptArgs.validate?.('')).toMatch(/empty/);
    expect(slugPromptArgs.validate?.('wa-new')).toBeUndefined();

    // No new entry was written despite the cancel.
    const written = (await fs.readJSON(
      path.join(tempDir, 'registry.json')
    )) as CommunityRegistry;
    expect(Object.keys(written.components)).toEqual(['wa-existing']);
  });

  it('aborts via UserCancelledError when the user cancels mid-flow', async () => {
    await fs.writeJSON(path.join(tempDir, 'registry.json'), makeRegistryJson());

    // Drive the description prompt then cancel on isCancel(descResult).
    // text is called for: slug, name, description, category, component,
    // css, test. We cancel after the second isCancel check (description).
    textSpy
      .mockResolvedValueOnce('wa-button')
      .mockResolvedValueOnce('WA Button')
      .mockResolvedValueOnce('A description');
    // isCancel: false (slug), false (name), true (description) -> throw.
    isCancelSpy
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    await registryAddComponentAction({ cwd: tempDir });

    const written = (await fs.readJSON(
      path.join(tempDir, 'registry.json')
    )) as CommunityRegistry;
    expect(written.components).toEqual({});
  });
});
