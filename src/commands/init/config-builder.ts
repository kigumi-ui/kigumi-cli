/**
 * Configuration Builder
 *
 * PURPOSE: Builds configuration interactively or from CLI options.
 * Handles Pro token input, theme/palette selection, and framework detection.
 *
 * EXPORTS:
 * - buildConfigNonInteractive() - Build config from CLI options
 * - buildConfigInteractive() - Build config with user prompts
 *
 * @see AGENTS.md for tier system architecture
 */

import * as p from '@clack/prompts';
import type { OutputInterface } from '../../output/types.js';
import type {
  InitOptions,
  KigumiConfig,
  Framework,
} from '../../schemas/index.js';
import type { ProjectInfo } from '../../utils/detect-framework.js';
import type { Tier } from '../../utils/tier.js';
import {
  getAvailableThemes,
  getAvailablePalettes,
  isThemeAvailable,
} from '../../utils/tier-restrictions.js';
import {
  PALETTE_OPTIONS,
  BRAND_COLOR_OPTIONS,
  getThemeOptionsForTier,
} from '../../utils/display-options.js';
import { DEFAULT_CONFIG } from '../../schemas/config.js';
import {
  ProThemeRequiredError,
  UserCancelledError,
} from '../../errors/index.js';

// =============================================================================
// Layout-Adaptive Defaults
// =============================================================================

/**
 * Directory + alias defaults for a given source layout.
 *
 * Projects that keep code under `src/` (Vite, Next `--src-dir`) get the
 * `src/components/ui` / `src/lib` / `src/styles` layout. Projects with code
 * at the repo root (Next without `--src-dir`, following the `app/` + root
 * `components/` convention) get the parallel `components/ui` / `lib` /
 * `styles` layout.
 *
 * Matching the layout here lets the user's existing `@/*` tsconfig paths
 * resolve Kigumi imports without rewriting their tsconfig.
 *
 * @internal
 */
function getLayoutDefaults(projectInfo: ProjectInfo): {
  componentsDir: string;
  utilsDir: string;
  stylesDir: string;
  aliases: Record<string, string>;
} {
  if (projectInfo.sourceLayout === 'src') {
    return {
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      aliases: {
        '@/components': './src/components',
        '@/lib': './src/lib',
        '@/styles': './src/styles',
      },
    };
  }
  return {
    componentsDir: 'components/ui',
    utilsDir: 'lib',
    stylesDir: 'styles',
    aliases: {
      '@/components': './components',
      '@/lib': './lib',
      '@/styles': './styles',
    },
  };
}

// =============================================================================
// Type Guards for @clack/prompts Results
// =============================================================================

/**
 * Type guard to safely extract string value from prompt result.
 * Throws UserCancelledError if cancelled.
 * @internal
 */
function ensureString(value: unknown): string {
  if (p.isCancel(value)) {
    throw new UserCancelledError();
  }
  if (typeof value !== 'string') {
    throw new Error(`Expected string, got ${typeof value}`);
  }
  return value;
}

/**
 * Type guard to safely extract boolean value from prompt result.
 * Throws UserCancelledError if cancelled.
 * @internal
 */
function ensureBoolean(value: unknown): boolean {
  if (p.isCancel(value)) {
    throw new UserCancelledError();
  }
  if (typeof value !== 'boolean') {
    throw new Error(`Expected boolean, got ${typeof value}`);
  }
  return value;
}

/**
 * Build configuration non-interactively from options
 * NOTE: Tier is now detected from .env, not stored in config
 */
/**
 * Copy persistent fields from existing config to new config.
 * These fields are managed by other commands (add, theme) and must survive re-init.
 */
function preservePersistentFields(
  config: KigumiConfig,
  existingConfig?: KigumiConfig | null
): void {
  if (!existingConfig) return;

  if (
    existingConfig.installedComponents &&
    Object.keys(existingConfig.installedComponents).length > 0
  ) {
    config.installedComponents = existingConfig.installedComponents;
  }
  if (existingConfig.registries?.length) {
    config.registries = existingConfig.registries;
  }
  if (
    existingConfig.installedThemes &&
    Object.keys(existingConfig.installedThemes).length > 0
  ) {
    config.installedThemes = existingConfig.installedThemes;
  }
}

