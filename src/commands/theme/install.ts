/**
 * Theme Install Command
 *
 * Installs a theme from a community registry.
 */

import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { CheckRunner, ConfigExistsCheck } from '../../checks/index.js';
import {
  handleError,
  PreFlightCheckError,
  CommunityRegistryNotFoundError,
  ConfigNotFoundError,
  InternalInvariantError,
  CommunityComponentNotFoundError,
} from '../../errors/index.js';
import { saveConfig, getConfig } from '../../utils/config.js';
import {
  parseRegistrySource,
  fetchRegistryJson,
  fetchFile,
} from '../../utils/github-fetcher.js';
import { getGitHubToken } from '../../utils/github-token.js';
import { resolveRegistrySource } from '../../utils/registry-resolver.js';
import { regenerateKigumiSetup } from '../../utils/regenerate.js';
import { detectTier } from '../../utils/tier.js';
import type { KigumiConfig } from '../../schemas/config.js';

interface ThemeInstallOptions {
  from: string;
  cwd?: string;
}

export async function themeInstallAction(
  themeName: string,
  options: ThemeInstallOptions
) {
  const output = getOutput();
  output.intro('kigumi theme install');

  const cwd = options.cwd || process.cwd();

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
      throw new InternalInvariantError(
        'Configuration not loaded despite passing checks'
      );
    }

    // Detect the tier before fetching or writing anything, and pass it to
    // regenerateKigumiSetup: a broken package.json then fails here, with no
    // theme files written and kigumi.config.json untouched (issue #121).
    const tier = await detectTier(cwd);

    // 3. Fetch registry
    const spinner = output.spinner('Fetching registry...');
    const resolvedUrl = resolveRegistrySource(options.from, config);
    const source = parseRegistrySource(resolvedUrl, { baseDir: cwd });

    if (source.kind === 'github') {
      const token = await getGitHubToken();
      if (token) {
        source.token = token;
      }
    }

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

    // 4. Find theme
    const theme = registry.themes[themeName];
    if (!theme) {
      spinner.error('Theme not found');
      const available = Object.keys(registry.themes);
      throw new CommunityComponentNotFoundError(
        themeName,
        registry.name,
        available,
        'theme'
      );
    }

    spinner.stop(`Found theme: ${theme.name}`);

    // 5. Download CSS files. Both are fetched before either is written, so a
    // failed download leaves no half-installed theme behind.
    const installSpinner = output.spinner('Installing theme...');
    const stylesDir = config.stylesDir;
    const themeDir = path.join(cwd, stylesDir, 'community-themes');
    const themePath = path.join(themeDir, `${themeName}.css`);
    const varsPath = path.join(themeDir, `${themeName}-variables.css`);

    const cssContent = await fetchFile(source, theme.files.css);
    const varsContent = theme.files.variables
      ? await fetchFile(source, theme.files.variables)
      : undefined;

    await fs.ensureDir(themeDir);
    await fs.writeFile(themePath, cssContent);
    if (varsContent !== undefined) {
      await fs.writeFile(varsPath, varsContent);
    }

    // 6. Update config
    config.theme.selected = themeName;
    const installedThemes = {
      ...config.installedThemes,
      [themeName]: {
        source: 'community' as const,
        registryUrl: source.url,
        registryVersion: registry.version,
      },
    };
    config.installedThemes = installedThemes;
    await saveConfig({ theme: { selected: themeName }, installedThemes }, cwd);

    // 7. Regenerate setup files
    const utilsDir = config.utilsDir;
    await regenerateKigumiSetup(cwd, config, utilsDir, tier);

    installSpinner.stop('Theme installed');

    output.note(
      'Theme files',
      [
        `CSS: ${path.relative(cwd, themePath)}`,
        varsContent !== undefined
          ? `Variables: ${path.relative(cwd, varsPath)}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    );

    output.outro(
      `${pc.green('✓')} Theme "${theme.name}" installed from ${registry.name}\n` +
        pc.dim('Reload your browser to see changes')
    );
  } catch (error) {
    handleError(error, output);
  }
}
