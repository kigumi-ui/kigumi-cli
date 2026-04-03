/**
 * Upgrade Command
 *
 * PURPOSE: Upgrades a kigumi project to the running CLI version.
 * Updates config, installs the matching Web Awesome version, and shows
 * breaking changes with migration guides.
 *
 * @public
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { CLI_VERSION } from '../constants.js';
import { getOutput } from '../output/index.js';
import { loadConfig, saveConfig } from '../utils/config.js';
import { handleError, ConfigNotFoundError } from '../errors/index.js';
import {
  getVersionEntry,
  getBreakingChangesBetween,
  getVersionsBetween,
} from '../utils/version-map.js';
import { getProjectInfo } from '../utils/detect-framework.js';
import { detectTier } from '../utils/tier.js';
import { installDependencies } from './init/installer.js';

interface UpgradeOptions {
  cwd?: string;
  dryRun?: boolean;
  yes?: boolean;
  install?: boolean;
}

/**
 * Upgrade command - show upgrade guide and update project version
 */
export async function upgradeCommand(options: UpgradeOptions = {}) {
  const output = getOutput();
  output.intro('kigumi upgrade');

  const cwd = options.cwd || process.cwd();

  try {
    // 1. Load config
    const config = loadConfig(cwd);
    if (!config) {
      throw new ConfigNotFoundError(cwd);
    }

    const projectVersion = config.kigumiVersion;

    // 2. Handle missing version
    if (!projectVersion) {
      output.info('Your project does not have a pinned kigumiVersion yet.');
      output.info(`Current CLI version: ${pc.bold(CLI_VERSION)}`);

      if (options.dryRun) {
        output.info('Dry run: would pin kigumiVersion to ' + CLI_VERSION);
        output.outro('Dry run complete');
        return;
      }

      const shouldPin = options.yes
        ? true
        : await promptConfirm(`Pin your project to kigumi@${CLI_VERSION}?`);

      if (shouldPin) {
        config.kigumiVersion = CLI_VERSION;
        await saveConfig(config, cwd);
        output.success(`Pinned kigumiVersion to ${CLI_VERSION}`);
      }

      output.outro('Done');
      return;
    }

    // 3. Already up to date?
    if (projectVersion === CLI_VERSION) {
      output.success(`Already up to date (${CLI_VERSION})`);
      output.outro('No upgrade needed');
      return;
    }

    // 4. Show version comparison
    output.info(`Project version: ${pc.bold(projectVersion)}`);
    output.info(`CLI version:     ${pc.bold(CLI_VERSION)}`);

    // 5. Show WA version change
    const fromEntry = getVersionEntry(projectVersion);
    const toEntry = getVersionEntry(CLI_VERSION);
    if (fromEntry && toEntry) {
      if (fromEntry.webAwesomeVersion !== toEntry.webAwesomeVersion) {
        output.info('');
        output.info(
          `Web Awesome: ${fromEntry.webAwesomeVersion} → ${pc.bold(toEntry.webAwesomeVersion)}`
        );
      }
    }

    // 6. Show version entries between
    const versions = getVersionsBetween(projectVersion, CLI_VERSION);
    if (versions.length > 0) {
      output.info('');
      output.info(pc.bold('Versions included in this upgrade:'));
      for (const v of versions) {
        output.info(`  ${v.kigumiVersion} (${v.releasedAt})`);
      }
    }

    // 7. Show breaking changes
    const breakingChanges = getBreakingChangesBetween(
      projectVersion,
      CLI_VERSION
    );

    if (breakingChanges.length > 0) {
      output.info('');
      output.warning(pc.bold(`Breaking changes (${breakingChanges.length}):`));
      for (const change of breakingChanges) {
        output.info(`  • ${change.description}`);
        if (change.affectedComponents.length > 0) {
          output.info(`    Affects: ${change.affectedComponents.join(', ')}`);
        }
        output.info(`    Migration: ${change.migrationGuide}`);
      }
    } else {
      output.info('');
      output.success('No breaking changes between these versions.');
    }

    // 8. Dry run: show what would happen and exit
    const waVersionChanged =
      toEntry && fromEntry?.webAwesomeVersion !== toEntry.webAwesomeVersion;

    if (options.dryRun) {
      output.info('');
      output.info(
        `Dry run: would update kigumiVersion from ${projectVersion} to ${CLI_VERSION}`
      );
      if (waVersionChanged) {
        output.info(
          `Dry run: would install Web Awesome ${toEntry.webAwesomeVersion}`
        );
      }
      output.outro('Dry run complete');
      return;
    }

    // 9. Confirm and apply upgrade
    output.info('');
    const shouldUpgrade = options.yes
      ? true
      : await promptConfirm(`Upgrade to kigumi@${CLI_VERSION}?`);

    if (!shouldUpgrade) {
      output.outro('Upgrade cancelled');
      return;
    }

    // 9a. Update config
    config.kigumiVersion = CLI_VERSION;
    if (toEntry) {
      config.webAwesome = config.webAwesome || {};
      config.webAwesome.version = toEntry.webAwesomeVersion;
    }
    await saveConfig(config, cwd);
    output.success(`Updated kigumiVersion to ${CLI_VERSION}`);

    // 9b. Install updated Web Awesome package
    if (waVersionChanged && options.install !== false) {
      const projectInfo = await getProjectInfo(cwd);
      const tier = await detectTier(cwd);

      await installDependencies({
        cwd,
        config,
        tier,
        packageManager: projectInfo.packageManager,
        output,
      });
    }

    // 10. Show next steps
    output.info('');
    output.note(
      'Next steps',
      'Component files are not automatically regenerated.\n' +
        'Run "npx kigumi add <component> --force" to update specific components.'
    );

    output.outro('Upgrade complete');
  } catch (error) {
    handleError(error, output);
  }
}

async function promptConfirm(message: string): Promise<boolean> {
  const result = await p.confirm({ message, initialValue: true });
  return p.isCancel(result) ? false : Boolean(result);
}
