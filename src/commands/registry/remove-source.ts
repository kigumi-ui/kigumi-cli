/**
 * Registry Remove Source Command
 *
 * Removes a community registry URL from the project config.
 */

import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { CheckRunner, ConfigExistsCheck } from '../../checks/index.js';
import {
  handleError,
  PreFlightCheckError,
  ConfigNotFoundError,
} from '../../errors/index.js';
import { saveConfig, getConfig } from '../../utils/config.js';
import type { KigumiConfig } from '../../schemas/config.js';

interface RemoveSourceOptions {
  cwd?: string;
}

export async function registryRemoveSourceAction(
  url: string,
  options?: RemoveSourceOptions
) {
  const output = getOutput();
  output.intro('kigumi registry remove');

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

    // 3. Find and remove
    const registries = config.registries || [];
    const index = registries.findIndex((r) => r.url === url || r.name === url);

    if (index === -1) {
      output.warning(`Registry not found: ${url}`);
      output.outro('No changes made');
      return;
    }

    const removed = registries[index];

    // 4. Warn about installed components from this registry
    const installed = config.installedComponents || {};
    const affectedComponents = Object.entries(installed)
      .filter(([, info]) => info.registryUrl === removed.url)
      .map(([name]) => name);

    if (affectedComponents.length > 0) {
      output.warning(
        `${affectedComponents.length} installed component(s) came from this registry: ${affectedComponents.join(', ')}`
      );
      output.info(
        pc.dim(
          'These components will remain installed but lose their source reference.'
        )
      );
    }

    // 5. Remove and save
    const nextRegistries = registries.filter((_, i) => i !== index);
    config.registries = nextRegistries;
    await saveConfig({ registries: nextRegistries }, cwd);

    output.outro(
      `${pc.green('✓')} Removed registry "${removed.name || removed.url}"`
    );
  } catch (error) {
    handleError(error, output);
  }
}
