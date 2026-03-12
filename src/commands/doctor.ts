/**
 * Doctor Command
 *
 * PURPOSE: Diagnose and fix common issues in a Kigumi project.
 *
 * WHAT IT DOES:
 * - Detects project tier (Pro/Free) from package.json
 * - Scans all component files for incorrect import paths
 * - Fixes import paths to match the installed package
 * - Checks Web Awesome version alignment (config + package.json)
 * - Reports what was fixed
 *
 * @see AGENTS.md for doctor command architecture
 */

import fs from 'fs-extra';
import path from 'path';
import {
  CONFIG_FILE_NAME,
  DEFAULT_WEBAWESOME_VERSION,
  FREE_PACKAGE_REGEX,
  PRO_PACKAGE_REGEX,
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../constants.js';
import { detectTier, getWebAwesomePackage } from '../utils/tier.js';
import { loadConfig } from '../utils/config.js';
import { getOutput } from '../output/index.js';
import type { OutputInterface } from '../output/types.js';
import { handleError } from '../errors/index.js';

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
 * Check Web Awesome version alignment between config, package.json, and CLI target
 */
async function checkVersionAlignment(
  cwd: string,
  options: DoctorOptions,
  output: OutputInterface
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Check config version staleness
  const configPath = path.join(cwd, CONFIG_FILE_NAME);
  if (await fs.pathExists(configPath)) {
    const configData = await fs.readJSON(configPath);
    const configVersion = configData?.webAwesome?.version;

    if (configVersion && configVersion !== DEFAULT_WEBAWESOME_VERSION) {
      const result: DiagnosticResult = {
        filePath: configPath,
        relativePath: CONFIG_FILE_NAME,
        issue: `Config Web Awesome version "${configVersion}" is outdated (CLI targets "${DEFAULT_WEBAWESOME_VERSION}")`,
        fixed: false,
      };

      if (!options.dryRun) {
        configData.webAwesome.version = DEFAULT_WEBAWESOME_VERSION;
        await fs.writeJSON(configPath, configData, { spaces: 2 });
        result.fixed = true;
      }

      results.push(result);
    }
  }

  // Check installed package version staleness
  const packageJsonPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJSON(packageJsonPath);
    const deps = packageJson.dependencies || {};
    const installedVersion =
      deps[WEB_AWESOME_PRO_PACKAGE] || deps[WEB_AWESOME_FREE_PACKAGE];

    if (installedVersion && installedVersion !== DEFAULT_WEBAWESOME_VERSION) {
      const installedPackage = deps[WEB_AWESOME_PRO_PACKAGE]
        ? WEB_AWESOME_PRO_PACKAGE
        : WEB_AWESOME_FREE_PACKAGE;

      results.push({
        filePath: packageJsonPath,
        relativePath: 'package.json',
        issue: `Installed Web Awesome version "${installedVersion}" differs from CLI target "${DEFAULT_WEBAWESOME_VERSION}"`,
        fixed: false, // Never auto-fix — user must run npm install
      });

      output.warning(
        `To update, run: npm install ${installedPackage}@${DEFAULT_WEBAWESOME_VERSION}`
      );
      output.warning(
        'Then regenerate components: npx kigumi add --all --overwrite'
      );
    }
  }

  return results;
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

  // Check version alignment
  const versionResults = await checkVersionAlignment(cwd, options, output);
  results.push(...versionResults);

  // Find all component files
  const files = await findComponentFiles(cwd, config.componentsDir);

  if (files.length === 0) {
    output.warning('No component files found');
    return results;
  }

  output.info(`Scanning ${files.length} component file(s)...`);

  // Check each file for import path issues
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
      const fixedCount = results.filter((r) => r.fixed).length;
      const unfixedCount = results.length - fixedCount;

      if (fixedCount > 0) {
        output.success(`Fixed ${fixedCount} issue(s):`);
        for (const result of results.filter((r) => r.fixed)) {
          output.log(`  ✓ ${result.relativePath}`);
          output.log(`    ${result.issue}`);
        }
      }

      if (unfixedCount > 0) {
        output.warning(`${unfixedCount} issue(s) require manual action:`);
        for (const result of results.filter((r) => !r.fixed)) {
          output.log(`  × ${result.relativePath}`);
          output.log(`    ${result.issue}`);
        }
      }

      if (fixedCount > 0) {
        output.note(
          'Issues resolved',
          'Some issues were fixed automatically. Review the changes above.'
        );
      }
    }

    output.outro('Done!');
  } catch (error) {
    handleError(error, output);
  }
}
