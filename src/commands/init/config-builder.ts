/**
 * Configuration Builder
 *
 * Builds configuration interactively or from options
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
} from '../../utils/tier-restrictions.js';
import { DEFAULT_CONFIG } from '../../schemas/config.js';

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
  const framework = options.framework || projectInfo.framework;
  const typescript = options.typescript ?? projectInfo.typescript;

  // Token provided via CLI flag (will be written to .env later)
  const proToken = options.token;

  // Determine tier: Pro if token provided, otherwise detect from .env
  const tier = proToken ? 'pro' : detectTierSync(cwd);

  const theme = options.theme || 'default';
  const palette = options.palette || 'default';
  const brandColor = options.brand || options.brandColor || 'blue';

  output.info(`Framework: ${framework}`);
  output.info(`TypeScript: ${typescript}`);
  output.info(`Tier: ${tier}`);
  output.info(`Theme: ${theme}`);
  output.info(`Palette: ${palette}`);
  output.info(`Brand Color: ${brandColor}`);

  const config: KigumiConfig = {
    framework: framework as Framework,
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
  const framework =
    options.framework ||
    (await p.select({
      message: 'Which framework are you using?',
      options: [
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
        { value: 'svelte', label: 'Svelte' },
        { value: 'angular', label: 'Angular' },
      ],
      initialValue:
        projectInfo.framework !== 'unknown' ? projectInfo.framework : 'react',
    }));

  if (p.isCancel(framework)) {
    process.exit(0);
  }

  // TypeScript
  const typescript =
    options.typescript ??
    (await p.confirm({
      message: 'Use TypeScript?',
      initialValue: projectInfo.typescript,
    }));

  if (p.isCancel(typescript)) {
    process.exit(0);
  }

  // Pro Token (optional - if provided, enables Pro tier)
  let proToken = options.token;

  if (!proToken && detectedTier === 'free') {
    // Offer to enter Pro token
    const wantsPro = await p.confirm({
      message: 'Do you have a Web Awesome Pro token?',
      initialValue: false,
    });

    if (p.isCancel(wantsPro)) {
      process.exit(0);
    }

    if (wantsPro) {
      proToken = (await p.text({
        message: 'Enter your Web Awesome Pro token',
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
      })) as string;

      if (p.isCancel(proToken)) {
        process.exit(0);
      }
    }
  }

  // Determine final tier based on token
  const finalTier = proToken ? 'pro' : detectedTier;

  // Theme
  const availableThemes = getAvailableThemes(finalTier);
  const theme =
    options.theme ||
    (await p.select({
      message: 'Select theme',
      options: availableThemes.map((t) => ({ value: t, label: t })),
      initialValue: 'default',
    }));

  if (p.isCancel(theme)) {
    process.exit(0);
  }

  // Palette
  const availablePalettes = getAvailablePalettes(finalTier);
  const palette =
    options.palette ||
    (await p.select({
      message: 'Select palette',
      options: availablePalettes.map((p) => ({ value: p, label: p })),
      initialValue: 'default',
    }));

  if (p.isCancel(palette)) {
    process.exit(0);
  }

  // Brand color
  const brandColor =
    options.brand ||
    options.brandColor ||
    (await p.select({
      message: 'Select brand color',
      options: [
        { value: 'blue', label: 'Blue' },
        { value: 'purple', label: 'Purple' },
        { value: 'green', label: 'Green' },
        { value: 'red', label: 'Red' },
        { value: 'orange', label: 'Orange' },
      ],
      initialValue: 'blue',
    }));

  if (p.isCancel(brandColor)) {
    process.exit(0);
  }

  const config: KigumiConfig = {
    framework: framework as Framework,
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
      version: DEFAULT_CONFIG.webAwesome?.version,
    },
  };

  return { config, proToken };
}
