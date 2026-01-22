/**
 * Migration Utility
 *
 * Handles Free ↔ Pro package migration
 */

import fs from 'fs-extra';
import path from 'path';
import type { OutputInterface } from '../../output/types.js';

/**
 * Recursively find all files matching patterns in a directory
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
 * Migrate package references from Free to Pro
 *
 * Replaces @awesome.me/webawesome → @awesome.me/webawesome-pro
 * in ALL generated files (including component files)
 */
export async function migratePackageReferences(
  cwd: string,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Migrating package references...');

  try {
    // Static files to migrate
    const staticFiles = [
      'src/lib/webawesome.ts',
      'src/lib/webawesome.js',
      'src/styles/theme.css',
      'src/types/web-awesome.d.ts',
      'src/vite-env.d.ts',
    ];

    // Find all component files (Bug #1 fix)
    const componentsDir = path.join(cwd, 'src/components/ui');
    const componentFiles = await findFiles(componentsDir, [
      '.tsx',
      '.jsx',
      '.ts',
      '.js',
    ]);

    // Combine all files to migrate
    const allFiles = [
      ...staticFiles.map((f) => path.join(cwd, f)),
      ...componentFiles,
    ];

    let migratedCount = 0;

    for (const filePath of allFiles) {
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
        const relativePath = path.relative(cwd, filePath);
        output.log(`[DEBUG] Migrated: ${relativePath}`);
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
 * Reverse migrate package references from Pro to Free (Bug #2 fix)
 *
 * Replaces @awesome.me/webawesome-pro → @awesome.me/webawesome
 * in ALL generated files (including component files)
 */
export async function reverseMigratePackageReferences(
  cwd: string,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Reverse migrating package references...');

  try {
    // Static files to migrate
    const staticFiles = [
      'src/lib/webawesome.ts',
      'src/lib/webawesome.js',
      'src/styles/theme.css',
      'src/types/web-awesome.d.ts',
      'src/vite-env.d.ts',
    ];

    // Find all component files
    const componentsDir = path.join(cwd, 'src/components/ui');
    const componentFiles = await findFiles(componentsDir, [
      '.tsx',
      '.jsx',
      '.ts',
      '.js',
    ]);

    // Combine all files to migrate
    const allFiles = [
      ...staticFiles.map((f) => path.join(cwd, f)),
      ...componentFiles,
    ];

    let migratedCount = 0;

    for (const filePath of allFiles) {
      if (!(await fs.pathExists(filePath))) {
        continue;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const newContent = content.replace(
        /@awesome\.me\/webawesome-pro/g,
        '@awesome.me/webawesome'
      );

      if (newContent !== content) {
        await fs.writeFile(filePath, newContent);
        migratedCount++;
        const relativePath = path.relative(cwd, filePath);
        output.log(`[DEBUG] Reverse migrated: ${relativePath}`);
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
