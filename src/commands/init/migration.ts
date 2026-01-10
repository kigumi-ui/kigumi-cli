/**
 * Migration Utility
 *
 * Handles Free → Pro package migration
 */

import fs from 'fs-extra';
import path from 'path';
import type { OutputInterface } from '../../output/types.js';

/**
 * Migrate package references from Free to Pro
 *
 * Replaces @awesome.me/webawesome → @awesome.me/webawesome-pro
 * in generated files only (not user components)
 */
export async function migratePackageReferences(
  cwd: string,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Migrating package references...');

  try {
    // Files to migrate (only generated files, NOT user components)
    const filesToMigrate = [
      'src/lib/webawesome.ts',
      'src/lib/webawesome.js',
      'src/styles/theme.css',
      'src/types/web-awesome.d.ts',
      'src/vite-env.d.ts',
    ];

    let migratedCount = 0;

    for (const relativePath of filesToMigrate) {
      const filePath = path.join(cwd, relativePath);

      if (!(await fs.pathExists(filePath))) {
        continue;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const newContent = content.replace(
        /@awesome\.me\/webawesome(?!-pro)/g,
        '@awesome.me/webawesome-pro'
      );

      if (newContent !== content) {
        await fs.writeFile(filePath, newContent);
        migratedCount++;
        output.log(`[DEBUG] Migrated: ${relativePath}`);
      }
    }

    spinner.stop(`Migrated ${migratedCount} file(s)`);

    if (migratedCount > 0) {
      output.success('Migration complete!');
      output.note(
        'Migrated files',
        'Package references updated from Free to Pro.\n' +
          'User components were not modified.'
      );
    }
  } catch (error) {
    spinner.error('Migration failed');
    throw error;
  }
}
