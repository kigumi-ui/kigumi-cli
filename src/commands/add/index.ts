import type { KigumiConfig } from '../../schemas/config.js';
/**
 * Add Command - Main Orchestrator
 *
 * PURPOSE: Adds Web Awesome components to the project.
 * Handles component selection, validation, and installation.
 *
 * @public
 */

import { getOutput } from '../../output/index.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../../checks/index.js';
import {
  handleError,
  PreFlightCheckError,
  FrameworkMismatchError,
  CommunityRegistryNotFoundError,
  VersionMismatchError,
} from '../../errors/index.js';
import { validators, type AddOptions } from '../../schemas/index.js';
import { loadConfig, saveConfig, getConfig } from '../../utils/config.js';
import { checkVersionCompatibility } from '../../utils/version-check.js';
import { CLI_VERSION } from '../../constants.js';
import { selectComponents } from './component-selector.js';
import { validateComponents } from './validator.js';
import { ComponentInstaller } from './installer.js';
import { RemoteComponentInstaller } from './remote-installer.js';
import { selectRemoteComponents } from './remote-component-selector.js';
import {
  parseGitHubUrl,
  fetchRegistryJson,
} from '../../utils/github-fetcher.js';
import { getGitHubToken } from '../../utils/github-token.js';
import { resolveRegistrySource } from '../../utils/registry-resolver.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * Add command
 *
 * @param components - Component names to add
 * @param options - Command options
 */
export async function addCommand(components: string[], options?: AddOptions) {
  const output = getOutput();
  output.intro('kigumi add');

  const cwd = options?.cwd || process.cwd();

  try {
    // 1. Validate options with defaults
    const validatedOptions = validators.add({
      overwrite: options?.overwrite ?? false,
      all: options?.all ?? false,
      tests: options?.tests ?? true,
      typescript: options?.typescript,
      yes: options?.yes,
      cwd: options?.cwd,
      from: options?.from,
    });

    // 2. Load configuration (needed for checks)
    let config: KigumiConfig | undefined;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch {
      // Config loading failed - will be caught by checks
    }

    // 3. Pre-flight checks
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
    // TypeScript type narrowing: config is now guaranteed to be defined
    const validConfig = config;

    // 4. Version compatibility check
    const versionResult = checkVersionCompatibility(
      validConfig.kigumiVersion,
      CLI_VERSION
    );

    if (versionResult.status === 'major-mismatch') {
      throw new VersionMismatchError(
        versionResult.configVersion,
        versionResult.cliVersion
      );
    }

    if (versionResult.status === 'minor-mismatch') {
      output.warning(
        `CLI version ${versionResult.cliVersion} differs from project version ${versionResult.configVersion}. ` +
          `Consider: npx kigumi@${versionResult.configVersion} add <component>`
      );
    }

    if (versionResult.status === 'no-pin') {
      output.info(
        'Project has no kigumiVersion set. Run "npx kigumi init" to pin a version.'
      );
    }

    // Branch: Remote registry flow vs. local built-in flow
    if (validatedOptions.from) {
      await addFromRemoteRegistry(
        components,
        validatedOptions,
        validConfig,
        cwd,
        output
      );
    } else {
      await addFromBuiltinRegistry(
        components,
        validatedOptions,
        validConfig,
        cwd,
        output
      );
    }
  } catch (error) {
    handleError(error, output);
  }
}

/**
 * Add components from a remote community registry (--from flag)
 */
async function addFromRemoteRegistry(
  components: string[],
  options: AddOptions,
  config: KigumiConfig,
  cwd: string,
  output: import('../../output/types.js').OutputInterface
): Promise<void> {
  const fromUrl = resolveRegistrySource(options.from!, config);

  // 1. Parse GitHub URL and resolve token
  const source = parseGitHubUrl(fromUrl);
  const token = await getGitHubToken();
  if (token) {
    source.token = token;
  }

  // 2. Fetch and validate registry
  const spinner = output.spinner('Fetching registry...');
  let registry;
  try {
    registry = await fetchRegistryJson(source);
  } catch (cause) {
    spinner.error('Failed to fetch registry');
    throw new CommunityRegistryNotFoundError(
      source.url,
      cause instanceof Error ? cause : undefined
    );
  }
  spinner.stop(`Registry: ${registry.name}`);

  // 3. Check framework compatibility
  if (!registry.frameworks.includes(config.framework)) {
    throw new FrameworkMismatchError(
      registry.name,
      registry.frameworks,
      config.framework
    );
  }

  // 4. Select components
  const componentsToAdd = await selectRemoteComponents(
    components,
    registry,
    config.framework,
    output
  );

  // 5. Install components
  const installer = new RemoteComponentInstaller(
    cwd,
    config,
    source,
    registry,
    output
  );
  const results = await installer.installComponents(componentsToAdd, options);

  // 6. Update provenance tracking
  const added = results.filter((r) => r.success && !r.skipped);
  if (added.length > 0) {
    config.installedComponents = config.installedComponents || {};
    for (const result of added) {
      config.installedComponents[result.name] = {
        source: 'community',
        registryUrl: source.url,
        registryVersion: registry.version,
        installedAt: new Date().toISOString(),
      };
    }
    await saveConfig(config, cwd);
  }

  // 7. Summary
  printSummary(results, config, output, registry.name);
}

