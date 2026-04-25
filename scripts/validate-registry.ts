#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Registry Validation Script
 *
 * PURPOSE: Validates that the component registry is consistent with template files
 *
 * CHECKS:
 * - All components have required fields
 * - No duplicate component names
 * - Template files exist for each registry entry
 * - TypeScript types match registry definitions
 *
 * USAGE:
 *   pnpm validate:registry
 *   node scripts/validate-registry.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import {
  getAllComponents,
  type ComponentDefinition,
} from '../src/utils/registry.js';
import { toKebabCase } from '../src/utils/naming.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalComponents: number;
    freeComponents: number;
    proComponents: number;
    missingTemplates: number;
    validatedTemplates: number;
  };
}

/**
 * Check if all required fields are present
 */
function validateRequiredFields(
  component: ComponentDefinition,
  key: string
): string[] {
  const errors: string[] = [];
  const required = [
    'name',
    'tagName',
    'importPath',
    'tier',
    'category',
    'description',
  ];

  for (const field of required) {
    if (
      !(field in component) ||
      !component[field as keyof ComponentDefinition]
    ) {
      errors.push(`Component '${key}' missing required field: ${field}`);
    }
  }

  if (!Array.isArray(component.props)) {
    errors.push(`Component '${key}' props must be an array`);
  }

  return errors;
}

const ALLOWED_PROP_TYPES = ['string', 'boolean', 'number'] as const;
type AllowedPropType = (typeof ALLOWED_PROP_TYPES)[number];

/**
 * Validate individual prop definitions
 *
 * Checks that each prop has a non-empty name, a type from the allowed set,
 * a well-formed values array when present, and a default that matches one
 * of the values when both are declared.
 */
export function validateProps(
  component: ComponentDefinition,
  key: string
): string[] {
  const errors: string[] = [];
  if (!Array.isArray(component.props)) return errors;

  component.props.forEach((prop, index) => {
    const ref = `Component '${key}' prop[${index}]`;

    if (typeof prop.name !== 'string' || prop.name.length === 0) {
      errors.push(`${ref} is missing 'name'`);
    }

    if (
      typeof prop.type !== 'string' ||
      !ALLOWED_PROP_TYPES.includes(prop.type as AllowedPropType)
    ) {
      errors.push(
        `${ref} ('${prop.name ?? '?'}') has invalid type '${prop.type}'; ` +
          `expected one of ${ALLOWED_PROP_TYPES.join(' | ')}`
      );
    }

    if (prop.values !== undefined && !Array.isArray(prop.values)) {
      errors.push(`${ref} ('${prop.name ?? '?'}') 'values' must be an array`);
    }

    if (
      prop.default !== undefined &&
      Array.isArray(prop.values) &&
      !prop.values.includes(prop.default)
    ) {
      errors.push(
        `${ref} ('${prop.name ?? '?'}') default '${prop.default}' is not in values [${prop.values.join(', ')}]`
      );
    }
  });

  return errors;
}

/**
 * Check for duplicate component names
 */
function validateNoDuplicates(
  components: Record<string, ComponentDefinition>
): string[] {
  const errors: string[] = [];
  const seenNames = new Set<string>();
  const seenTagNames = new Set<string>();

  for (const [_key, component] of Object.entries(components)) {
    if (seenNames.has(component.name)) {
      errors.push(`Duplicate component name: ${component.name}`);
    }
    seenNames.add(component.name);

    if (seenTagNames.has(component.tagName)) {
      errors.push(`Duplicate tag name: ${component.tagName}`);
    }
    seenTagNames.add(component.tagName);
  }

  return errors;
}

/**
 * Check if template files exist for component
 */
async function validateTemplateFiles(
  component: ComponentDefinition,
  key: string,
  framework: 'react' | 'vue' | 'angular'
): Promise<string[]> {
  const errors: string[] = [];
  const componentDir = path.join(TEMPLATES_DIR, framework, component.name);

  if (!(await fs.pathExists(componentDir))) {
    errors.push(
      `Missing template directory: templates/${framework}/${component.name}`
    );
    return errors;
  }

  // Check for required template files
  const extensions: Record<string, string[]> = {
    react: ['tsx', 'jsx'],
    vue: ['vue', 'js.vue'],
    angular: ['component.ts'],
  };

  const testExtensions: Record<string, string[]> = {
    react: ['test.tsx', 'test.jsx'],
    vue: ['test.ts', 'test.js'],
    angular: ['component.spec.ts'],
  };

  const requiredFiles: string[] = [];

  // Angular uses kebab-case file names
  const fileName =
    framework === 'angular' ? toKebabCase(component.name) : component.name;

  // Component files
  for (const ext of extensions[framework]) {
    requiredFiles.push(`${fileName}.${ext}`);
  }

  // Test files
  for (const ext of testExtensions[framework]) {
    requiredFiles.push(`${fileName}.${ext}`);
  }

  const cssName =
    framework === 'angular'
      ? `${fileName}.component.css`
      : `${component.name}.css`;
  requiredFiles.push(cssName);

  for (const file of requiredFiles) {
    const filePath = path.join(componentDir, file);
    if (!(await fs.pathExists(filePath))) {
      errors.push(
        `Missing template file: templates/${framework}/${component.name}/${file}`
      );
    }
  }

  return errors;
}

