/**
 * Brand Command
 *
 * PURPOSE: Changes the brand color for the project.
 *
 * @public
 */

import type { KigumiConfig } from '../schemas/config.js';

import { Command } from 'commander';
import * as p from '../prompts/index.js';
import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../checks/index.js';
import {
  handleError,
  UserCancelledError,
  PreFlightCheckError,
} from '../errors/index.js';
import { ValidationError } from '../errors/validation.js';
import { saveConfig, getConfig } from '../utils/config.js';
import { regenerateKigumiSetup } from '../utils/regenerate.js';

const BRAND_COLORS = [
  'blue',
  'purple',
  'green',
  'red',
  'orange',
  'yellow',
  'cyan',
  'indigo',
  'pink',
  'gray',
];

async function brandAction(colorName?: string) {
  const output = getOutput();

  const cwd = process.cwd();

  try {
    // 1. Load configuration (needed for checks).
    // getConfig() internally calls loadConfig() and deep-merges with defaults,
    // so a single call is sufficient. A throw here means malformed config;
    // the pre-flight checks below surface a readable error.
    let config: KigumiConfig | undefined;
    try {
      config = getConfig(cwd);
    } catch (_error) {
      // Config loading failed - will be caught by checks
    }

    // 2. Pre-flight checks
    const checker = new CheckRunner()
      .add(new ConfigExistsCheck())
      .add(new ConfigValidCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      throw new PreFlightCheckError(checkResults);
    }

    // Config must be loaded at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    // 3. Interactive selection if no color provided
    const selectedColor =
      colorName ||
      (await p.select({
        message: 'Select a brand color:',
        options: BRAND_COLORS.map((color) => ({
          value: color,
          label: color.charAt(0).toUpperCase() + color.slice(1),
        })),
        initialValue: BRAND_COLORS.includes(config.theme.brandColor)
          ? config.theme.brandColor
          : BRAND_COLORS[0],
      }));

    if (p.isCancel(selectedColor)) {
      throw new UserCancelledError();
    }

    // 4. Validate brand color
    if (!BRAND_COLORS.includes(selectedColor)) {
      throw new ValidationError('brand color', selectedColor, BRAND_COLORS);
    }

    // 5. Update brand color
    const spinner = output.spinner('Updating brand color...');

    config.theme.brandColor = selectedColor;
    await saveConfig(config, cwd);

    const utilsDir = config.utilsDir || 'src/lib';
    await regenerateKigumiSetup(cwd, config, utilsDir);

    spinner.stop('Brand color updated');

    output.outro(
      `${pc.green('✓')} Brand color set to ${pc.cyan(selectedColor)}\n` +
        pc.dim('Reload your browser to see changes')
    );
  } catch (error) {
    handleError(error, output);
  }
}

export const brandCommand = new Command('brand')
  .description('Change the brand color')
  .argument('[color]', 'Brand color (omit to see options)')
  .action(brandAction);