/**
 * Add components from the built-in registry (default flow)
 */
async function addFromBuiltinRegistry(
  components: string[],
  options: AddOptions,
  config: KigumiConfig,
  cwd: string,
  output: import('../../output/types.js').OutputInterface
): Promise<void> {
  // 1. Detect tier from .env
  const { detectTier } = await import('../../utils/tier.js');
  const tier = await detectTier(cwd);

  // 2. Determine components to add
  const componentsToAdd = await selectComponents(
    components,
    options,
    tier,
    output
  );

  // 3. Validate components
  await validateComponents(componentsToAdd, tier, output);

  // 4. Install components
  const installer = new ComponentInstaller(cwd, config, output);
  const results = await installer.installComponents(componentsToAdd, options);

  // 5. Update provenance tracking for builtin components
  const added = results.filter((r) => r.success && !r.skipped);
  if (added.length > 0) {
    config.installedComponents = config.installedComponents || {};
    for (const result of added) {
      config.installedComponents[result.name] = {
        source: 'builtin',
        installedAt: new Date().toISOString(),
        kigumiVersion: CLI_VERSION,
      };
    }
    await saveConfig(config, cwd);
  }

  // 6. Update vite-env.d.ts with new component types (React + TypeScript only)
  if (config.typescript && config.framework === 'react') {
    const addedComponents = added.map((r) => r.name);

    if (addedComponents.length > 0) {
      await updateViteEnvTypes(cwd, addedComponents, output);
    }
  }

  // 7. Summary
  printSummary(results, config, output);
}

/**
 * Print installation summary
 */
function printSummary(
  results: import('./installer.js').InstallResult[],
  config: KigumiConfig,
  output: import('../../output/types.js').OutputInterface,
  registryName?: string
): void {
  const added = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => r.success && r.skipped);
  const failed = results.filter((r) => !r.success);

  if (added.length > 0) {
    const source = registryName ? ` from ${registryName}` : '';
    output.success(`Added ${added.length} component(s)${source}`);

    if (config.framework === 'vue') {
      const importList = added
        .map(
          (r) =>
            `import ${r.name} from '${config.aliases?.['@/components'] || config.componentsDir}/${r.name}/${r.name}.vue';`
        )
        .join('\n');
      output.note('Import them', importList);
    } else {
      const componentNames = added.map((r) => r.name).join(', ');
      output.note(
        'Import them',
        `import { ${componentNames} } from '${config.aliases?.['@/components'] || config.componentsDir}';`
      );
    }
  }

  // Show which components had local modifications that were overwritten
  const overwrittenWithMods = added.filter(
    (r) => r.modifiedFiles && r.modifiedFiles.length > 0
  );
  if (overwrittenWithMods.length > 0) {
    output.warning(
      'The following components had local modifications that were overwritten:'
    );
    for (const r of overwrittenWithMods) {
      output.warn(`  ${r.name}: ${r.modifiedFiles!.join(', ')}`);
    }
    output.info('Review the changes with git diff to verify nothing was lost.');
  }

  if (skipped.length > 0) {
    output.info(`Skipped ${skipped.length} existing component(s)`);
  }

  if (failed.length > 0) {
    output.warning(`Failed to add ${failed.length} component(s)`);
    failed.forEach((r) => {
      output.error(`${r.name}: ${r.error}`);
    });
  }

  output.outro(added.length > 0 ? '✓ Done' : 'No new components added');
}

/**
 * Update vite-env.d.ts with new component type declarations
 */
async function updateViteEnvTypes(
  cwd: string,
  components: string[],
  output: import('../../output/types.js').OutputInterface
): Promise<void> {
  const viteEnvPath = path.join(cwd, 'src/vite-env.d.ts');

  if (!(await fs.pathExists(viteEnvPath))) {
    // File doesn't exist, skip update
    return;
  }

  try {
    let content = await fs.readFile(viteEnvPath, 'utf-8');

    // Check if this is our managed file (has the "auto-managed" comment)
    if (!content.includes('auto-managed')) {
      // Not our file, don't modify it
      return;
    }

    let modified = false;

    for (const component of components) {
      const tagName = `wa-${component.toLowerCase()}`;

      // Check if type declaration already exists
      if (content.includes(`'${tagName}':`)) {
        continue; // Already exists
      }

      // Add new type declaration before the closing braces
      const typeDeclaration = `      '${tagName}': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;\n`;

      // Find the IntrinsicElements interface and add before its closing brace
      // Works with both "declare global { namespace JSX {" and "declare module 'react' {"
      const match = content.match(
        /(interface IntrinsicElements \{[\s\S]*?)( {4}\}\s*\}\s*\}\s*(?:export \{\};)?)/
      );

      if (match) {
        content = content.replace(
          match[0],
          `${match[1]}${typeDeclaration}${match[2]}`
        );
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(viteEnvPath, content);
      output.info('Updated vite-env.d.ts with new component types');
    }
  } catch (error) {
    // Silently fail - this is not critical
    if (error instanceof Error) {
      output.warn(`Could not update vite-env.d.ts: ${error.message}`);
    }
  }
}
