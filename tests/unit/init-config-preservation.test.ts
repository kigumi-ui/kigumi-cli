/**
 * Init Config Preservation Tests
 *
 * Verifies that buildConfigNonInteractive and buildConfigInteractive
 * carry over persistent fields (installedComponents, registries,
 * installedThemes) from an existing config during re-init.
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) instead of module-level
 * mocks for @clack/prompts and src/utils/tier.js. The
 * tier-restrictions and display-options mocks stay since those modules
 * have no DI seam yet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';
import type { KigumiConfig } from '../../src/schemas/config.js';
import type { ProjectInfo } from '../../src/utils/detect-framework.js';

async function registerPromptsSeam(prompts: PromptsAdapter): Promise<void> {
  const promptsMod = await import('../../src/prompts/index.js');
  promptsMod.setPromptsForTesting(prompts);
}

async function clearPromptsSeam(): Promise<void> {
  const promptsMod = await import('../../src/prompts/index.js');
  promptsMod.resetPromptsForTesting();
}

// Mock tier-restrictions: still no DI seam.
vi.mock('../../src/utils/tier-restrictions.js', () => ({
  getAvailableThemes: vi.fn(() => ['default']),
  getAvailablePalettes: vi.fn(() => ['default']),
  isThemeAvailable: vi.fn(() => true),
}));

// Mock display-options: still no DI seam.
vi.mock('../../src/utils/display-options.js', () => ({
  BRAND_COLOR_OPTIONS: [{ value: 'blue', label: 'Blue' }],
  getThemeOptionsForTier: vi.fn(() => [{ value: 'default', label: 'Default' }]),
  getPaletteOptionsForTier: vi.fn(() => [
    { value: 'default', label: 'Default' },
  ]),
}));

const baseExistingConfig: KigumiConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
  installedComponents: {
    button: {
      source: 'community',
      registryVersion: '1.0.0',
      registryUrl: 'https://registry.kigumi.style',
    },
    card: {
      source: 'community',
      registryVersion: '1.0.0',
      registryUrl: 'https://registry.kigumi.style',
    },
  },
  registries: [
    {
      name: 'custom',
      url: 'https://custom-registry.example.com',
    },
  ],
  installedThemes: {
    awesome: { source: 'community', registryVersion: '1.0.0' },
  },
};

const defaultProjectInfo: ProjectInfo = {
  framework: 'react',
  typescript: true,
  packageManager: 'pnpm',
  hasVite: false,
  isNext: false,
  sourceLayout: 'src',
};

describe('config preservation during re-init', () => {
  let output: RecordingOutput;

  beforeEach(async () => {
    output = createRecordingOutput();
    await registerPromptsSeam(createTestPrompts({}));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await clearPromptsSeam();
  });

  describe('buildConfigNonInteractive', () => {
    it('should preserve installedComponents from existing config', async () => {
      const { buildConfigNonInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const { config } = await buildConfigNonInteractive(
        { yes: true },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free',
        baseExistingConfig
      );

      expect(config.installedComponents).toEqual(
        baseExistingConfig.installedComponents
      );
    });

    it('should preserve registries from existing config', async () => {
      const { buildConfigNonInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const { config } = await buildConfigNonInteractive(
        { yes: true },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free',
        baseExistingConfig
      );

      expect(config.registries).toEqual(baseExistingConfig.registries);
    });

    it('should preserve installedThemes from existing config', async () => {
      const { buildConfigNonInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const { config } = await buildConfigNonInteractive(
        { yes: true },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free',
        baseExistingConfig
      );

      expect(config.installedThemes).toEqual(
        baseExistingConfig.installedThemes
      );
    });

    it('should not add phantom fields when no existing config', async () => {
      const { buildConfigNonInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const { config } = await buildConfigNonInteractive(
        { yes: true },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free'
      );

      expect(config.installedComponents).toBeUndefined();
      expect(config.registries).toBeUndefined();
      expect(config.installedThemes).toBeUndefined();
    });

    it('should not add empty arrays from existing config', async () => {
      const { buildConfigNonInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const emptyConfig: KigumiConfig = {
        ...baseExistingConfig,
        installedComponents: {},
        registries: [],
        installedThemes: {},
      };

      const { config } = await buildConfigNonInteractive(
        { yes: true },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free',
        emptyConfig
      );

      expect(config.installedComponents).toBeUndefined();
      expect(config.registries).toBeUndefined();
      expect(config.installedThemes).toBeUndefined();
    });
  });

  describe('buildConfigInteractive', () => {
    beforeEach(async () => {
      // Default prompt responses for interactive mode. Generous queues to
      // cover whichever prompts buildConfigInteractive issues.
      const interactivePrompts = createTestPrompts({
        select: ['react', 'react', 'react', 'react'],
        confirm: [true, true, true, true],
        text: [
          'src/components/ui',
          'src/components/ui',
          'src/components/ui',
          'src/components/ui',
        ],
      });
      await registerPromptsSeam(interactivePrompts);
    });

    it('should preserve installedComponents from existing config', async () => {
      const { buildConfigInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const { config } = await buildConfigInteractive(
        {
          framework: 'react',
          theme: 'default',
          palette: 'default',
          brand: 'blue',
          componentsDir: 'src/components/ui',
          stylesDir: 'src/styles',
        },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free',
        baseExistingConfig
      );

      expect(config.installedComponents).toEqual(
        baseExistingConfig.installedComponents
      );
    });

    it('should preserve registries and installedThemes', async () => {
      const { buildConfigInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const { config } = await buildConfigInteractive(
        {
          framework: 'react',
          theme: 'default',
          palette: 'default',
          brand: 'blue',
          componentsDir: 'src/components/ui',
          stylesDir: 'src/styles',
        },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free',
        baseExistingConfig
      );

      expect(config.registries).toEqual(baseExistingConfig.registries);
      expect(config.installedThemes).toEqual(
        baseExistingConfig.installedThemes
      );
    });

    it('should not add phantom fields without existing config', async () => {
      const { buildConfigInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const { config } = await buildConfigInteractive(
        {
          framework: 'react',
          theme: 'default',
          palette: 'default',
          brand: 'blue',
          componentsDir: 'src/components/ui',
          stylesDir: 'src/styles',
        },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free',
        null
      );

      expect(config.installedComponents).toBeUndefined();
      expect(config.registries).toBeUndefined();
      expect(config.installedThemes).toBeUndefined();
    });
  });
});
