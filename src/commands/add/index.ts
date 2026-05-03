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
import { CheckRunner, ConfigExistsCheck } from '../../checks/index.js';
import {
  handleError,
  PreFlightCheckError,
  FrameworkMismatchError,
  CommunityRegistryNotFoundError,
  VersionMismatchError,
  ConfigNotFoundError,
} from '../../errors/index.js';
import { validators, type AddOptions } from '../../schemas/index.js';
import { saveConfig, getConfig } from '../../utils/config.js';
import { checkVersionCompatibility } from '../../utils/version-check.js';
import { CLI_VERSION } from '../../constants.js';
import { selectComponents } from './component-selector.js';
import { validateComponents } from './validator.js';
import { ComponentInstaller } from './installer.js';
import { RemoteComponentInstaller } from './remote-installer.js';
import { selectRemoteComponents } from './remote-component-selector.js';
import {
  parseRegistrySource,
  fetchRegistryJson,
} from '../../utils/github-fetcher.js';
import { getGitHubToken } from '../../utils/github-token.js';
import { resolveRegistrySource } from '../../utils/registry-resolver.js';
import { detectTier } from '../../utils/tier.js';
import { toKigumiAlias } from '../../utils/project-config.js';
import {
  isNextProject,
  detectNextRouter,
} from '../../utils/detect-framework.js';

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
      force: options?.force ?? false,
      all: options?.all ?? false,
      tests: options?.tests ?? true,
      typescript: options?.typescript,
      yes: options?.yes,
      cwd: options?.cwd,
      from: options?.from,
      crossFramework: options?.crossFramework ?? false,
    });

    // 2. Load configuration (needed for checks).
    // getConfig() internally calls loadConfig() and deep-merges with defaults,
    // so a single call is sufficient. ConfigNotFoundError is swallowed here
    // because ConfigExistsCheck below shows a friendlier "run kigumi init"
    // message; ConfigInvalidError must surface so users see the schema issue
    // (otherwise the only error they get is the cryptic "Configuration not
    // loaded despite passing checks" fallback below).
    let config: KigumiConfig | undefined;
    try {
      config = getConfig(cwd);
    } catch (err) {
      if (!(err instanceof ConfigNotFoundError)) throw err;
    }

    // 3. Pre-flight checks
    const checker = new CheckRunner().add(new ConfigExistsCheck());

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

  // 1. Parse the source (GitHub or local filesystem) and resolve a token
  // for github sources only — local sources need no auth.
  const source = parseRegistrySource(fromUrl, { baseDir: cwd });
  if (source.kind === 'github') {
    const token = await getGitHubToken();
    if (token) {
      source.token = token;
    }
  }

  // 2. Fetch and validate registry
  const spinner = output.spinner('Fetching registry...');
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
  spinner.stop(`Registry: ${registry.name}`);

  // 3. Check framework compatibility.
  // The default flow throws on a mismatch — that's a useful safety net
  // for the 99% of users who accidentally point at the wrong-framework
  // registry. The `--cross-framework` opt-in flag downgrades this to a
  // warning so the consumer can fetch and stage source-framework files
  // for an agent-driven conversion (Phase 2 of feat/cross-framework-conversion).
  if (!registry.frameworks.includes(config.framework)) {
    if (!options.crossFramework) {
      throw new FrameworkMismatchError(
        registry.name,
        registry.frameworks,
        config.framework
      );
    }
    output.warning(
      `Registry "${registry.name}" targets ${registry.frameworks.join(', ')} ` +
        `but this project uses ${config.framework}. Continuing because ` +
        `--cross-framework is set; matching components will be staged into ` +
        `.kigumi/foreign/ for conversion.`
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
    const installedComponents = { ...config.installedComponents };
    for (const result of added) {
      installedComponents[result.name] = {
        source: 'community',
        registryUrl: source.url,
        registryVersion: registry.version,
        installedAt: new Date().toISOString(),
      };
    }
    config.installedComponents = installedComponents;
    await saveConfig({ installedComponents }, cwd);
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
  // 1. Detect tier once for the entire add flow.
  // The tier is threaded into ComponentInstaller and generateComponent so
  // downstream code no longer re-detects. Tier cannot change mid-command,
  // so one detection suffices.
  const tier = await detectTier(cwd);

  // Detect Next-project context once per command. Router-dependent
  // post-render logic in generateComponent would otherwise probe the
  // filesystem for each of N components, costing ~10 stats per probe.
  const isNext = await isNextProject(cwd);
  const nextRouter = isNext ? await detectNextRouter(cwd) : undefined;

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
  const installer = new ComponentInstaller(
    cwd,
    config,
    output,
    tier,
    isNext,
    nextRouter
  );
  const results = await installer.installComponents(componentsToAdd, options);

  // 5. Update provenance tracking for builtin components
  const added = results.filter((r) => r.success && !r.skipped);
  if (added.length > 0) {
    const installedComponents = { ...config.installedComponents };
    for (const result of added) {
      installedComponents[result.name] = {
        source: 'builtin',
        installedAt: new Date().toISOString(),
        kigumiVersion: CLI_VERSION,
      };
    }
    config.installedComponents = installedComponents;
    await saveConfig({ installedComponents }, cwd);
  }

  // 6. Summary
  printSummary(results, config, output);
}

function resolveImportBase(config: KigumiConfig): string {
  return toKigumiAlias(config.componentsDir);
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
  const installed = results.filter((r) => r.success && !r.skipped && !r.staged);
  const staged = results.filter((r) => r.success && r.staged);
  const skipped = results.filter((r) => r.success && r.skipped);
  const failed = results.filter((r) => !r.success);

  if (installed.length > 0) {
    const source = registryName ? ` from ${registryName}` : '';
    output.success(`Added ${installed.length} component(s)${source}`);

    const importBase = resolveImportBase(config);
    if (config.framework === 'vue') {
      const importList = installed
        .map(
          (r) =>
            `import ${r.name} from '${importBase}/${r.name}/${r.name}.vue';`
        )
        .join('\n');
      output.note('Import them', importList);
    } else {
      const componentNames = installed.map((r) => r.name).join(', ');
      output.note(
        'Import them',
        `import { ${componentNames} } from '${importBase}';`
      );
    }
  }

  // Cross-framework: components staged for agent-driven conversion
  if (staged.length > 0) {
    const sourcePart = registryName ? ` from ${registryName}` : '';
    output.success(
      `Staged ${staged.length} component(s)${sourcePart} for cross-framework conversion`
    );

    const handoffLines: string[] = [];
    for (const r of staged) {
      handoffLines.push(
        `${r.name} (${r.sourceFramework} → ${config.framework})`
      );
      handoffLines.push(`  Files at: ${r.stagedPath}`);
      if (r.handoffPrompt) {
        handoffLines.push(`  Ask Claude: "${r.handoffPrompt}"`);
      }
      handoffLines.push('');
    }
    // Trailing empty line is just a separator inside the note body
    if (handoffLines[handoffLines.length - 1] === '') {
      handoffLines.pop();
    }
    output.note('Convert with kigumi-cross-framework', handoffLines.join('\n'));
  }

  // Show which components had local modifications that were overwritten
  const overwrittenWithMods = installed.filter(
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

  const anySuccess = installed.length + staged.length > 0;
  output.outro(anySuccess ? '✓ Done' : 'No new components added');
}
