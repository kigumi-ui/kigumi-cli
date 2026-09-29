#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Template Consistency Checker
 *
 * PURPOSE: Validates that all templates are consistent and complete.
 *
 * CHECKS:
 * - Every registry component has exactly its Template files (React + Vue +
 *   Angular), as `getTemplateFileNames()` names them: TypeScript and
 *   JavaScript variants where the framework ships both, plus CSS
 * - Nothing else sits in a Template directory. `kigumi add` would never copy
 *   it, so it could only rot there; a per-Template test in particular is not
 *   the function proof, the harness is (issue #80)
 * - PascalCase naming convention is followed
 * - No template file contains an unresolved Handlebars-style token
 *   (`{{...}}`). Templates are real framework source files; any token is
 *   a regression from the contributor pipeline.
 *
 * USAGE:
 *   pnpm validate:templates
 *   node scripts/validate-templates.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { getAllComponents } from '../src/utils/registry.js';
import { getTemplateFileNames } from '../src/utils/template.js';
import { isEntryPoint } from './is-entry-point.js';

type SupportedFramework = 'react' | 'vue' | 'angular';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    reactComponents: number;
    vueComponents: number;
    angularComponents: number;
    missingReactTS: number;
    missingReactJS: number;
    missingVueTS: number;
    missingVueJS: number;
    missingAngularTS: number;
    missingCSS: number;
    unexpectedFiles: number;
  };
}

/**
 * Compare the entries of one Template directory with the files it must hold:
 * each missing Template file, then each entry outside the set.
 */
export function findTemplateDirIssues(
  framework: SupportedFramework,
  componentName: string,
  entries: readonly string[]
): string[] {
  const dir = `templates/${framework}/${componentName}`;
  const expected = getTemplateFileNames(framework, componentName);
  return [
    ...expected
      .filter((file) => !entries.includes(file))
      .map((file) => `Missing file: ${dir}/${file}`),
    ...entries
      .filter((entry) => !expected.includes(entry))
      .map((entry) => `Unexpected file: ${dir}/${entry}`),
  ];
}

/**
 * Check that a component's Template directory holds exactly its files
 */
async function validateComponentTemplates(
  componentName: string,
  framework: SupportedFramework
): Promise<string[]> {
  const componentDir = path.join(TEMPLATES_DIR, framework, componentName);

  if (!(await fs.pathExists(componentDir))) {
    return [`Missing directory: templates/${framework}/${componentName}`];
  }

  return findTemplateDirIssues(
    framework,
    componentName,
    await fs.readdir(componentDir)
  );
}

/**
 * Validate naming conventions
 */
function validateNaming(componentName: string): string[] {
  const errors: string[] = [];

  // Component name should be PascalCase
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
    errors.push(`Component name '${componentName}' is not PascalCase`);
  }

  return errors;
}

const TEMPLATE_SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.vue',
]);

/**
 * Recursively collect all template source files (excluding `.css` and other
 * static assets). Used by the no-token check.
 */
async function collectSourceFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (!(await fs.pathExists(current))) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        const dot = entry.name.lastIndexOf('.');
        if (dot >= 0 && TEMPLATE_SOURCE_EXTENSIONS.has(entry.name.slice(dot))) {
          out.push(full);
        }
      }
    }
  }
  return out;
}

/**
 * Assert that no template source file contains an unresolved Handlebars-style
 * token. The previous validator used `Handlebars.precompile()`; the new
 * pipeline has no templating engine, so a stray `{{…}}` is always a bug.
 */
async function validateNoTokens(): Promise<string[]> {
  const errors: string[] = [];
  const tokenPattern = /\{\{[^}]+\}\}/;
  for (const framework of ['react', 'vue', 'angular'] as const) {
    const files = await collectSourceFiles(path.join(TEMPLATES_DIR, framework));
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const match = content.match(tokenPattern);
      if (match) {
        const rel = path.relative(PROJECT_ROOT, file);
        errors.push(`Stray token in ${rel}: ${match[0]}`);
      }
    }
  }
  return errors;
}

/**
 * Main validation function
 */
