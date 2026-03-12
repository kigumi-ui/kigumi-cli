#!/usr/bin/env node
/**
 * Template Consistency Checker
 *
 * PURPOSE: Validates that all templates are consistent and complete
 *
 * CHECKS:
 * - All registry components have templates (React + Vue)
 * - All templates have test templates
 * - TypeScript and JavaScript variants exist
 * - Naming conventions are followed
 *
 * USAGE:
 *   pnpm validate:templates
 *   node scripts/validate-templates.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import Handlebars from 'handlebars';
import { getAllComponents } from '../src/utils/registry.js';

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
    missingReactTS: number;
    missingReactJS: number;
    missingVueTS: number;
    missingVueJS: number;
    missingTests: number;
    missingCSS: number;
  };
}

/**
 * Check if all required template files exist for a component
 */
async function validateComponentTemplates(
  componentName: string,
  framework: 'react' | 'vue'
): Promise<string[]> {
  const errors: string[] = [];
  const componentDir = path.join(TEMPLATES_DIR, framework, componentName);

  if (!(await fs.pathExists(componentDir))) {
    errors.push(`Missing directory: templates/${framework}/${componentName}`);
    return errors;
  }

  // Define required files based on framework
  const requiredFiles: Record<string, string[]> = {
    react: [
      `${componentName}.tsx.hbs`,
      `${componentName}.jsx.hbs`,
      `${componentName}.test.tsx.hbs`,
      `${componentName}.test.jsx.hbs`,
      `${componentName}.css.hbs`,
    ],
    vue: [
      `${componentName}.vue.hbs`,
      `${componentName}.js.vue.hbs`,
      `${componentName}.test.ts.hbs`,
      `${componentName}.test.js.hbs`,
      `${componentName}.css.hbs`,
    ],
  };

  for (const file of requiredFiles[framework]) {
    const filePath = path.join(componentDir, file);
    if (!(await fs.pathExists(filePath))) {
      errors.push(
        `Missing file: templates/${framework}/${componentName}/${file}`
      );
    }
  }

  return errors;
}

/**
 * Validate that all .hbs files in a component directory compile as valid Handlebars
 */
async function validateTemplateContent(
  componentName: string,
  framework: 'react' | 'vue'
): Promise<string[]> {
  const errors: string[] = [];
  const componentDir = path.join(TEMPLATES_DIR, framework, componentName);

  if (!(await fs.pathExists(componentDir))) {
    return errors; // Already reported by file-existence check
  }

  const entries = await fs.readdir(componentDir);
  const hbsFiles = entries.filter((f) => f.endsWith('.hbs'));

  for (const file of hbsFiles) {
    const filePath = path.join(componentDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      Handlebars.precompile(content);
    } catch (err) {
      errors.push(
        `Template compile error: templates/${framework}/${componentName}/${file} — ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return errors;
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
      missingReactTS: 0,
      missingReactJS: 0,
      missingVueTS: 0,
      missingVueJS: 0,
      missingTests: 0,
      missingCSS: 0,
    },
  };

  console.log(pc.cyan('\n🔍 Validating component templates...\n'));

  const components = getAllComponents();
  const frameworks = ['react', 'vue'] as const;

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

      // Validate template content compiles
      const contentErrors = await validateTemplateContent(
        component.name,
        framework
      );
      result.errors.push(...contentErrors);

      if (templateErrors.length === 0) {
        if (framework === 'react') {
          result.stats.reactComponents++;
        } else {
          result.stats.vueComponents++;
        }
      } else {
        result.errors.push(...templateErrors);

        // Track specific missing files
        for (const error of templateErrors) {
          if (error.includes('.tsx.hbs')) result.stats.missingReactTS++;
          if (error.includes('.jsx.hbs')) result.stats.missingReactJS++;
          if (error.includes('.vue.hbs')) result.stats.missingVueTS++;
          if (error.includes('.js.vue.hbs')) result.stats.missingVueJS++;
          if (error.includes('.test.')) result.stats.missingTests++;
          if (error.includes('.css.hbs')) result.stats.missingCSS++;
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

  result.passed = result.errors.length === 0;

  return result;
}

/**
 * Print validation results
 */
function printResults(result: ValidationResult): void {
  console.log(pc.bold('Statistics:'));
  console.log(`  React components: ${result.stats.reactComponents}/62`);
  console.log(`  Vue components:   ${result.stats.vueComponents}/62`);
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
  if (result.stats.missingTests > 0) {
    console.log(pc.yellow(`  Missing tests:    ${result.stats.missingTests}`));
  }
  if (result.stats.missingCSS > 0) {
    console.log(pc.yellow(`  Missing CSS:      ${result.stats.missingCSS}`));
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

main();
