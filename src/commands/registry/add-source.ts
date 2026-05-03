/**
 * Registry Add Source Command
 *
 * Adds a community registry URL to the project config.
 */

import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { CheckRunner, ConfigExistsCheck } from '../../checks/index.js';
import {
  handleError,
  PreFlightCheckError,
  CommunityRegistryNotFoundError,
  ConfigNotFoundError,
} from '../../errors/index.js';
import { saveConfig, getConfig } from '../../utils/config.js';
import {
  parseRegistrySource,
  fetchRegistryJson,
} from '../../utils/github-fetcher.js';
import { getGitHubToken } from '../../utils/github-token.js';
import type { KigumiConfig } from '../../schemas/config.js';

interface AddSourceOptions {
  cwd?: string;
}

export async function registryConnectAction(
  url: string,
  options?: AddSourceOptions
) {
  const output = getOutput();
  output.intro('kigumi registry connect');

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

    // 3. Parse and validate registry source.
    // Local filesystem paths are resolved against the project cwd so that
    // commands like `kigumi registry connect ../sibling-registry` work
    // regardless of the user's shell pwd.
    const spinner = output.spinner('Verifying registry...');
    const source = parseRegistrySource(url, { baseDir: cwd });

    // Attach a GitHub token only for github sources. Local sources need no auth.
    if (source.kind === 'github') {
      const token = await getGitHubToken();
      if (token) {
        source.token = token;
      }
    }

    // 4. Check if already added
    const registries = config.registries || [];
    if (registries.some((r) => r.url === source.url)) {
      spinner.stop(`Registry already configured: ${source.url}`);
      output.outro('No changes made');
      return;
    }

    // 5. Fetch and validate registry.json
    let registry;
    try {
      registry = await fetchRegistryJson(source, output);
    } catch (cause) {
      spinner.error('Failed to fetch registry');
      throw new CommunityRegistryNotFoundError(
        source.url,
        cause instanceof Error ? cause : undefined
      );
    }

    // 6. Check framework compatibility (warn-only).
    // The connect step intentionally does NOT block on framework mismatch.
    // Otherwise users couldn't connect a foreign-framework registry first
    // and then `kigumi add --from <name> --cross-framework` from it — a
    // chicken-and-egg blocker. We surface a warning so the mismatch is
    // visible, and `kigumi add` re-checks and gates installation.
    if (!registry.frameworks.includes(config.framework)) {
      output.warning(
        `Registry "${registry.name}" targets ${registry.frameworks.join(
          ', '
        )} but this project uses ${config.framework}. To consume components ` +
          `from it, use: kigumi add --from ${registry.name} <component> --cross-framework`
      );
    }

    // 7. Add to config
    const nextRegistries = [
      ...registries,
      { url: source.url, name: registry.name },
    ];
    config.registries = nextRegistries;
    await saveConfig({ registries: nextRegistries }, cwd);

    spinner.stop('Registry verified');

    const componentCount = Object.keys(registry.components).length;
    const themeCount = Object.keys(registry.themes).length;

    output.note(
      `${registry.name}`,
      [
        `${componentCount} component(s), ${themeCount} theme(s)`,
        registry.description || '',
      ]
        .filter(Boolean)
        .join('\n')
    );

    output.outro(
      `${pc.green('✓')} Connected registry "${registry.name}"\n` +
        pc.dim(
          `Use: kigumi add --from ${registry.name} <component>\n` +
            `     kigumi theme install <theme> --from ${registry.name}`
        )
    );
  } catch (error) {
    handleError(error, output);
  }
}
