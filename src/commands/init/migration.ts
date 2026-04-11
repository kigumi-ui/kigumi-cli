/**
 * Migration Utility
 *
 * PURPOSE: Handles Free <-> Pro package migration for tier upgrades/downgrades.
 *
 * WHY: When users upgrade from Free to Pro (or downgrade), all import statements
 * need to change from @awesome.me/webawesome to @awesome.me/webawesome-pro (or vice versa).
 * This includes generated files and user components.
 *
 * For most files the migration is a simple regex substitution. `layers.css`
 * is a special case: its @import statements can coexist with user-authored
 * cascade layers and comments, so we use the surgical rewrite helper in
 * `src/utils/regenerate.ts` that targets only the Web Awesome @import lines.
 *
 * @see AGENTS.md Rule #11 for Free->Pro migration
 * @see AGENTS.md Rule #12 for tier migration architecture
 */

import fs from 'fs-extra';
import path from 'path';
import {
  FREE_PACKAGE_REGEX,
  PRO_PACKAGE_REGEX,
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../constants.js';
import type { OutputInterface } from '../../output/types.js';
import type { KigumiConfig } from '../../schemas/config.js';
import { surgicalRewriteLayersCss } from '../../utils/regenerate.js';
import { LayersCssRewriteError } from '../../errors/layers-css.js';

/** File extensions to scan for migration in components directory */
const COMPONENT_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js', '.vue'];

/**
 * Resolve the list of static project files that always need migration
 * when switching tier.
 *
 * Reads paths from the user's config so projects with custom `utilsDir`
 * or `stylesDir` values (or a custom `componentsDir` which is handled
 * separately below) are all covered. The previous implementation used
 * hardcoded default paths and silently skipped migration for customized
 * projects.
 *
 * @internal
 */
function getStaticMigrationFiles(cwd: string, config: KigumiConfig): string[] {
  const utilsDir = config.utilsDir || 'src/lib';
  const stylesDir = config.stylesDir || 'src/styles';

  return [
    path.join(cwd, utilsDir, 'kigumi.ts'),
    path.join(cwd, utilsDir, 'kigumi.js'),
    path.join(cwd, stylesDir, 'theme.css'),
    path.join(cwd, stylesDir, 'layers.css'),
    path.join(cwd, 'src/types/web-awesome.d.ts'),
    path.join(cwd, 'src/vite-env.d.ts'),
  ];
}

/**
 * Recursively find all files matching patterns in a directory
 *
 * @internal
 */
async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string): Promise<void> {
    if (!(await fs.pathExists(currentDir))) {
      return;
    }

    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        if (extensions.some((ext) => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
  }

  await scan(dir);
  return files;
}

/**
 * Get all files that need migration
 *
 * @internal
 */
async function getMigrationFiles(
  cwd: string,
  config: KigumiConfig
): Promise<string[]> {
  // Find all component files under the configured components directory
  const componentsDir = path.join(
    cwd,
    config.componentsDir || 'src/components/ui'
  );
  const componentFiles = await findFiles(componentsDir, COMPONENT_EXTENSIONS);

  // Combine static files with component files
  return [...getStaticMigrationFiles(cwd, config), ...componentFiles];
}

/**
 * Check whether a file is the cascade-layers entry point. We detect it
 * by its basename so a custom `stylesDir` path still matches.
 *
 * @internal
 */
function isLayersCss(filePath: string): boolean {
  return path.basename(filePath) === 'layers.css';
}

/**
 * Migrate a single file's package references.
 *
 * For `layers.css`, delegates to `surgicalRewriteLayersCss` which only
 * touches the Web Awesome @import lines, preserving user customizations.
 * For all other files, uses the blanket regex substitution.
 *
 * Returns `{ changed }` so the caller can increment the migration count
 * and emit the `[DEBUG] Migrated` log line.
 *
 * Throws `LayersCssRewriteError` if `layers.css` cannot be safely rewritten.
 * The caller is expected to catch and report it without aborting the rest
 * of the migration loop.
 *
 * @internal
 */
async function migrateFile(
  filePath: string,
  targetPackage: string,
  fallbackRegex: RegExp,
  themeName: string
): Promise<{ changed: boolean }> {
  if (isLayersCss(filePath)) {
    return surgicalRewriteLayersCss(filePath, targetPackage, themeName);
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const newContent = content.replace(fallbackRegex, targetPackage);

  if (newContent === content) {
    return { changed: false };
  }

  await fs.writeFile(filePath, newContent);
  return { changed: true };
}

/**
 * Migrate package references from Free to Pro
 *
 * Replaces @awesome.me/webawesome -> @awesome.me/webawesome-pro in all
 * generated files (including component files and `layers.css`).
 *
 * @param cwd - Current working directory
 * @param config - Current Kigumi configuration (provides stylesDir, utilsDir, componentsDir)
 * @param output - Output interface for logging
 */
export async function migratePackageReferences(
  cwd: string,
  config: KigumiConfig,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Migrating package references...');

  try {
    const allFiles = await getMigrationFiles(cwd, config);
    let migratedCount = 0;

    for (const filePath of allFiles) {
      if (!(await fs.pathExists(filePath))) {
        continue;
      }

      try {
        const result = await migrateFile(
          filePath,
          WEB_AWESOME_PRO_PACKAGE,
          FREE_PACKAGE_REGEX,
          config.theme.selected
        );

        if (result.changed) {
          migratedCount++;
          const relativePath = path.relative(cwd, filePath);
          output.log(`[DEBUG] Migrated: ${relativePath}`);
        }
      } catch (error) {
        if (error instanceof LayersCssRewriteError) {
          // Surface the actionable message but keep migrating other files.
          spinner.message(
            `Skipping ${path.relative(cwd, filePath)} (cannot rewrite automatically)`
          );
          output.error(error.format(), error);
          const suggestions = error.formatSuggestions();
          if (suggestions) {
            output.note('How to fix', suggestions);
          }
          continue;
        }
        throw error;
      }
    }

    spinner.stop(`Migrated ${migratedCount} file(s)`);

    if (migratedCount > 0) {
      output.success('Migration complete!');
      output.note(
        'Migrated files',
        'Package references updated from Free to Pro.\n' +
          'All generated files have been updated.'
      );
    }
  } catch (error) {
    spinner.error('Migration failed');
    throw error;
  }
}

/**
 * Reverse migrate package references from Pro to Free
 *
 * Replaces @awesome.me/webawesome-pro -> @awesome.me/webawesome in all
 * generated files (including component files and `layers.css`).
 *
 * WHY: When the user removes their Pro token and wants to downgrade, all
 * imports need to revert to the Free package.
 *
 * @param cwd - Current working directory
 * @param config - Current Kigumi configuration (provides stylesDir, utilsDir, componentsDir)
 * @param output - Output interface for logging
 */
export async function reverseMigratePackageReferences(
  cwd: string,
  config: KigumiConfig,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Reverse migrating package references...');

  try {
    const allFiles = await getMigrationFiles(cwd, config);
    let migratedCount = 0;

    for (const filePath of allFiles) {
      if (!(await fs.pathExists(filePath))) {
        continue;
      }

      try {
        const result = await migrateFile(
          filePath,
          WEB_AWESOME_FREE_PACKAGE,
          PRO_PACKAGE_REGEX,
          config.theme.selected
        );

        if (result.changed) {
          migratedCount++;
          const relativePath = path.relative(cwd, filePath);
          output.log(`[DEBUG] Reverse migrated: ${relativePath}`);
        }
      } catch (error) {
        if (error instanceof LayersCssRewriteError) {
          spinner.message(
            `Skipping ${path.relative(cwd, filePath)} (cannot rewrite automatically)`
          );
          output.error(error.format(), error);
          const suggestions = error.formatSuggestions();
          if (suggestions) {
            output.note('How to fix', suggestions);
          }
          continue;
        }
        throw error;
      }
    }

    spinner.stop(`Reverse migrated ${migratedCount} file(s)`);

    if (migratedCount > 0) {
      output.success('Reverse migration complete!');
      output.note(
        'Reverse migrated files',
        'Package references updated from Pro to Free.\n' +
          'All generated files have been updated.'
      );
    }
  } catch (error) {
    spinner.error('Reverse migration failed');
    throw error;
  }
}