async function validateTemplates(): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    stats: {
      reactComponents: 0,
      vueComponents: 0,
      angularComponents: 0,
      missingReactTS: 0,
      missingReactJS: 0,
      missingVueTS: 0,
      missingVueJS: 0,
      missingAngularTS: 0,
      missingCSS: 0,
      unexpectedFiles: 0,
    },
  };

  console.log(pc.cyan('\n🔍 Validating component templates...\n'));

  const components = getAllComponents();
  const frameworks: SupportedFramework[] = ['react', 'vue', 'angular'];

  for (const framework of frameworks) {
    for (const [_key, component] of Object.entries(components)) {
      // Validate naming
      const namingErrors = validateNaming(component.name);
      result.errors.push(...namingErrors);

      // Validate template files exist
      const templateErrors = await validateComponentTemplates(
        component.name,
        framework
      );

      if (templateErrors.length === 0) {
        if (framework === 'react') {
          result.stats.reactComponents++;
        } else if (framework === 'vue') {
          result.stats.vueComponents++;
        } else if (framework === 'angular') {
          result.stats.angularComponents++;
        }
      } else {
        result.errors.push(...templateErrors);

        // Track specific missing files
        for (const error of templateErrors) {
          if (error.startsWith('Unexpected file: ')) {
            result.stats.unexpectedFiles++;
            continue;
          }
          if (error.endsWith('.tsx')) result.stats.missingReactTS++;
          if (error.endsWith('.jsx')) result.stats.missingReactJS++;
          if (error.endsWith('.vue') && !error.endsWith('.js.vue'))
            result.stats.missingVueTS++;
          if (error.endsWith('.js.vue')) result.stats.missingVueJS++;
          if (error.endsWith('.component.ts')) result.stats.missingAngularTS++;
          if (error.endsWith('.css')) result.stats.missingCSS++;
        }
      }
    }
  }

  // Check for orphaned templates (templates without registry entry)
  for (const framework of frameworks) {
    const frameworkDir = path.join(TEMPLATES_DIR, framework);

    if (!(await fs.pathExists(frameworkDir))) {
      result.warnings.push(
        `Missing framework directory: templates/${framework}`
      );
      continue;
    }

    const entries = await fs.readdir(frameworkDir, { withFileTypes: true });
    const templateDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const dirName of templateDirs) {
      const hasComponent = Object.values(components).some(
        (comp) => comp.name === dirName
      );

      if (!hasComponent) {
        result.warnings.push(
          `Orphaned template directory: templates/${framework}/${dirName} (no registry entry)`
        );
      }
    }
  }

  // Stray-token check (replaces the old Handlebars precompile pass).
  const tokenErrors = await validateNoTokens();
  result.errors.push(...tokenErrors);

  result.passed = result.errors.length === 0;

  return result;
}

/**
 * Print validation results
 */
function printResults(result: ValidationResult): void {
  const total = Object.keys(getAllComponents()).length;
  console.log(pc.bold('Statistics:'));
  console.log(`  React components:   ${result.stats.reactComponents}/${total}`);
  console.log(`  Vue components:     ${result.stats.vueComponents}/${total}`);
  console.log(
    `  Angular components: ${result.stats.angularComponents}/${total}`
  );
  console.log('');

  if (result.stats.missingReactTS > 0) {
    console.log(
      pc.yellow(`  Missing React TS: ${result.stats.missingReactTS}`)
    );
  }
  if (result.stats.missingReactJS > 0) {
    console.log(
      pc.yellow(`  Missing React JS: ${result.stats.missingReactJS}`)
    );
  }
  if (result.stats.missingVueTS > 0) {
    console.log(pc.yellow(`  Missing Vue TS:   ${result.stats.missingVueTS}`));
  }
  if (result.stats.missingVueJS > 0) {
    console.log(pc.yellow(`  Missing Vue JS:   ${result.stats.missingVueJS}`));
  }
  if (result.stats.missingAngularTS > 0) {
    console.log(
      pc.yellow(`  Missing Angular:  ${result.stats.missingAngularTS}`)
    );
  }
  if (result.stats.missingCSS > 0) {
    console.log(pc.yellow(`  Missing CSS:      ${result.stats.missingCSS}`));
  }
  if (result.stats.unexpectedFiles > 0) {
    console.log(
      pc.yellow(`  Unexpected files: ${result.stats.unexpectedFiles}`)
    );
    console.log(
      pc.dim(
        '  A Template directory holds only getTemplateFileNames(); kigumi add\n' +
          '  never copies anything else. Function proof is the harnesses in\n' +
          '  tests/unit/, not a per-Template test (templates/AGENTS.md).'
      )
    );
  }

  if (result.warnings.length > 0) {
    console.log(pc.yellow('\n⚠️  Warnings:'));
    for (const warning of result.warnings) {
      console.log(pc.yellow(`  • ${warning}`));
    }
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log(pc.red('❌ Errors:'));
    // Show first 20 errors, then summarize
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
    console.log(pc.green('✅ Template validation passed!\n'));
  } else {
    console.log(
      pc.red(
        `❌ Template validation failed with ${result.errors.length} error(s)\n`
      )
    );
  }
}

/**
 * Run validation
 */
async function main() {
  try {
    const result = await validateTemplates();
    printResults(result);

    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during validation:'));
    console.error(error);
    process.exit(1);
  }
}

if (isEntryPoint(import.meta.url)) {
  void main();
}