export async function buildConfigNonInteractive(
  options: InitOptions,
  projectInfo: ProjectInfo,
  cwd: string,
  output: OutputInterface,
  initialTier: Tier,
  existingConfig?: KigumiConfig | null
): Promise<{ config: KigumiConfig; proToken?: string }> {
  // Framework selection
  const SUPPORTED_FRAMEWORKS: Framework[] = ['react', 'vue', 'angular'];
  let framework: Framework;

  if (options.framework && SUPPORTED_FRAMEWORKS.includes(options.framework)) {
    framework = options.framework;
  } else if (options.framework) {
    output.warning(
      `Framework "${options.framework}" is not yet supported. Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`
    );
    framework = SUPPORTED_FRAMEWORKS.includes(
      projectInfo.framework as Framework
    )
      ? (projectInfo.framework as Framework)
      : 'react';
  } else {
    // Auto-detect, default to react
    framework = SUPPORTED_FRAMEWORKS.includes(
      projectInfo.framework as Framework
    )
      ? (projectInfo.framework as Framework)
      : 'react';
  }

  // Angular is TypeScript-only
  const typescript =
    framework === 'angular'
      ? true
      : (options.typescript ?? projectInfo.typescript);

  // Token provided via CLI flag (will be written to .env later)
  const proToken = options.token;

  // Determine tier: Pro if token provided, otherwise use the initial tier
  // detected by the caller at the command entry.
  const tier = proToken ? 'pro' : initialTier;

  const theme = options.theme || 'default';
  const palette = options.palette || 'default';
  const brandColor = options.brand || options.brandColor || 'blue';

  // Phase 4: Validate theme is available for current tier
  if (!isThemeAvailable(theme, tier)) {
    const freeThemes = getAvailableThemes('free');
    throw new ProThemeRequiredError(theme, freeThemes);
  }

  output.info(`Framework: ${framework}`);
  output.info(`TypeScript: ${typescript}`);
  output.info(`Tier: ${tier}`);
  output.info(`Theme: ${theme}`);
  output.info(`Palette: ${palette}`);
  output.info(`Brand Color: ${brandColor}`);

  const layoutDefaults = getLayoutDefaults(projectInfo);

  const config: KigumiConfig = {
    framework,
    typescript,
    componentsDir: options.componentsDir || layoutDefaults.componentsDir,
    utilsDir: options.utilsDir || layoutDefaults.utilsDir,
    stylesDir: options.stylesDir || layoutDefaults.stylesDir,
    theme: {
      selected: theme,
      palette,
      brandColor,
    },
    aliases: layoutDefaults.aliases,
    webAwesome: {
      version: DEFAULT_CONFIG.webAwesome?.version,
    },
  };

  preservePersistentFields(config, existingConfig);

  return { config, proToken };
}

/**
 * Build configuration interactively with prompts
 * NOTE: Tier is now detected from .env, not stored in config
 *
 * @param options - CLI options passed to init command
 * @param projectInfo - Detected project information (framework, typescript)
 * @param cwd - Current working directory
 * @param output - Output interface for logging
 * @param existingConfig - Existing kigumi.config.json (if present) for pre-populating values
 */
