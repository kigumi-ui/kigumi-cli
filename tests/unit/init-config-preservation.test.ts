/**
 * Init Config Preservation Tests
 *
 * Verifies that buildConfigNonInteractive and buildConfigInteractive
 * carry over persistent fields (installedComponents, registries,
 * installedThemes) from an existing config during re-init.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';
import type { KigumiConfig } from '../../src/schemas/config.js';
import type { ProjectInfo } from '../../src/utils/detect-framework.js';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  select: vi.fn(),
  confirm: vi.fn(),
  text: vi.fn(),
  isCancel: vi.fn(() => false),
}));

// Mock tier utilities
vi.mock('../../src/utils/tier.js', () => ({
  detectTierSync: vi.fn(() => 'free'),
  detectTier: vi.fn(() => Promise.resolve('free')),
}));

// Mock tier-restrictions
vi.mock('../../src/utils/tier-restrictions.js', () => ({
  getAvailableThemes: vi.fn(() => ['default']),
  getAvailablePalettes: vi.fn(() => ['default']),
  isThemeAvailable: vi.fn(() => true),
}));

// Mock display-options
vi.mock('../../src/utils/display-options.js', () => ({
  BRAND_COLOR_OPTIONS: [{ value: 'blue', label: 'Blue' }],
  getThemeOptionsForTier: vi.fn(() => [{ value: 'default', label: 'Default' }]),
  getPaletteOptionsForTier: vi.fn(() => [
    { value: 'default', label: 'Default' },
  ]),
}));

function createMockOutput(): OutputInterface {
  const spinnerMock: OutputSpinner = {
    start: vi.fn(),
    message: vi.fn(),
    stop: vi.fn(),
    error: vi.fn(),
  };

  return {
    intro: vi.fn(),
    outro: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    note: vi.fn(),
    spinner: vi.fn(() => spinnerMock),
    log: vi.fn(),
  };
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
  let mockOutput: OutputInterface;

  beforeEach(() => {
    mockOutput = createMockOutput();
    vi.clearAllMocks();
  });

  describe('buildConfigNonInteractive', () => {
    it('should preserve installedComponents from existing config', async () => {
      const { buildConfigNonInteractive } =
        await import('../../src/commands/init/config-builder.js');

      const { config } = await buildConfigNonInteractive(
        { yes: true },
        defaultProjectInfo,
        '/tmp/test',
        mockOutput,
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
        mockOutput,
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
        mockOutput,
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
        mockOutput,
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
        mockOutput,
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
      const clackModule = await import('@clack/prompts');
      // Default prompt responses for interactive mode
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'react'
      );
      (clackModule.confirm as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (clackModule.text as ReturnType<typeof vi.fn>).mockResolvedValue(
        'src/components/ui'
      );
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
        mockOutput,
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
        mockOutput,
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
        mockOutput,
        'free',
        null
      );

      expect(config.installedComponents).toBeUndefined();
      expect(config.registries).toBeUndefined();
      expect(config.installedThemes).toBeUndefined();
    });
  });
});
