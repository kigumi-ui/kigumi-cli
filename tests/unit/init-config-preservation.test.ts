/**
 * Init Config Preservation Tests
 *
 * Verifies that buildConfigNonInteractive and buildConfigInteractive
 * carry over persistent fields (installedComponents, registries,
 * installedThemes) from an existing config during re-init.
 *
 * Cluster S: uses the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) for @clack/prompts and tier.
 * PR-S4: switched tier-restrictions / display-options factory mocks to
 * `vi.spyOn` on namespace imports. BRAND_COLOR_OPTIONS is a `const` array
 * that `vi.spyOn` cannot replace, so the real export is used directly
 * (the test scenarios only assert on `brandColor: 'blue'`, which is in
 * the real list).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tierRestrictions from '../../src/utils/tier-restrictions.js';
import * as displayOptions from '../../src/utils/display-options.js';
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

    vi.spyOn(tierRestrictions, 'getAvailableThemes').mockReturnValue([
      'default',
    ]);
    vi.spyOn(tierRestrictions, 'getAvailablePalettes').mockReturnValue([
      'default',
    ]);
    vi.spyOn(tierRestrictions, 'isThemeAvailable').mockReturnValue(true);

    vi.spyOn(displayOptions, 'getThemeOptionsForTier').mockReturnValue([
      { value: 'default', label: 'Default' },
    ]);
    vi.spyOn(displayOptions, 'getPaletteOptionsForTier').mockReturnValue([
      { value: 'default', label: 'Default' },
    ]);
  });

  afterEach(async () => {
    await clearPromptsSeam();
    vi.restoreAllMocks();
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

    it('should pin webAwesome.version exactly from the version map', async () => {
      const { buildConfigNonInteractive } =
        await import('../../src/commands/init/config-builder.js');
      const { CLI_VERSION } = await import('../../src/constants.js');
      const { getVersionEntry } =
        await import('../../src/utils/version-map.js');

      const { config } = await buildConfigNonInteractive(
        { yes: true },
        defaultProjectInfo,
        '/tmp/test',
        output,
        'free'
      );

      const expected = getVersionEntry(CLI_VERSION)?.webAwesomeVersion;
      expect(expected).toBeDefined();
      // Exact pin: no caret/tilde range carried into the project config.
      expect(config.webAwesome?.version).toBe(expected);
      expect(config.webAwesome?.version).toMatch(/^\d+\.\d+\.\d+$/);
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
