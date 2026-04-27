/**
 * Theme Show Command
 *
 * Displays current theme configuration.
 */

import { Command } from 'commander';
import pc from 'picocolors';
import { loadConfig } from '../../utils/config.js';
import { detectTier, getWebAwesomePackage } from '../../utils/tier.js';
import { ConfigNotFoundError, handleError } from '../../errors/index.js';
import { getOutput } from '../../output/index.js';

export const showCommand = new Command('show')
  .description('Show current theme configuration')
  .action(async () => {
    const cwd = process.cwd();
    const output = getOutput();

    try {
      const config = loadConfig(cwd);

      if (!config) {
        throw new ConfigNotFoundError(cwd);
      }

      const tier = await detectTier(cwd);

      output.intro('Current Theme Configuration');

      output.note(
        'Settings',
        `Theme: ${pc.cyan(config.theme.selected)}\n` +
          `Palette: ${pc.cyan(config.theme.palette)}\n` +
          `Brand Color: ${pc.cyan(config.theme.brandColor)}\n` +
          `Tier: ${pc.cyan(tier)}`
      );

      output.note(
        'HTML Classes',
        `wa-theme-${config.theme.selected}\n` +
          `wa-palette-${config.theme.palette}\n` +
          `wa-brand-${config.theme.brandColor}`
      );

      const packageName = getWebAwesomePackage(tier);

      if (config.theme.selected !== 'none') {
        output.note(
          'Theme Import',
          `${packageName}/dist/styles/themes/${config.theme.selected}.css`
        );
      }

      output.outro(`Run ${pc.cyan('kigumi theme set <name>')} to change theme`);
    } catch (error) {
      handleError(error, output);
    }
  });
