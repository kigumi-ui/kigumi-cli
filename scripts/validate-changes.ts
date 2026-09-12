#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Validate Changes Script - AI Guard Rails
 *
 * PURPOSE:
 * - Prevent common mistakes in AI-generated code
 * - Enforce project conventions and best practices
 * - Catch regressions before they reach production
 *
 * CHECKS:
 * - Generated files carry no manual-edit markers
 * - Import path correctness (no mixed free/pro imports in one file)
 * - Template TS/JS variant parity (e.g. .tsx + .jsx pair)
 * - Anti-patterns (see ANTI_PATTERNS)
 *
 * USAGE:
 *   pnpm validate:changes
 *   node scripts/validate-changes.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { glob } from 'tinyglobby';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { getAllComponents } from '../src/utils/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

/**
 * Find files matching a glob pattern.
 *
 * Delegates to tinyglobby rather than walking the tree by hand. The previous
 * implementation compared ignore patterns with `String.includes()` after
 * stripping `*`, so an ignore of `.d.ts` also hid any file under a directory
 * named `my.d.ts-helpers/`. That is a false negative: the validator reports a
 * pass having never read the file.
 *
 * `ignore` entries are globs, not substrings. To skip a suffix, pass
 * `'**\/*.test.ts'`, not `'.test.ts'`.
 */
export async function findFiles(
  pattern: string,
  options: { cwd?: string; ignore?: string[] } = {}
): Promise<string[]> {
  const { cwd = PROJECT_ROOT, ignore = [] } = options;

  return glob(pattern, {
    cwd,
    ignore: ['**/node_modules/**', '**/.git/**', ...ignore],
    dot: true,
    onlyFiles: true,
  });
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    filesChecked: number;
    issuesFound: number;
    issuesFixed: number;
  };
}

export interface ValidationIssue {
  file: string;
  line?: number;
  message: string;
  severity: 'error' | 'warning';
  fixable?: boolean;
}

const issues: ValidationIssue[] = [];

/**
 * Check for generated files with modifications
 * WHY: Generated files should not be edited directly
 */
async function checkGeneratedFiles(): Promise<void> {
  const generatedFiles = [
    'src/lib/kigumi.ts',
    'src/styles/layers.css',
    'src/vite-env.d.ts',
  ];

  for (const file of generatedFiles) {
    const filePath = path.join(PROJECT_ROOT, file);

    if (!(await fs.pathExists(filePath))) continue;

    const content = await fs.readFile(filePath, 'utf-8');

    // Check for manual modifications (simple heuristic)
    if (
      content.includes('// MANUAL EDIT') ||
      content.includes('/* MANUAL EDIT */')
    ) {
      issues.push({
        file,
        message:
          'Generated file contains manual edit markers. Use CLI commands instead.',
        severity: 'error',
      });
    }
  }
}

// NOTE: checkTierLogic() was removed. It was an empty function body that still
// ran on every invocation and still appeared in the CHECKS list above, reading
// as coverage that did not exist. The original implementation flagged every
// `tier === 'pro'` comparison and produced 19 false positives, because that
// comparison is correct when `tier` came from detectTier(). Enforcing "tier is
// never stored in config" needs type-level or schema-level enforcement, not
// string matching over source.

/**
 * Check for incorrect import paths (mixing free/pro packages)
 * WHY: Component imports must match project tier
 */
async function checkImportPaths(): Promise<void> {
  // Check TypeScript and JavaScript files in src/components
  const tsFiles = await findFiles('src/components/**/*.ts', {
    cwd: PROJECT_ROOT,
  });
  const tsxFiles = await findFiles('src/components/**/*.tsx', {
    cwd: PROJECT_ROOT,
  });
  const jsFiles = await findFiles('src/components/**/*.js', {
    cwd: PROJECT_ROOT,
  });
  const jsxFiles = await findFiles('src/components/**/*.jsx', {
    cwd: PROJECT_ROOT,
  });
  const componentFiles = [...tsFiles, ...tsxFiles, ...jsFiles, ...jsxFiles];

  for (const file of componentFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check for mixed free/pro imports (both packages in same file)
    // Regex uses negative lookahead to match '@awesome.me/webawesome' NOT followed by '-pro'
    const hasFreeImport = /@awesome\.me\/webawesome(?!-pro)/.test(content);
    const hasProImport = content.includes('@awesome.me/webawesome-pro');

    if (hasFreeImport && hasProImport) {
      // Find the first line with a web awesome import for error reporting
      const importLineIndex = lines.findIndex((line) =>
        line.includes('@awesome.me/webawesome')
      );

      issues.push({
        file,
        line: importLineIndex !== -1 ? importLineIndex + 1 : undefined,
        message: 'Mixed free/pro imports detected. Use doctor command to fix.',
        severity: 'error',
        fixable: true,
      });
    }
  }
}

/**
 * Check template parity (TS/JS variants must exist for both React and Vue)
 * WHY: Ensures feature parity across all supported configurations
 */
