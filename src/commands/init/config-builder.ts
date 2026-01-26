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
import { detectTierSync } from '../../utils/tier.js';
import {
  getAvailableThemes,
  getAvailablePalettes,
  isThemeAvailable,
} from '../../utils/tier-restrictions.js';
import { DEFAULT_CONFIG, FRAMEWORKS } from '../../schemas/config.js';
import {
  ProThemeRequiredError,
  UserCancelledError,
} from '../../errors/index.js';

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
 * Type guard to validate framework value.
 * @internal
 */
function isValidFramework(value: string): value is Framework {
  return FRAMEWORKS.includes(value as Framework);
}

/**
 * Build configuration non-interactively from options
 * NOTE: Tier is now detected from .env, not stored in config
 */
export async function buildConfigNonInteractive(
  options: InitOptions,
  projectInfo: ProjectInfo,
  cwd: string,
  output: OutputInterface
): Promise<{ config: KigumiConfig; proToken?: string }> {
  // Framework: validate against allowed values
  const frameworkStr = options.framework || projectInfo.framework;
  if (!isValidFramework(frameworkStr)) {
    throw new Error(
      `Invalid framework: ${frameworkStr}. Must be one of: ${FRAMEWORKS.join(', ')}`
    );
  }
  const framework: Framework = frameworkStr;

  const typescript = options.typescript ?? projectInfo.typescript;

  // Token provided via CLI flag (will be written to .env later)
  const proToken = options.token;

  // Determine tier: Pro if token provided, otherwise detect from .env
  const tier = proToken ? 'pro' : detectTierSync(cwd);

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

  const config: KigumiConfig = {
    framework,
    typescript,
    componentsDir: options.componentsDir || DEFAULT_CONFIG.componentsDir,
    utilsDir: options.utilsDir || DEFAULT_CONFIG.utilsDir,
    theme: {
      selected: theme,
      palette,
      brandColor,
    },
    aliases: DEFAULT_CONFIG.aliases,
    webAwesome: {
      version: DEFAULT_CONFIG.webAwesome?.version,
    },
  };

  return { config, proToken };
}

/**
 * Build configuration interactively with prompts
 * NOTE: Tier is now detected from .env, not stored in config
 */
export async function buildConfigInteractive(
  options: InitOptions,
  projectInfo: ProjectInfo,
  cwd: string,
  output: OutputInterface
): Promise<{ config: KigumiConfig; proToken?: string }> {
  output.info("Let's configure your project");

  // Detect tier from .env
  const detectedTier = detectTierSync(cwd);

  // Framework
  const frameworkResult = options.framework
    ? options.framework
    : await p.select({
        message: 'Which framework are you using?',
        options: [
          { value: 'react', label: 'React' },
          { value: 'vue', label: 'Vue' },
          { value: 'svelte', label: 'Svelte' },
          { value: 'angular', label: 'Angular' },
        ],
        initialValue:
          projectInfo.framework !== 'unknown' ? projectInfo.framework : 'react',
      });
  const frameworkStr = ensureString(frameworkResult);
  if (!isValidFramework(frameworkStr)) {
    throw new Error(`Invalid framework: ${frameworkStr}`);
  }
  const framework: Framework = frameworkStr;

  // TypeScript
  const typescriptResult =
    options.typescript ??
    (await p.confirm({
      message: 'Use TypeScript?',
      initialValue: projectInfo.typescript,
    }));
  const typescript = ensureBoolean(typescriptResult);

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

  // Theme
  const availableThemes = getAvailableThemes(finalTier);
  const themeResult =
    options.theme ||
    (await p.select({
      message:
        'Select theme (Preview themes at https://webawesome.com/docs/themes)',
      options: availableThemes.map((t) => ({ value: t, label: t })),
      initialValue: 'default',
    }));
  const theme = ensureString(themeResult);

  // Palette
  const availablePalettes = getAvailablePalettes(finalTier);
  const paletteResult =
    options.palette ||
    (await p.select({
      message:
        'Select color palette (Preview palettes at https://webawesome.com/docs/color-palettes)',
      options: availablePalettes.map((pal) => ({ value: pal, label: pal })),
      initialValue: 'default',
    }));
  const palette = ensureString(paletteResult);

  // Brand color
  const brandColorResult =
    options.brand ||
    options.brandColor ||
    (await p.select({
      message: 'Select brand color (Primary color for interactive elements)',
      options: [
        { value: 'blue', label: 'Blue' },
        { value: 'purple', label: 'Purple' },
        { value: 'green', label: 'Green' },
        { value: 'red', label: 'Red' },
        { value: 'orange', label: 'Orange' },
      ],
      initialValue: 'blue',
    }));
  const brandColor = ensureString(brandColorResult);

  const config: KigumiConfig = {
    framework,
    typescript,
    componentsDir: options.componentsDir || DEFAULT_CONFIG.componentsDir,
    utilsDir: options.utilsDir || DEFAULT_CONFIG.utilsDir,
    theme: {
      selected: theme,
      palette,
      brandColor,
    },
    aliases: DEFAULT_CONFIG.aliases,
    webAwesome: {
      version: DEFAULT_CONFIG.webAwesome?.version,
    },
  };

  return { config, proToken };
}
