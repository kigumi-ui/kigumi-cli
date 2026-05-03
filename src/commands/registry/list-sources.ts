/**
 * Registry List Sources Command
 *
 * Lists configured community registries.
 */

import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { CheckRunner, ConfigExistsCheck } from '../../checks/index.js';
import {
  handleError,
  PreFlightCheckError,
  ConfigNotFoundError,
} from '../../errors/index.js';
import { getConfig } from '../../utils/config.js';
import type { KigumiConfig } from '../../schemas/config.js';

interface ListSourcesOptions {
  cwd?: string;
}

export async function registryListSourcesAction(options?: ListSourcesOptions) {
  const output = getOutput();
  output.intro('kigumi registry list');

  const cwd = options?.cwd || process.cwd();

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
