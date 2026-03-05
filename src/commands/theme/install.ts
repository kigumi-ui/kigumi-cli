/**
 * Theme Install Command
 *
 * Installs a theme from a community registry.
 */

import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../../checks/index.js';
import {
  handleError,
  PreFlightCheckError,
  CommunityRegistryNotFoundError,
} from '../../errors/index.js';
import { loadConfig, saveConfig, getConfig } from '../../utils/config.js';
import {
  parseGitHubUrl,
  fetchRegistryJson,
  fetchFile,
} from '../../utils/github-fetcher.js';
import { getGitHubToken } from '../../utils/github-token.js';
import { resolveRegistrySource } from '../../utils/registry-resolver.js';
import { regenerateWebAwesomeSetup } from '../../utils/regenerate.js';
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
    // 1. Load config
    let config: KigumiConfig | undefined;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch {
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

    // 3. Fetch registry
    const spinner = output.spinner('Fetching registry...');
    const resolvedUrl = resolveRegistrySource(options.from, config);
    const source = parseGitHubUrl(resolvedUrl);

    const token = await getGitHubToken();
    if (token) {
      source.token = token;
    }

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

    // 4. Find theme
    const theme = registry.themes[themeName];
    if (!theme) {
      spinner.error('Theme not found');
      const available = Object.keys(registry.themes);
      throw new Error(
        `Theme "${themeName}" not found in registry "${registry.name}". ` +
          (available.length > 0
            ? `Available: ${available.join(', ')}`
            : 'This registry has no themes.')
      );
    }

    spinner.stop(`Found theme: ${theme.name}`);

    // 5. Download CSS files
    const installSpinner = output.spinner('Installing theme...');
    const stylesDir = config.stylesDir || 'src/styles';
    const themeDir = path.join(cwd, stylesDir, 'community-themes');
    await fs.ensureDir(themeDir);

    const cssContent = await fetchFile(source, theme.files.css);
    const themePath = path.join(themeDir, `${themeName}.css`);
    await fs.writeFile(themePath, cssContent);

    if (theme.files.variables) {
      const varsContent = await fetchFile(source, theme.files.variables);
      const varsPath = path.join(themeDir, `${themeName}-variables.css`);
      await fs.writeFile(varsPath, varsContent);
    }

    // 6. Update config
    config.theme.selected = themeName;
    config.installedThemes = config.installedThemes || {};
    config.installedThemes[themeName] = {
      source: 'community',
      registryUrl: source.url,
      registryVersion: registry.version,
    };
    await saveConfig(config, cwd);

    // 7. Regenerate setup files
    const utilsDir = config.utilsDir || 'src/lib';
    await regenerateWebAwesomeSetup(cwd, config, utilsDir);

    installSpinner.stop('Theme installed');

    output.note(
      'Theme files',
      [
        `CSS: ${path.relative(cwd, themePath)}`,
        theme.files.variables
          ? `Variables: ${path.relative(cwd, path.join(themeDir, `${themeName}-variables.css`))}`
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
