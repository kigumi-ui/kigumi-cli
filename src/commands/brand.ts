/**
 * Brand Command
 *
 * Changes the brand color
 */

import type { KigumiConfig } from '../schemas/config.js';

import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../checks/index.js';
import { handleError, UserCancelledError } from '../errors/index.js';
import { ValidationError } from '../errors/validation.js';
import { loadConfig, saveConfig, getConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';

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
  output.intro('kigumi brand');

  const cwd = process.cwd();

  try {
    // 1. Load configuration (needed for checks)
    let config: KigumiConfig | undefined;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch {
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

    // Config must be loaded at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    let selectedColor = colorName;

    // 3. Interactive selection if no color provided
    if (!selectedColor) {
      const options = BRAND_COLORS.map((color) => ({
        value: color,
        label: color.charAt(0).toUpperCase() + color.slice(1),
        hint: config && color === config.theme.brandColor ? 'Current' : '',
      }));

      const selected = await p.select({
        message: 'Select a brand color:',
        options,
        initialValue: config.theme.brandColor,
      });

      if (p.isCancel(selected)) {
        throw new UserCancelledError();
      }

      selectedColor = selected as string;
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
    await regenerateWebAwesomeSetup(cwd, config, utilsDir);

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
