/**
 * Tests for the remote (community-registry) component selector helpers.
 *
 * Targets:
 * - `getAvailableRemoteComponents` (exported pure filter): sort + framework filter.
 * - `selectRemoteComponents` (interactive entry): pass-through, empty-framework
 *   error, and cancel path.
 *
 * No fs.
 *
 * Cluster S, F-126: rewritten to use vi.spyOn on the prompts wrapper
 * module instead of a module-level mock for @clack/prompts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as p from '../../src/prompts/index.js';
import {
  getAvailableRemoteComponents,
  selectRemoteComponents,
} from '../../src/commands/add/remote-component-selector.js';
import type { CommunityRegistry } from '../../src/schemas/community-registry.js';
import type { OutputInterface } from '../../src/output/types.js';

const stubOutput: OutputInterface = {
  intro: vi.fn(),
  outro: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  spinner: vi.fn(),
  cancel: vi.fn(),
  log: vi.fn(),
  note: vi.fn(),
  message: vi.fn(),
  raw: vi.fn(),
} as unknown as OutputInterface;

function makeRegistry(
  components: CommunityRegistry['components']
): CommunityRegistry {
  return {
    $schema: 'https://kigumi.style/community-registry-schema.json',
    name: 'test-registry',
    version: '0.1.0',
    frameworks: ['react', 'vue'],
    components,
    themes: {},
  };
}

describe('getAvailableRemoteComponents', () => {
  it('filters to components that declare a file for the framework', () => {
    const registry = makeRegistry({
      'wa-button': {
        name: 'Button',
        dependencies: [],
        files: { react: { component: 'Button.tsx', extras: [] } },
      },
      'wa-card': {
        name: 'Card',
        dependencies: [],
        files: { vue: { component: 'Card.vue', extras: [] } },
      },
      'wa-input': {
        name: 'Input',
        dependencies: [],
        files: {
          react: { component: 'Input.tsx', extras: [] },
          vue: { component: 'Input.vue', extras: [] },
        },
      },
    });

    expect(getAvailableRemoteComponents(registry, 'react')).toEqual([
      'wa-button',
      'wa-input',
    ]);
    expect(getAvailableRemoteComponents(registry, 'vue')).toEqual([
      'wa-card',
      'wa-input',
    ]);
  });

  it('returns an empty array when registry.components is empty', () => {
    const registry = makeRegistry({});
    expect(getAvailableRemoteComponents(registry, 'react')).toEqual([]);
  });

  it('returns keys sorted alphabetically', () => {
    const registry = makeRegistry({
      zeta: {
        name: 'Zeta',
        dependencies: [],
        files: { react: { component: 'Z.tsx', extras: [] } },
      },
      alpha: {
        name: 'Alpha',
        dependencies: [],
        files: { react: { component: 'A.tsx', extras: [] } },
      },
      mu: {
        name: 'Mu',
        dependencies: [],
        files: { react: { component: 'M.tsx', extras: [] } },
      },
    });

    expect(getAvailableRemoteComponents(registry, 'react')).toEqual([
      'alpha',
      'mu',
      'zeta',
    ]);
  });
});

describe('selectRemoteComponents', () => {
  let multiselectSpy: ReturnType<typeof vi.spyOn>;
  let isCancelSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    multiselectSpy = vi.spyOn(p, 'multiselect');
    isCancelSpy = vi.spyOn(p, 'isCancel').mockReturnValue(false);
  });

  afterEach(() => {
    multiselectSpy.mockRestore();
    isCancelSpy.mockRestore();
  });

  it('passes through directly provided component names without prompting', async () => {
    const registry = makeRegistry({
      'wa-button': {
        name: 'Button',
        dependencies: [],
        files: { react: { component: 'Button.tsx', extras: [] } },
      },
    });

    const result = await selectRemoteComponents(
      ['wa-button'],
      registry,
      'react',
      stubOutput
    );

    expect(result).toEqual(['wa-button']);
    expect(multiselectSpy).not.toHaveBeenCalled();
  });

  it('throws when no components support the user framework', async () => {
    const registry = makeRegistry({
      'wa-card': {
        name: 'Card',
        dependencies: [],
        files: { vue: { component: 'Card.vue', extras: [] } },
      },
    });

    await expect(
      selectRemoteComponents([], registry, 'react', stubOutput)
    ).rejects.toThrow(/No components available/);
  });

  it('throws "Operation cancelled" when the user cancels the multiselect', async () => {
    const registry = makeRegistry({
      'wa-button': {
        name: 'Button',
        dependencies: [],
        files: { react: { component: 'Button.tsx', extras: [] } },
      },
    });

    multiselectSpy.mockResolvedValueOnce(Symbol('cancel') as never);
    isCancelSpy.mockReturnValueOnce(true);

    await expect(
      selectRemoteComponents([], registry, 'react', stubOutput)
    ).rejects.toThrow(/Operation cancelled/);
  });
});
