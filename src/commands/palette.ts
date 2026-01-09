/**
 * Palette Command
 *
 * Changes the color palette
 */

import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import { CheckRunner, ConfigExistsCheck, ConfigValidCheck } from '../checks/index.js';
import { handleError, UserCancelledError } from '../errors/index.js';
import { ValidationError } from '../errors/validation.js';
import { loadConfig, saveConfig, getConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';
import { getAvailablePalettes } from '../utils/tier-restrictions.js';

async function paletteAction(paletteName?: string) {
  const output = getOutput();
  output.intro('kigumi palette');

  const cwd = process.cwd();

  try {
    // 1. Load configuration (needed for checks)
    let config: any;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch (error) {
      // Config loading failed - will be caught by checks
    }

    // 2. Pre-flight checks
    const checker = new CheckRunner()
      .add(new ConfigExistsCheck())
      .add(new ConfigValidCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      output.error('Pre-flight checks failed');
      output.note('Issues found', checker.formatResults(checkResults));
      process.exit(1);
    }

    // 3. Config is valid at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    const tier = config.webAwesome?.tier || 'free';
    let selectedPalette = paletteName;

    // 3. Interactive selection if no palette provided
    if (!selectedPalette) {
      const availablePalettes = getAvailablePalettes(tier);

      const options = availablePalettes
        .filter((pal) => pal !== 'custom')
        .map((palette) => ({
          value: palette,
          label: palette.charAt(0).toUpperCase() + palette.slice(1),
          hint: palette === config.theme.palette ? 'Current' : '',
        }));

      const selected = await p.select({
        message: 'Select a color palette:',
        options,
        initialValue: config.theme.palette,
      });

      if (p.isCancel(selected)) {
        throw new UserCancelledError();
      }

      selectedPalette = selected as string;
    }

    // 4. Validate palette (all palettes available to all tiers)
    const availablePalettes = getAvailablePalettes(tier).filter((p) => p !== 'custom');
    if (!availablePalettes.includes(selectedPalette)) {
      throw new ValidationError('palette', selectedPalette, availablePalettes);
    }

    // 5. Update palette
    const spinner = output.spinner('Updating palette...');

    config.theme.palette = selectedPalette;
    await saveConfig(config, cwd);

    const utilsDir = config.utilsDir || 'src/lib';
    await regenerateWebAwesomeSetup(cwd, config, utilsDir);

    spinner.stop('Palette updated');

    output.outro(
      `${pc.green('✓')} Palette set to ${pc.cyan(selectedPalette)}\n` +
        pc.dim('Reload your browser to see changes')
    );
  } catch (error) {
    handleError(error, output);
  }
}

export const paletteCommand = new Command('palette')
  .description('Change the color palette')
  .argument('[name]', 'Palette name (omit to see options)')
  .action(paletteAction);
