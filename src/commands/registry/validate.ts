/**
 * Registry Validate Command
 *
 * Validates a community registry directory structure and registry.json.
 */

import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { handleError } from '../../errors/index.js';
import { REGISTRY_FILE_NAME } from '../../constants.js';
import {
  communityRegistrySchema,
  validateRegistryDependencies,
  type CommunityRegistry,
} from '../../schemas/community-registry.js';

interface RegistryValidateOptions {
  cwd?: string;
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  errors: string[];
}

export async function registryValidateAction(
  options?: RegistryValidateOptions
) {
  const output = getOutput();
  output.intro('kigumi registry validate');

  const cwd = options?.cwd || process.cwd();

  try {
    const checks: ValidationCheck[] = [];

    // 1. Check registry.json exists
    const registryPath = path.join(cwd, REGISTRY_FILE_NAME);
    const exists = await fs.pathExists(registryPath);
    checks.push({
      name: 'registry.json exists',
      passed: exists,
      errors: exists ? [] : ['registry.json not found in current directory'],
    });

    if (!exists) {
      printResults(checks, output);
      return;
    }

    // 2. Parse JSON
    let rawData: unknown;
    try {
      rawData = await fs.readJSON(registryPath);
      checks.push({ name: 'Valid JSON', passed: true, errors: [] });
    } catch (err) {
      checks.push({
        name: 'Valid JSON',
        passed: false,
        errors: [
          `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
        ],
      });
      printResults(checks, output);
      return;
    }

    // 3. Validate schema
    const parseResult = communityRegistrySchema.safeParse(rawData);
    if (!parseResult.success) {
      const schemaErrors = parseResult.error.issues.map((issue) => {
        const p = issue.path.join('.');
        return p ? `${p}: ${issue.message}` : issue.message;
      });
      checks.push({
        name: 'Schema validation',
        passed: false,
        errors: schemaErrors,
      });
      printResults(checks, output);
      return;
    }

    checks.push({ name: 'Schema validation', passed: true, errors: [] });
    const registry: CommunityRegistry = parseResult.data;

    // 4. Validate component dependencies
    const depErrors = validateRegistryDependencies(registry);
    checks.push({
      name: 'Component dependencies',
      passed: depErrors.length === 0,
      errors: depErrors,
    });

    // 5. Validate referenced files exist on disk
    const fileErrors = await validateFilesExist(cwd, registry);
    checks.push({
      name: 'Referenced files exist',
      passed: fileErrors.length === 0,
      errors: fileErrors,
    });

    // 6. Validate framework-file extension consistency
    const extErrors = validateFileExtensions(registry);
    checks.push({
      name: 'File extension consistency',
      passed: extErrors.length === 0,
      errors: extErrors,
    });

    printResults(checks, output);
  } catch (error) {
    handleError(error, output);
  }
}

async function validateFilesExist(
  cwd: string,
  registry: CommunityRegistry
): Promise<string[]> {
  const errors: string[] = [];

  for (const [key, component] of Object.entries(registry.components)) {
    for (const [fw, files] of Object.entries(component.files)) {
      const filesToCheck = [
        files.component,
        ...(files.css ? [files.css] : []),
        ...(files.test ? [files.test] : []),
        ...files.extras,
      ];

      for (const filePath of filesToCheck) {
        const fullPath = path.join(cwd, filePath);
        if (!(await fs.pathExists(fullPath))) {
          errors.push(
            `Component "${key}" (${fw}): file not found: ${filePath}`
          );
        }
      }
    }
  }

  for (const [key, theme] of Object.entries(registry.themes)) {
    const filesToCheck = [
      theme.files.css,
      ...(theme.files.variables ? [theme.files.variables] : []),
    ];

    for (const filePath of filesToCheck) {
      const fullPath = path.join(cwd, filePath);
      if (!(await fs.pathExists(fullPath))) {
        errors.push(`Theme "${key}": file not found: ${filePath}`);
      }
    }
  }

  return errors;
}

function validateFileExtensions(registry: CommunityRegistry): string[] {
  const errors: string[] = [];

  const frameworkExtensions: Record<string, string[]> = {
    react: ['.tsx', '.jsx', '.ts', '.js'],
    vue: ['.vue', '.js.vue', '.ts', '.js'],
    svelte: ['.svelte', '.ts', '.js'],
    angular: ['.ts', '.js'],
  };

  for (const [key, component] of Object.entries(registry.components)) {
    for (const [fw, files] of Object.entries(component.files)) {
      const validExts = frameworkExtensions[fw];
      if (!validExts) continue;

      const ext = path.extname(files.component);
      const doubleExt = files.component.includes('.js.vue') ? '.js.vue' : ext;

      if (!validExts.includes(doubleExt)) {
        errors.push(
          `Component "${key}" (${fw}): unexpected extension "${doubleExt}" for ${fw} component`
        );
      }
    }
  }

  return errors;
}

function printResults(
  checks: ValidationCheck[],
  output: ReturnType<typeof getOutput>
) {
  const allPassed = checks.every((c) => c.passed);

  for (const check of checks) {
    if (check.passed) {
      output.info(`${pc.green('✓')} ${check.name}`);
    } else {
      output.info(`${pc.red('✗')} ${check.name}`);
      for (const err of check.errors) {
        output.info(`  ${pc.dim('→')} ${err}`);
      }
    }
  }

  if (allPassed) {
    output.outro(`${pc.green('✓')} Registry is valid`);
  } else {
    const failed = checks.filter((c) => !c.passed).length;
    output.outro(`${pc.red('✗')} ${failed} check(s) failed`);
  }
}
