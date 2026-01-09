/**
 * Configuration Builder
 *
 * Builds configuration interactively or from options
 */

import * as p from '@clack/prompts';
import type { OutputInterface } from '../../output/types.js';
import type { InitOptions, KigumiConfig } from '../../schemas/index.js';
import type { ProjectInfo } from '../../utils/detect-framework.js';
import { getAvailableThemes, getAvailablePalettes } from '../../utils/tier-restrictions.js';
import { DEFAULT_CONFIG } from '../../schemas/config.js';

/**
 * Build configuration non-interactively from options
 */
export async function buildConfigNonInteractive(
  options: InitOptions,
  projectInfo: ProjectInfo,
  output: OutputInterface
): Promise<KigumiConfig> {
  const framework = options.framework || projectInfo.framework;
  const typescript = options.typescript ?? projectInfo.typescript;
  const tier = options.tier || 'free';
  const theme = options.theme || 'default';
  const palette = options.palette || 'default';
  // Accept both --brand and --brandColor (--brand is preferred)
  const brandColor = options.brand || options.brandColor || 'blue';
  const token = options.token;

  output.info(`Framework: ${framework}`);
  output.info(`TypeScript: ${typescript}`);
  output.info(`Tier: ${tier}`);
  output.info(`Theme: ${theme}`);
  output.info(`Palette: ${palette}`);
  output.info(`Brand Color: ${brandColor}`);

  return {
    framework: framework as any,
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
      tier: tier as 'free' | 'pro',
      version: DEFAULT_CONFIG.webAwesome?.version,
      token, // Include token if provided
    },
  };
}

/**
 * Build configuration interactively with prompts
 */
export async function buildConfigInteractive(
  options: InitOptions,
  projectInfo: ProjectInfo,
  output: OutputInterface
): Promise<KigumiConfig> {
  output.info('Let\'s configure your project');

  // Framework
  const framework = options.framework || await p.select({
    message: 'Which framework are you using?',
    options: [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue' },
      { value: 'svelte', label: 'Svelte' },
      { value: 'angular', label: 'Angular' },
    ],
    initialValue: projectInfo.framework !== 'unknown' ? projectInfo.framework : 'react',
  });

  if (p.isCancel(framework)) {
    process.exit(0);
  }

  // TypeScript
  const typescript = options.typescript ?? await p.confirm({
    message: 'Use TypeScript?',
    initialValue: projectInfo.typescript,
  });

  if (p.isCancel(typescript)) {
    process.exit(0);
  }

  // Tier
  const tier = options.tier || await p.select({
    message: 'Which tier?',
    options: [
      { value: 'free', label: 'Free', hint: '3 themes, all components' },
      { value: 'pro', label: 'Pro', hint: '11 themes, all features' },
    ],
    initialValue: 'free',
  });

  if (p.isCancel(tier)) {
    process.exit(0);
  }

  // Theme
  const availableThemes = getAvailableThemes(tier as 'free' | 'pro');
  const theme = options.theme || await p.select({
    message: 'Select theme',
    options: availableThemes.map((t) => ({ value: t, label: t })),
    initialValue: 'default',
  });

  if (p.isCancel(theme)) {
    process.exit(0);
  }

  // Palette
  const availablePalettes = getAvailablePalettes();
  const palette = options.palette || await p.select({
    message: 'Select palette',
    options: availablePalettes.map((p) => ({ value: p, label: p })),
    initialValue: 'default',
  });

  if (p.isCancel(palette)) {
    process.exit(0);
  }

  // Brand color (accept both --brand and --brandColor)
  const brandColor = options.brand || options.brandColor || await p.select({
    message: 'Select brand color',
    options: [
      { value: 'blue', label: 'Blue' },
      { value: 'purple', label: 'Purple' },
      { value: 'green', label: 'Green' },
      { value: 'red', label: 'Red' },
      { value: 'orange', label: 'Orange' },
    ],
    initialValue: 'blue',
  });

  if (p.isCancel(brandColor)) {
    process.exit(0);
  }

  // Token (for Pro tier)
  const token = options.token;

  return {
    framework: framework as any,
    typescript: typescript as boolean,
    componentsDir: options.componentsDir || DEFAULT_CONFIG.componentsDir,
    utilsDir: options.utilsDir || DEFAULT_CONFIG.utilsDir,
    theme: {
      selected: theme as string,
      palette: palette as string,
      brandColor: brandColor as string,
    },
    aliases: DEFAULT_CONFIG.aliases,
    webAwesome: {
      tier: tier as 'free' | 'pro',
      version: DEFAULT_CONFIG.webAwesome?.version,
      token, // Include token if provided
    },
  };
}
