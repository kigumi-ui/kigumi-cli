/**
 * Palette Command
 *
 * PURPOSE: Changes the color palette for the project.
 *
 * @public
 */

import type { KigumiConfig } from '../schemas/config.js';

import { Command } from 'commander';
import * as p from '../prompts/index.js';
import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import { CheckRunner, ConfigExistsCheck } from '../checks/index.js';
import {
  handleError,
  UserCancelledError,
  PreFlightCheckError,
  ConfigNotFoundError,
} from '../errors/index.js';
import { ValidationError } from '../errors/validation.js';
import { saveConfig, getConfig } from '../utils/config.js';
import { regenerateKigumiSetup } from '../utils/regenerate.js';
import { detectTier } from '../utils/tier.js';
import { getAvailablePalettes } from '../utils/tier-restrictions.js';

async function paletteAction(paletteName?: string) {
  const output = getOutput();
  const cwd = process.cwd();

  try {
    // 1. Load configuration (needed for checks).
    // getConfig() internally calls loadConfig() and deep-merges with defaults,
    // so a single call is sufficient. ConfigNotFoundError is swallowed because
    // ConfigExistsCheck below shows a friendlier "run kigumi init" message;
    // ConfigInvalidError must surface so users see schema issues directly.
    let config: KigumiConfig | undefined;
    try {
      config = getConfig(cwd);
    } catch (err) {
      if (!(err instanceof ConfigNotFoundError)) throw err;
    }

    // 2. Pre-flight checks
    const checker = new CheckRunner().add(new ConfigExistsCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      throw new PreFlightCheckError(checkResults);
    }

    // Config must be loaded at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    // Detect tier from .env
    const tier = await detectTier(cwd);

    const availablePalettes = getAvailablePalettes(tier).filter(
      (pal) => pal !== 'custom'
    );

    // 3. Interactive selection if no palette provided
    const selectedPalette =
      paletteName ||
      (await p.select({
        message: 'Select a color palette:',
        options: availablePalettes.map((palette) => ({
          value: palette,
          label: palette.charAt(0).toUpperCase() + palette.slice(1),
        })),
        initialValue: availablePalettes.includes(config.theme.palette)
          ? config.theme.palette
          : availablePalettes[0],
      }));

    if (p.isCancel(selectedPalette)) {
      throw new UserCancelledError();
    }

    // 4. Validate palette against the caller's tier
    if (!availablePalettes.includes(selectedPalette)) {
      throw new ValidationError('palette', selectedPalette, availablePalettes);
    }

    // 5. Update palette
    const spinner = output.spinner('Updating palette...');

    config.theme.palette = selectedPalette;
    await saveConfig({ theme: { palette: selectedPalette } }, cwd);

    const utilsDir = config.utilsDir;
    await regenerateKigumiSetup(cwd, config, utilsDir);

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
