/**
 * Upgrade Command
 *
 * PURPOSE: Shows an upgrade guide when the project's pinned kigumiVersion
 * differs from the running CLI version. Updates config to pin the new version.
 *
 * Phase 1: Display-only upgrade guide with breaking changes and affected components.
 * Phase 2 (future): Automatic codemods via --apply flag.
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

interface UpgradeOptions {
  cwd?: string;
  dryRun?: boolean;
  yes?: boolean;
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

    // 8. Show recommended actions
    output.info('');
    output.info(pc.bold('Recommended actions:'));
    if (toEntry && fromEntry?.webAwesomeVersion !== toEntry.webAwesomeVersion) {
      output.info(
        `  1. Update Web Awesome: npm install @awesome.me/webawesome@${toEntry.webAwesomeVersion}`
      );
      output.info(
        '  2. Regenerate affected components: npx kigumi add <component> --overwrite'
      );
      output.info('  3. Update project version (this command)');
    } else {
      output.info(
        '  1. Regenerate affected components: npx kigumi add <component> --overwrite'
      );
      output.info('  2. Update project version (this command)');
    }

    // 9. Update config version
    if (options.dryRun) {
      output.info('');
      output.info(
        `Dry run: would update kigumiVersion from ${projectVersion} to ${CLI_VERSION}`
      );
      output.outro('Dry run complete');
      return;
    }

    output.info('');
    const shouldUpgrade = options.yes
      ? true
      : await promptConfirm(`Update kigumiVersion to ${CLI_VERSION}?`);

    if (shouldUpgrade) {
      config.kigumiVersion = CLI_VERSION;
      if (toEntry) {
        config.webAwesome = config.webAwesome || {};
        config.webAwesome.version = toEntry.webAwesomeVersion;
      }
      await saveConfig(config, cwd);
      output.success(`Updated kigumiVersion to ${CLI_VERSION}`);

      output.info('');
      output.note(
        'Next steps',
        'Component files are not automatically regenerated.\n' +
          'Run "npx kigumi add <component> --overwrite" to update specific components.'
      );
    }

    output.outro('Upgrade guide complete');
  } catch (error) {
    handleError(error, output);
  }
}

async function promptConfirm(message: string): Promise<boolean> {
  const result = await p.confirm({ message, initialValue: true });
  return p.isCancel(result) ? false : Boolean(result);
}