async function checkTemplateParity(): Promise<void> {
  const components = getAllComponents();

  for (const [_key, component] of Object.entries(components)) {
    const frameworks = ['react', 'vue'] as const;

    for (const framework of frameworks) {
      const templateDir = path.join(
        PROJECT_ROOT,
        'templates',
        framework,
        component.name
      );

      if (!(await fs.pathExists(templateDir))) {
        continue; // Already caught by validate-templates.ts
      }

      // Check for TS/JS parity
      const requiredVariants =
        framework === 'react'
          ? [
              `${component.name}.tsx`,
              `${component.name}.jsx`,
              `${component.name}.test.tsx`,
              `${component.name}.test.jsx`,
            ]
          : [
              `${component.name}.vue`,
              `${component.name}.js.vue`,
              `${component.name}.test.ts`,
              `${component.name}.test.js`,
            ];

      for (const variant of requiredVariants) {
        const variantPath = path.join(templateDir, variant);
        if (!(await fs.pathExists(variantPath))) {
          issues.push({
            file: `templates/${framework}/${component.name}/${variant}`,
            message: 'Missing template variant (TS/JS parity required)',
            severity: 'error',
          });
        }
      }
    }
  }
}

/**
 * Anti-patterns scanned by {@link scanAntiPatterns}.
 *
 * NOTE: 'declare module "react"' check removed.
 * - CSSProperties extension via 'declare module "react"' is legitimate
 * - IntrinsicElements correctly uses 'declare global' already
 * - Previous check produced false positives on comments
 *
 * NOTE: the `class` vs `className` check was removed deliberately. A
 * line-based regex cannot see multi-line JSX, which is where the real risk
 * lives (templates/ carries hundreds of legitimate `className` uses on plain
 * HTML elements). The previous pattern was also written backwards and matched
 * nothing for months. Replacing it needs an AST rule, not another regex.
 * Do not re-add a regex here.
 */
const ANTI_PATTERNS: ReadonlyArray<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\.hide\(\)/,
    message: 'Use requestClose() instead of hide() for dialog API',
  },
];

/**
 * Scan a single file's contents for anti-patterns.
 *
 * WHY this is a separate pure function: the regexes are the part that can
 * silently stop matching. Keeping them out of the filesystem walk makes them
 * directly unit-testable with literal strings, so a broken pattern fails a
 * test instead of quietly reporting green.
 */
export function scanAntiPatterns(
  content: string,
  file: string
): ValidationIssue[] {
  const found: ValidationIssue[] = [];

  content.split('\n').forEach((line, index) => {
    for (const { pattern, message } of ANTI_PATTERNS) {
      if (pattern.test(line)) {
        found.push({ file, line: index + 1, message, severity: 'error' });
      }
    }
  });

  return found;
}

/**
 * Check for common anti-patterns
 * WHY: Catch mistakes before they propagate
 */
async function checkAntiPatterns(): Promise<void> {
  const sourceFiles = [
    ...(await findFiles('src/**/*.ts', {
      cwd: PROJECT_ROOT,
      ignore: ['**/*.test.ts', '**/*.d.ts'],
    })),
    ...(await findFiles('src/**/*.tsx', {
      cwd: PROJECT_ROOT,
      ignore: ['**/*.test.tsx'],
    })),
  ];

  for (const file of sourceFiles) {
    const content = await fs.readFile(path.join(PROJECT_ROOT, file), 'utf-8');
    issues.push(...scanAntiPatterns(content, file));
  }
}

/**
 * Main validation function
 */
export async function validateChanges(): Promise<ValidationResult> {
  console.log(pc.cyan('\n🔍 Validating changes...\n'));

  const stats = {
    filesChecked: 0,
    issuesFound: 0,
    issuesFixed: 0,
  };

  // Run all checks
  await checkGeneratedFiles();
  await checkImportPaths();
  await checkTemplateParity();
  await checkAntiPatterns();

  // Categorize issues
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  stats.issuesFound = issues.length;

  const result: ValidationResult = {
    passed: errors.length === 0,
    errors: errors.map(
      (i) => `${i.file}${i.line ? `:${i.line}` : ''}: ${i.message}`
    ),
    warnings: warnings.map(
      (i) => `${i.file}${i.line ? `:${i.line}` : ''}: ${i.message}`
    ),
    stats,
  };

  return result;
}

/**
 * Print validation results
 */
function printResults(result: ValidationResult): void {
  console.log(pc.bold('Statistics:'));
  console.log(`  Issues found: ${result.stats.issuesFound}`);
  console.log('');

  if (result.warnings.length > 0) {
    console.log(pc.yellow('⚠️  Warnings:'));
    for (const warning of result.warnings) {
      console.log(pc.yellow(`  • ${warning}`));
    }
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log(pc.red('❌ Errors:'));
    // Show first 20 errors
    const displayErrors = result.errors.slice(0, 20);
    for (const error of displayErrors) {
      console.log(pc.red(`  • ${error}`));
    }

    if (result.errors.length > 20) {
      console.log(pc.red(`  ... and ${result.errors.length - 20} more errors`));
    }
    console.log('');
  }

  if (result.passed) {
    console.log(pc.green('✅ Validation passed!\n'));
  } else {
    console.log(
      pc.red(`❌ Validation failed with ${result.errors.length} error(s)\n`)
    );

    // Provide helpful fix suggestions
    const fixableIssues = issues.filter((i) => i.fixable);
    if (fixableIssues.length > 0) {
      console.log(pc.yellow('💡 Fixable issues detected. Run these commands:'));
      console.log(pc.yellow('  • pnpm run doctor (fix import paths)'));
      console.log('');
    }
  }
}

/**
 * Run validation
 */
async function main() {
  try {
    const result = await validateChanges();
    printResults(result);

    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
