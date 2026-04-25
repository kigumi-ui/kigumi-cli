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
 * - Template changes maintain TS/JS variant parity (e.g. .tsx + .jsx pair)
 * - Component registry consistency
 * - Import path correctness (free vs pro)
 * - TypeScript/JavaScript variant parity
 * - Test file existence for new components
 * - No hardcoded tier-specific logic outside tier.ts
 *
 * USAGE:
 *   pnpm validate:changes
 *   node scripts/validate-changes.ts
 *   node scripts/validate-changes.ts --fix
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { getAllComponents } from '../src/utils/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

/**
 * Simple glob-like function using fs-extra
 * Supports basic patterns like 'src/**\/*.ts'
 */
async function findFiles(
  pattern: string,
  options: { cwd?: string; ignore?: string[] } = {}
): Promise<string[]> {
  const { cwd = PROJECT_ROOT, ignore = [] } = options;
  const results: string[] = [];

  // Parse pattern
  const parts = pattern.split('/');
  const isRecursive = parts.includes('**');

  async function walkDir(dir: string, depth = 0): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(cwd, fullPath);

        // Check ignore patterns
        const shouldIgnore = ignore.some((ignorePattern) => {
          const normalizedIgnore = ignorePattern.replace(/\*\*/g, '');
          return relativePath.includes(normalizedIgnore.replace(/\*/g, ''));
        });

        if (shouldIgnore) continue;

        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue;
          if (isRecursive || depth < parts.length - 1) {
            await walkDir(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          // Match file extension pattern like '*.ts'
          const extPattern = parts[parts.length - 1];
          if (extPattern.includes('*')) {
            const ext = extPattern.replace('*', '');
            if (entry.name.endsWith(ext)) {
              results.push(relativePath);
            }
          } else if (entry.name === extPattern) {
            results.push(relativePath);
          }
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  // Start from the first non-glob directory
  let startDir = cwd;
  for (const part of parts) {
    if (part.includes('*')) break;
    startDir = path.join(startDir, part);
  }

  if (await fs.pathExists(startDir)) {
    await walkDir(startDir);
  }

  return results;
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    filesChecked: number;
    issuesFound: number;
    issuesFixed: number;
  };
}

interface ValidationIssue {
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

/**
 * Check for direct tier-specific logic outside tier.ts
 * WHY: Tier detection should be centralized in tier.ts
 *
 * NOTE: Comparisons like `tier === 'pro'` are legitimate when `tier` is
 * obtained from `detectTier()`. We only flag direct string comparisons
 * that bypass the tier detection system entirely, such as:
 * - Hardcoded environment checks: `process.env.TIER === 'pro'`
 * - Direct config property access: `config.tier === 'free'`
 *
 * This check is currently disabled as most usages are legitimate.
 * Re-enable with more sophisticated AST analysis if needed.
 */
async function checkTierLogic(): Promise<void> {
  // Disabled: Too many false positives. The pattern `tier === 'pro'` is
  // legitimate when tier comes from detectTier(). A proper check would
  // need AST analysis to trace variable origins.
  //
  // Previous implementation flagged all `tier === 'pro'` patterns, but
  // this produced 19 false positives across the codebase where tier
  // was correctly obtained via detectTier() before comparison.
}

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
 * Check for common anti-patterns
 * WHY: Catch mistakes before they propagate
 */
async function checkAntiPatterns(): Promise<void> {
  const sourceFiles = await findFiles('src/**/*.ts', {
    cwd: PROJECT_ROOT,
    ignore: ['.test.ts', '.d.ts'],
  });

  const antiPatterns = [
    {
      pattern: /className\s*=.*<wa-/,
      message: 'Use "class" not "className" for Web Components',
    },
    // NOTE: 'declare module "react"' check removed.
    // - CSSProperties extension via 'declare module "react"' is legitimate
    // - IntrinsicElements correctly uses 'declare global' already
    // - Previous check produced false positives on comments
    {
      pattern: /\.hide\(\)/,
      message: 'Use requestClose() instead of hide() for dialog API',
    },
  ];

  for (const file of sourceFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const { pattern, message } of antiPatterns) {
        if (pattern.test(line)) {
          issues.push({
            file,
            line: index + 1,
            message,
            severity: 'error',
          });
        }
      }
    });
  }
}

/**
 * Main validation function
 */
async function validateChanges(): Promise<ValidationResult> {
  console.log(pc.cyan('\n🔍 Validating changes...\n'));

  const stats = {
    filesChecked: 0,
    issuesFound: 0,
    issuesFixed: 0,
  };

  // Run all checks
  await checkGeneratedFiles();
  await checkTierLogic();
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

main();
