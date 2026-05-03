/**
 * Doctor Command
 *
 * PURPOSE: Diagnose and fix common issues in a Kigumi project.
 *
 * WHAT IT DOES:
 * - Detects project tier (Pro/Free) from package.json
 * - Scans all component files for incorrect import paths
 * - Scans the styles directory (layers.css etc.) for stale Web Awesome
 *   package references, surgically rewriting only the @import lines
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
  FREE_PACKAGE_PATTERN,
  PRO_PACKAGE_REGEX,
  PRO_PACKAGE_PATTERN,
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../constants.js';
import { detectTier, getWebAwesomePackage } from '../utils/tier.js';
import { surgicalRewriteLayersCss } from '../utils/regenerate.js';
import { getConfig } from '../utils/config.js';
import { getOutput } from '../output/index.js';
import type { OutputInterface } from '../output/types.js';
import {
  handleError,
  LayersCssRewriteError,
  ConfigNotFoundError,
} from '../errors/index.js';
import type { KigumiConfig } from '../schemas/config.js';

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
 * Find all CSS files in the styles directory
 *
 * Used by the layers.css scan to detect stale Web Awesome package
 * references that would otherwise cause vite to fail with ENOENT.
 */
async function findStylesFiles(
  cwd: string,
  stylesDir: string
): Promise<string[]> {
  const extensions = ['.css', '.scss'];
  const files: string[] = [];
  const targetDir = path.join(cwd, stylesDir);

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
        'Then regenerate components: npx kigumi add --all --force'
      );
    }
  }

  return results;
}

/**
 * Diagnose and fix stale Web Awesome package references in layers.css
 * and any other CSS file under the configured stylesDir.
 *
 * Uses the surgical rewrite helper so user customizations (custom
 * @layer declarations, comments, theme.css imports) are preserved.
 * If a file has been restructured beyond recognition, the error is
 * recorded with `fixed: false` so the doctor output makes it clear
 * the user needs to fix it manually.
 *
 * Reuses the same `wrongPackageRegex` logic as the component scan to
 * detect whether a file needs migration in the first place; the actual
 * rewrite delegates to `surgicalRewriteLayersCss` for layers.css and
 * a straight regex replace for any other CSS file.
 */
async function diagnoseAndFixLayersCss(
  cwd: string,
  config: KigumiConfig,
  tier: 'free' | 'pro',
  options: DoctorOptions,
  output: OutputInterface
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  const expectedPackage = getWebAwesomePackage(tier);
  const wrongPackagePattern =
    tier === 'pro' ? FREE_PACKAGE_PATTERN : PRO_PACKAGE_PATTERN;
  const wrongPackageRegex =
    tier === 'pro' ? FREE_PACKAGE_REGEX : PRO_PACKAGE_REGEX;
  const wrongPackageName =
    tier === 'pro' ? WEB_AWESOME_FREE_PACKAGE : WEB_AWESOME_PRO_PACKAGE;

  const stylesFiles = await findStylesFiles(cwd, config.stylesDir);
  if (stylesFiles.length === 0) {
    return results;
  }

  output.info(`Scanning ${stylesFiles.length} styles file(s)...`);

  for (const filePath of stylesFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(cwd, filePath);

    if (!wrongPackagePattern.test(content)) {
      continue;
    }

    const result: DiagnosticResult = {
      filePath,
      relativePath,
      issue: `Imports from ${wrongPackageName} instead of ${expectedPackage}`,
      fixed: false,
    };

    if (options.dryRun) {
      results.push(result);
      continue;
    }

    // For layers.css, use the surgical rewrite so user customizations
    // (custom @layer declarations, comments, theme.css imports) survive.
    // For any other CSS file under stylesDir, fall back to the same
    // blanket regex replace used for component files.
    if (path.basename(filePath) === 'layers.css') {
      try {
        const rewriteResult = await surgicalRewriteLayersCss(
          filePath,
          expectedPackage,
          config.theme.selected
        );
        if (!rewriteResult.changed) {
          // The broad pattern matched (e.g., package name in a comment) but
          // the surgical rewrite found all @imports already correct. Skip.
          continue;
        }
        result.fixed = true;
      } catch (error) {
        if (error instanceof LayersCssRewriteError) {
          // Report the actionable error but don't halt the whole doctor run
          output.error(error.format(), error);
          const suggestions = error.formatSuggestions();
          if (suggestions) {
            output.note('How to fix', suggestions);
          }
          result.issue = `${result.issue} (cannot rewrite automatically: see message above)`;
        } else {
          throw error;
        }
      }
    } else {
      const fixed = content.replace(wrongPackageRegex, expectedPackage);
      await fs.writeFile(filePath, fixed);
      result.fixed = true;
    }

    results.push(result);
  }

  return results;
}

