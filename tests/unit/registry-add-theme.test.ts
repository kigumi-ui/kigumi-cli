/**
 * Tests for `registryAddThemeAction`.
 *
 * Same conventions as registry-add-component.test.ts: light spy pattern,
 * real fs in temp dir, fixture factory.
 *
 * Cluster S, F-126: rewritten to use vi.spyOn on the prompts wrapper
 * instead of a module-level mock for @clack/prompts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import * as p from '../../src/prompts/index.js';
import { registryAddThemeAction } from '../../src/commands/registry/add-theme.js';
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

describe('registryAddThemeAction', () => {
  let tempDir: string;
  let originalExit: typeof process.exit;
  let textSpy: ReturnType<typeof vi.spyOn>;
  let multiselectSpy: ReturnType<typeof vi.spyOn>;
  let isCancelSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-pr-p2-add-theme-')
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

  it('writes a new theme entry with --slug --name --css flags (happy path)', async () => {
    await fs.writeJSON(path.join(tempDir, 'registry.json'), makeRegistryJson());
    await fs.ensureDir(path.join(tempDir, 'themes/midnight'));
    await fs.writeFile(
      path.join(tempDir, 'themes/midnight/theme.css'),
      '/* stub */'
    );

    // Prompts triggered with all flags: description, variables file,
    // extends (3 text calls).
    textSpy
      .mockResolvedValueOnce('Dark mode theme')
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('');

    await registryAddThemeAction({
      slug: 'midnight',
      name: 'Midnight',
      css: 'themes/midnight/theme.css',
      cwd: tempDir,
    });

    const written = (await fs.readJSON(
      path.join(tempDir, 'registry.json')
    )) as CommunityRegistry;
    expect(written.themes['midnight']).toBeDefined();
    expect(written.themes['midnight']).toMatchObject({
      name: 'Midnight',
      description: 'Dark mode theme',
      files: { css: 'themes/midnight/theme.css' },
    });
    expect(written.themes['midnight']).not.toHaveProperty('extends');
  });

  it('returns without writing when registry.json is missing', async () => {
    await registryAddThemeAction({ cwd: tempDir });
    expect(await fs.pathExists(path.join(tempDir, 'registry.json'))).toBe(
      false
    );
    expect(textSpy).not.toHaveBeenCalled();
  });

  it('returns without writing when registry.json fails Zod parse', async () => {
    await fs.writeJSON(path.join(tempDir, 'registry.json'), {
      not: 'a registry',
    });
    await registryAddThemeAction({ cwd: tempDir });
    const stillBroken = await fs.readJSON(path.join(tempDir, 'registry.json'));
    expect(stillBroken).toEqual({ not: 'a registry' });
    expect(textSpy).not.toHaveBeenCalled();
  });

  it('rejects duplicate slug, non-kebab-case, and empty via slug prompt validate', async () => {
    await fs.writeJSON(
      path.join(tempDir, 'registry.json'),
      makeRegistryJson({
        themes: {
          'existing-theme': {
            name: 'Existing',
            files: { css: 'themes/existing/theme.css' },
          },
        },
      })
    );

    // Drive slug prompt then cancel out so we don't have to satisfy the
    // rest of the flow. We just want the validate fn captured.
    textSpy.mockResolvedValueOnce('new-theme');
    isCancelSpy.mockReturnValueOnce(true);

    await registryAddThemeAction({ cwd: tempDir });

    const slugPromptArgs = textSpy.mock.calls[0][0] as {
      validate?: (v: string) => string | undefined;
    };
    expect(slugPromptArgs.validate?.('existing-theme')).toMatch(
      /already exists/
    );
    expect(slugPromptArgs.validate?.('Has-Caps')).toMatch(/kebab-case/);
    expect(slugPromptArgs.validate?.('')).toMatch(/empty/);
    expect(slugPromptArgs.validate?.('new-theme')).toBeUndefined();

    const written = (await fs.readJSON(
      path.join(tempDir, 'registry.json')
    )) as CommunityRegistry;
    expect(Object.keys(written.themes)).toEqual(['existing-theme']);
  });

  it('CSS-file prompt validate enforces .css extension and existence', async () => {
    await fs.writeJSON(path.join(tempDir, 'registry.json'), makeRegistryJson());
    await fs.ensureDir(path.join(tempDir, 'themes/exists'));
    await fs.writeFile(
      path.join(tempDir, 'themes/exists/theme.css'),
      '/* stub */'
    );

    // Drive slug + name prompts to reach the CSS prompt, then cancel.
    textSpy
      .mockResolvedValueOnce('new-theme')
      .mockResolvedValueOnce('New Theme')
      .mockResolvedValueOnce('A description')
      .mockResolvedValueOnce('themes/exists/theme.css');
    // isCancel: false (slug), false (name), false (description), true (css).
    isCancelSpy
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    await registryAddThemeAction({ cwd: tempDir });

    // CSS prompt is the 4th text call (slug, name, description, css).
    const cssPromptArgs = textSpy.mock.calls[3][0] as {
      validate?: (v: string) => string | undefined;
    };
    expect(cssPromptArgs.validate?.('')).toMatch(/required/);
    expect(cssPromptArgs.validate?.('themes/no.txt')).toMatch(/\.css/);
    expect(cssPromptArgs.validate?.('themes/missing.css')).toMatch(/not found/);
    expect(cssPromptArgs.validate?.('themes/exists/theme.css')).toBeUndefined();

    const written = (await fs.readJSON(
      path.join(tempDir, 'registry.json')
    )) as CommunityRegistry;
    expect(written.themes).toEqual({});
  });
});