/**
 * Validate tier values
 */
function validateTier(component: ComponentDefinition, key: string): string[] {
  const errors: string[] = [];

  if (!['free', 'pro'].includes(component.tier)) {
    errors.push(`Component '${key}' has invalid tier: ${component.tier}`);
  }

  return errors;
}

/**
 * Validate import paths
 */
function validateImportPath(
  component: ComponentDefinition,
  key: string
): string[] {
  const errors: string[] = [];

  if (!component.importPath.startsWith('@awesome.me/webawesome')) {
    errors.push(
      `Component '${key}' has invalid import path: ${component.importPath}`
    );
  }

  if (!component.importPath.includes('/dist/components/')) {
    errors.push(
      `Component '${key}' import path missing '/dist/components/': ${component.importPath}`
    );
  }

  if (!component.importPath.endsWith('.js')) {
    errors.push(
      `Component '${key}' import path must end with '.js': ${component.importPath}`
    );
  }

  return errors;
}

/**
 * Validate tag names
 *
 * Handles CamelCase component keys like 'ButtonGroup' by converting
 * to kebab-case ('button-group') before comparing to tag names.
 */
export function validateTagName(
  component: ComponentDefinition,
  key: string
): string[] {
  const errors: string[] = [];

  if (!component.tagName.startsWith('wa-')) {
    errors.push(
      `Component '${key}' tag name must start with 'wa-': ${component.tagName}`
    );
  }

  // Normalize key: 'ButtonGroup' -> 'button-group' (camelCase to kebab-case)
  const normalizedKey = key
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between lowercase and uppercase
    .toLowerCase();

  // Extract tag without 'wa-' prefix for comparison
  const tagWithoutPrefix = component.tagName.replace(/^wa-/, '');

  if (tagWithoutPrefix !== normalizedKey) {
    errors.push(
      `Component '${key}' tag name '${component.tagName}' must equal 'wa-${normalizedKey}'`
    );
  }

  return errors;
}

/**
 * Main validation function
 */
export async function validateRegistry(): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    stats: {
      totalComponents: 0,
      freeComponents: 0,
      proComponents: 0,
      missingTemplates: 0,
      validatedTemplates: 0,
    },
  };

  console.log(pc.cyan('\n🔍 Validating component registry...\n'));

  const components = getAllComponents();
  result.stats.totalComponents = Object.keys(components).length;

  // Check for duplicates
  const duplicateErrors = validateNoDuplicates(components);
  result.errors.push(...duplicateErrors);

  // Validate each component
  for (const [key, component] of Object.entries(components)) {
    // Count by tier
    if (component.tier === 'free') {
      result.stats.freeComponents++;
    } else if (component.tier === 'pro') {
      result.stats.proComponents++;
    }

    // Required fields
    const fieldErrors = validateRequiredFields(component, key);
    result.errors.push(...fieldErrors);

    // Per-prop validation
    const propErrors = validateProps(component, key);
    result.errors.push(...propErrors);

    // Tier validation
    const tierErrors = validateTier(component, key);
    result.errors.push(...tierErrors);

    // Import path validation
    const importErrors = validateImportPath(component, key);
    result.errors.push(...importErrors);

    // Tag name validation
    const tagErrors = validateTagName(component, key);
    result.errors.push(...tagErrors);

    // Template files validation (React and Vue)
    for (const framework of ['react', 'vue', 'angular'] as const) {
      const templateErrors = await validateTemplateFiles(
        component,
        key,
        framework
      );

      if (templateErrors.length > 0) {
        result.errors.push(...templateErrors);
        result.stats.missingTemplates++;
      } else {
        result.stats.validatedTemplates++;
      }
    }
  }

  // Warnings for potential issues
  if (result.stats.proComponents < 3) {
    result.warnings.push(
      `Only ${result.stats.proComponents} pro components - expected at least 3`
    );
  }

  if (result.stats.freeComponents < 30) {
    result.warnings.push(
      `Only ${result.stats.freeComponents} free components - expected at least 30`
    );
  }

  result.passed = result.errors.length === 0;

  return result;
}

/**
 * Print validation results
 */
function printResults(result: ValidationResult): void {
  console.log(pc.bold('Statistics:'));
  console.log(`  Total components: ${result.stats.totalComponents}`);
  console.log(`  Free components:  ${result.stats.freeComponents}`);
  console.log(`  Pro components:   ${result.stats.proComponents}`);
  console.log(
    `  Validated templates: ${result.stats.totalComponents} components across 3 frameworks (${result.stats.validatedTemplates} template sets)`
  );
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
    for (const error of result.errors) {
      console.log(pc.red(`  • ${error}`));
    }
    console.log('');
  }

  if (result.passed) {
    console.log(pc.green('✅ Registry validation passed!\n'));
  } else {
    console.log(
      pc.red(
        `❌ Registry validation failed with ${result.errors.length} error(s)\n`
      )
    );
  }
}

/**
 * Run validation
 */
async function main() {
  try {
    const result = await validateRegistry();
    printResults(result);

    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