/**
 * Detect `src/types/web-awesome.d.ts` left over from older Kigumi versions.
 *
 * The file used to be written by the `add` command with hand-rolled
 * `IntrinsicElements` entries. It is now redundant: `vite-env.d.ts` imports
 * the official Web Awesome `CustomElements` types, which cover every `wa-*`
 * element with full prop, event, and ref typing. Keeping the old file
 * around causes TypeScript to merge two incompatible shapes for the same
 * JSX tag.
 *
 * Advisory-only — the file may contain hand edits, so we never auto-delete.
 */
export async function diagnoseObsoleteTypeDecls(
  cwd: string,
  config: KigumiConfig
): Promise<DiagnosticResult[]> {
  if (config.framework !== 'react' || !config.typescript) {
    return [];
  }

  const obsoletePath = path.join(cwd, 'src', 'types', 'web-awesome.d.ts');
  if (!(await fs.pathExists(obsoletePath))) {
    return [];
  }

  return [
    {
      filePath: obsoletePath,
      relativePath: path.relative(cwd, obsoletePath),
      issue:
        'Obsolete type declarations file. Kigumi no longer generates src/types/web-awesome.d.ts — official Web Awesome types now cover all wa-* elements via src/vite-env.d.ts. Delete this file (and the src/types/ directory if empty) unless you have hand edits to preserve.',
      fixed: false,
    },
  ];
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

  // Determine wrong package pattern (non-global for .test(), global for .replace())
  const wrongPackagePattern =
    tier === 'pro' ? FREE_PACKAGE_PATTERN : PRO_PACKAGE_PATTERN;
  const wrongPackageRegex =
    tier === 'pro' ? FREE_PACKAGE_REGEX : PRO_PACKAGE_REGEX;
  const wrongPackageName =
    tier === 'pro' ? WEB_AWESOME_FREE_PACKAGE : WEB_AWESOME_PRO_PACKAGE;

  output.info(
    `Detected tier: ${tier.toUpperCase()} (expected package: ${expectedPackage})`
  );

  // Load config to get components directory.
  // Doctor preserves "warn and return" semantics on ConfigNotFoundError so a
  // user with no kigumi.config.json still gets a friendly message instead of
  // a thrown error. ConfigInvalidError still propagates so typo defenses work.
  let config: KigumiConfig;
  try {
    config = getConfig(cwd);
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      output.warning('No kigumi.config.json found. Run `kigumi init` first.');
      return results;
    }
    throw error;
  }

  // Check version alignment
  const versionResults = await checkVersionAlignment(cwd, options, output);
  results.push(...versionResults);

  // Find all component files
  const files = await findComponentFiles(cwd, config.componentsDir);

  if (files.length === 0) {
    output.warning('No component files found');
  } else {
    output.info(`Scanning ${files.length} component file(s)...`);

    // Check each file for import path issues
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(cwd, filePath);

      if (wrongPackagePattern.test(content)) {
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
  }

  // Scan styles directory (layers.css etc.) for stale package references.
  // This is the recovery path for projects broken by the pre-fix tier switch.
  const stylesResults = await diagnoseAndFixLayersCss(
    cwd,
    config,
    tier,
    options,
    output
  );
  results.push(...stylesResults);

  // Flag obsolete web-awesome.d.ts from older Kigumi versions.
  const obsoleteTypeResults = await diagnoseObsoleteTypeDecls(cwd, config);
  results.push(...obsoleteTypeResults);

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
