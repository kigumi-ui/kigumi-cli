/**
 * Registry List Sources Command
 *
 * Lists configured community registries.
 */

import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../../checks/index.js';
import { handleError, PreFlightCheckError } from '../../errors/index.js';
import { loadConfig, getConfig } from '../../utils/config.js';
import type { KigumiConfig } from '../../schemas/config.js';

interface ListSourcesOptions {
  cwd?: string;
}

export async function registryListSourcesAction(options?: ListSourcesOptions) {
  const output = getOutput();
  output.intro('kigumi registry list');

  const cwd = options?.cwd || process.cwd();

  try {
    // 1. Load config
    let config: KigumiConfig | undefined;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch (_error) {
      // Will be caught by checks
    }

    // 2. Pre-flight checks
    const checker = new CheckRunner()
      .add(new ConfigExistsCheck())
      .add(new ConfigValidCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      throw new PreFlightCheckError(checkResults);
    }

    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    // 3. List registries
    const registries = config.registries || [];

    if (registries.length === 0) {
      output.info('No community registries connected');
      output.note(
        'Connect a registry',
        'kigumi registry connect https://github.com/user/registry'
      );
      output.outro('');
      return;
    }

    output.info(`${pc.bold('Configured registries:')}\n`);

    for (const reg of registries) {
      const name = reg.name || '(unnamed)';
      output.info(`  ${pc.cyan(name)}`);
      output.info(`  ${pc.dim(reg.url)}\n`);
    }

    output.note(
      'Usage',
      `kigumi add <component> --from <name>\n` +
        `kigumi theme install <theme> --from <name>`
    );

    output.outro(`${registries.length} registry(ies) connected`);
  } catch (error) {
    handleError(error, output);
  }
}
