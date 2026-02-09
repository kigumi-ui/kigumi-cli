/**
 * Doctor Command
 *
 * PURPOSE: Diagnose and fix common issues in a Kigumi project.
 *
 * WHAT IT DOES:
 * - Detects project tier (Pro/Free) from package.json
 * - Scans all component files for incorrect import paths
 * - Fixes import paths to match the installed package
 * - Reports what was fixed
 *
 * @see AGENTS.md for doctor command architecture
 */

import fs from 'fs-extra';
import path from 'path';
import {
  FREE_PACKAGE_REGEX,
  PRO_PACKAGE_REGEX,
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../constants.js';
import { detectTier, getWebAwesomePackage } from '../utils/tier.js';
import { loadConfig } from '../utils/config.js';
import { getOutput } from '../output/index.js';
import type { OutputInterface } from '../output/types.js';

interface DoctorOptions {
  dryRun?: boolean;
  cwd?: string;
}

interface DiagnosticResult {
  filePath: string;
  relativePath: string;
  issue: string;
  fixed: boolean;
}

/**
 * Find all component files in the components directory
 */
async function findComponentFiles(
  cwd: string,
  componentsDir: string
): Promise<string[]> {
  const extensions = ['.tsx', '.jsx', '.ts', '.js', '.vue'];
  const files: string[] = [];
  const targetDir = path.join(cwd, componentsDir);

  if (!(await fs.pathExists(targetDir))) {
    return files;
  }

  async function scan(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        if (extensions.some((ext) => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
  }

  await scan(targetDir);
  return files;
}

/**
 * Diagnose and fix import path issues
 */
async function diagnoseAndFix(
  cwd: string,
  options: DoctorOptions,
  output: OutputInterface
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Detect project tier
  const tier = await detectTier(cwd);
  const expectedPackage = getWebAwesomePackage(tier);

  // Determine wrong package pattern
  const wrongPackageRegex =
    tier === 'pro' ? FREE_PACKAGE_REGEX : PRO_PACKAGE_REGEX;
  const wrongPackageName =
    tier === 'pro' ? WEB_AWESOME_FREE_PACKAGE : WEB_AWESOME_PRO_PACKAGE;

  output.info(
    `Detected tier: ${tier.toUpperCase()} (expected package: ${expectedPackage})`
  );

  // Load config to get components directory
  const config = loadConfig(cwd);

  if (!config) {
    output.warning('No kigumi.config.json found. Run `kigumi init` first.');
    return results;
  }

  // Find all component files
  const files = await findComponentFiles(cwd, config.componentsDir);

  if (files.length === 0) {
    output.warning('No component files found');
    return results;
  }

  output.info(`Scanning ${files.length} component file(s)...`);

  // Check each file
  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(cwd, filePath);

    if (wrongPackageRegex.test(content)) {
      const result: DiagnosticResult = {
        filePath,
        relativePath,
        issue: `Imports from ${wrongPackageName} instead of ${expectedPackage}`,
        fixed: false,
      };

      if (!options.dryRun) {
        // Fix the import path
        const fixed = content.replace(wrongPackageRegex, expectedPackage);
        await fs.writeFile(filePath, fixed);
        result.fixed = true;
      }

      results.push(result);
    }
  }

  return results;
}

/**
 * Doctor command handler
 */
export async function doctorCommand(
  options: DoctorOptions = {}
): Promise<void> {
  const cwd = options.cwd || process.cwd();
  const output = getOutput();

  output.intro('kigumi doctor');

  try {
    // Run diagnostics
    const results = await diagnoseAndFix(cwd, options, output);

    if (results.length === 0) {
      output.success('No issues found! Your project is healthy.');
      output.outro('All done!');
      return;
    }

    // Report issues
    if (options.dryRun) {
      output.warning(`Found ${results.length} issue(s):`);
      for (const result of results) {
        output.log(`  × ${result.relativePath}`);
        output.log(`    ${result.issue}`);
      }
      output.note(
        'Dry run mode',
        'Run without --dry-run to fix these issues automatically'
      );
    } else {
      output.success(`Fixed ${results.length} issue(s):`);
      for (const result of results) {
        output.log(`  ✓ ${result.relativePath}`);
        output.log(`    ${result.issue}`);
      }
      output.note(
        'Import paths updated',
        'All component imports now match your installed Web Awesome package'
      );
    }

    output.outro('Done!');
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'An unknown error occurred'
    );
    process.exit(1);
  }
}