export async function buildConfigInteractive(
  options: InitOptions,
  projectInfo: ProjectInfo,
  cwd: string,
  output: OutputInterface,
  initialTier: Tier,
  existingConfig?: KigumiConfig | null
): Promise<{ config: KigumiConfig; proToken?: string }> {
  output.info("Let's configure your project");

  // Tier as resolved at the command entry — used to decide whether to
  // offer the Pro-token prompt and which theme/palette set to show.
  const detectedTier = initialTier;

  // Framework selection
  const SUPPORTED_FRAMEWORKS: Framework[] = ['react', 'vue', 'angular'];
  const detectedFramework = SUPPORTED_FRAMEWORKS.includes(
    projectInfo.framework as Framework
  )
    ? (projectInfo.framework as Framework)
    : 'react';

  const frameworkResult =
    options.framework ||
    (await p.select({
      message: 'Select framework',
      options: [
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue 3' },
        { value: 'angular', label: 'Angular 17+' },
      ],
      initialValue: existingConfig?.framework || detectedFramework,
    }));
  const framework = ensureString(frameworkResult) as Framework;

  // TypeScript (Angular is always TypeScript)
  let typescript: boolean;
  if (framework === 'angular') {
    typescript = true;
  } else {
    const getInitialTypescript = (): boolean => {
      if (existingConfig?.typescript !== undefined)
        return existingConfig.typescript;
      return projectInfo.typescript;
    };

    const typescriptResult =
      options.typescript ??
      (await p.confirm({
        message: 'Use TypeScript?',
        initialValue: getInitialTypescript(),
      }));
    typescript = ensureBoolean(typescriptResult);
  }

  // Pro Token (optional - if provided, enables Pro tier)
  let proToken = options.token;

  if (!proToken && detectedTier === 'free') {
    // Offer to enter Pro token
    const wantsProResult = await p.confirm({
      message:
        'Do you have a Web Awesome Pro token? (Unlock premium themes and components)',
      initialValue: false,
    });
    const wantsPro = ensureBoolean(wantsProResult);

    if (wantsPro) {
      const tokenResult = await p.text({
        message:
          'Enter your Web Awesome Pro token (Get one at https://webawesome.com/pro)',
        placeholder: 'Your pro token here',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Token is required for Pro tier';
          }
          if (value.trim().length < 10) {
            return 'Token seems too short. Get your token from https://webawesome.com/pro';
          }
          return undefined;
        },
      });
      proToken = ensureString(tokenResult);
    }
  }

  // Determine final tier based on token
  const finalTier = proToken ? 'pro' : detectedTier;

  // Theme - use existing value if available and valid for current tier
  const availableThemes = getAvailableThemes(finalTier);
  const themeOptions = getThemeOptionsForTier(finalTier);
  const getInitialTheme = (): string => {
    if (
      existingConfig?.theme?.selected &&
      availableThemes.includes(existingConfig.theme.selected)
    ) {
      return existingConfig.theme.selected;
    }
    return 'default';
  };

  const themeResult =
    options.theme ||
    (await p.select({
      message:
        'Select theme (Preview themes at https://webawesome.com/docs/themes)',
      options: themeOptions,
      initialValue: getInitialTheme(),
    }));
  const theme = ensureString(themeResult);

  // Palette - use existing value if available and valid for current tier
  const availablePalettes = getAvailablePalettes(finalTier);
  const paletteOptions = PALETTE_OPTIONS.filter((o) =>
    availablePalettes.includes(o.value)
  );
  const getInitialPalette = (): string => {
    if (
      existingConfig?.theme?.palette &&
      availablePalettes.includes(existingConfig.theme.palette)
    ) {
      return existingConfig.theme.palette;
    }
    return 'default';
  };

  const paletteResult =
    options.palette ||
    (await p.select({
      message:
        'Select color palette (Preview palettes at https://webawesome.com/docs/color-palettes)',
      options: paletteOptions,
      initialValue: getInitialPalette(),
    }));
  const palette = ensureString(paletteResult);

  // Brand color - all Web Awesome color options
  // https://webawesome.com/docs/tokens/color
  const brandColorValues: string[] = BRAND_COLOR_OPTIONS.map((o) => o.value);
  const getInitialBrandColor = (): string => {
    if (
      existingConfig?.theme?.brandColor &&
      brandColorValues.includes(existingConfig.theme.brandColor)
    ) {
      return existingConfig.theme.brandColor;
    }
    return 'blue';
  };

  const brandColorResult =
    options.brand ||
    options.brandColor ||
    (await p.select({
      message: 'Select brand color (Primary color for interactive elements)',
      options: BRAND_COLOR_OPTIONS.map(({ value, label }) => ({
        value,
        label,
      })),
      initialValue: getInitialBrandColor(),
    }));
  const brandColor = ensureString(brandColorResult);

  const layoutDefaults = getLayoutDefaults(projectInfo);

  // Components directory - use existing value if available
  const getInitialComponentsDir = (): string => {
    if (existingConfig?.componentsDir) return existingConfig.componentsDir;
    return layoutDefaults.componentsDir;
  };

  const componentsDirResult =
    options.componentsDir ||
    (await p.text({
      message: 'Where should components be generated?',
      placeholder: layoutDefaults.componentsDir,
      initialValue: getInitialComponentsDir(),
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Components directory cannot be empty';
        }
        return undefined;
      },
    }));
  const componentsDir = ensureString(componentsDirResult);

  // Styles directory - use existing value if available
  const getInitialStylesDir = (): string => {
    if (existingConfig?.stylesDir) return existingConfig.stylesDir;
    return layoutDefaults.stylesDir;
  };

  const stylesDirResult =
    options.stylesDir ||
    (await p.text({
      message: 'Where should theme.css be generated?',
      placeholder: layoutDefaults.stylesDir,
      initialValue: getInitialStylesDir(),
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Styles directory cannot be empty';
        }
        return undefined;
      },
    }));
  const stylesDir = ensureString(stylesDirResult);

  const config: KigumiConfig = {
    framework,
    typescript,
    componentsDir,
    utilsDir: options.utilsDir || layoutDefaults.utilsDir,
    stylesDir,
    theme: {
      selected: theme,
      palette,
      brandColor,
    },
    aliases: layoutDefaults.aliases,
    webAwesome: {
      version: DEFAULT_CONFIG.webAwesome?.version,
    },
  };

  preservePersistentFields(config, existingConfig);

  return { config, proToken };
}
