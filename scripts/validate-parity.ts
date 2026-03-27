#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Cross-Framework Parity Checker
 *
 * PURPOSE: Validates cross-framework consistency that validate:templates does NOT cover.
 * Specifically checks that the registry `files` field matches actual template presence,
 * and detects orphaned template directories without registry entries.
 *
 * CHECKS:
 * - Registry `files` field references both frameworks when templates exist
 * - No orphaned template directories (templates without registry entry)
 *
 * NOTE: Template directory existence and file completeness are already checked by
 * validate:templates. This script focuses on the metadata/registry layer instead.
 *
 * USAGE:
 *   pnpm validate:parity
 *   node scripts/validate-parity.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { getAllComponents } from '../src/utils/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');

// ── Types ───────────────────────────────────────────────────────────────────

interface ParityFinding {
  component: string;
  category: 'registry-files-gap' | 'orphaned-template';
  severity: 'error' | 'warning';
  message: string;
}

interface ParityResult {
  passed: boolean;
  findings: ParityFinding[];
  stats: {
    totalComponents: number;
    registryFilesGaps: number;
    orphanedReact: number;
    orphanedVue: number;
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

export async function validateParity(): Promise<ParityResult> {
  const components = getAllComponents();

  const result: ParityResult = {
    passed: true,
    findings: [],
    stats: {
      totalComponents: Object.keys(components).length,
      registryFilesGaps: 0,
      orphanedReact: 0,
      orphanedVue: 0,
    },
  };

  // 1. Check registry `files` field matches template presence
  for (const [, component] of Object.entries(components)) {
    for (const framework of ['react', 'vue'] as const) {
      const dir = path.join(TEMPLATES_DIR, framework, component.name);
      const hasTemplates = await fs.pathExists(dir);
      const hasFilesEntry = (component.files[framework]?.length ?? 0) > 0;

      if (hasTemplates && !hasFilesEntry) {
        result.stats.registryFilesGaps++;
        result.findings.push({
          component: component.name,
          category: 'registry-files-gap',
          severity: 'warning',
          message: `${framework} templates exist but registry.files.${framework} is empty`,
        });
      }
    }
  }

  // 2. Check for orphaned template directories (not in registry)
  const registryNames = new Set(Object.values(components).map((c) => c.name));

  for (const framework of ['react', 'vue'] as const) {
    const frameworkDir = path.join(TEMPLATES_DIR, framework);
    if (!(await fs.pathExists(frameworkDir))) continue;

    const entries = await fs.readdir(frameworkDir, { withFileTypes: true });
    const templateDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const dirName of templateDirs) {
      if (!registryNames.has(dirName)) {
        if (framework === 'react') result.stats.orphanedReact++;
        else result.stats.orphanedVue++;

        result.findings.push({
          component: dirName,
          category: 'orphaned-template',
          severity: 'warning',
          message: `Orphaned ${framework} template directory (no registry entry)`,
        });
      }
    }
  }

  // Only errors cause failure
  result.passed = !result.findings.some((f) => f.severity === 'error');

  return result;
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: ParityResult): void {
  console.log(pc.cyan('\nValidating cross-framework parity...\n'));

  console.log(pc.bold('Statistics:'));
  console.log(`  Total registry components:  ${result.stats.totalComponents}`);
  console.log(`  Registry files gaps:       ${result.stats.registryFilesGaps}`);

  if (result.stats.orphanedReact || result.stats.orphanedVue) {
    console.log(`  Orphaned React dirs:       ${result.stats.orphanedReact}`);
    console.log(`  Orphaned Vue dirs:         ${result.stats.orphanedVue}`);
  }
  console.log('');

  const errors = result.findings.filter((f) => f.severity === 'error');
  const warnings = result.findings.filter((f) => f.severity === 'warning');

  if (warnings.length > 0) {
    console.log(pc.yellow(`Warnings (${warnings.length}):`));
    for (const warning of warnings.slice(0, 30)) {
      console.log(pc.yellow(`  [${warning.component}] ${warning.message}`));
    }
    if (warnings.length > 30) {
      console.log(pc.yellow(`  ... and ${warnings.length - 30} more warnings`));
    }
    console.log('');
  }

  if (errors.length > 0) {
    console.log(pc.red(`Errors (${errors.length}):`));
    for (const error of errors.slice(0, 30)) {
      console.log(pc.red(`  [${error.component}] ${error.message}`));
    }
    if (errors.length > 30) {
      console.log(pc.red(`  ... and ${errors.length - 30} more errors`));
    }
    console.log('');
  }

  if (result.passed) {
    console.log(pc.green('Parity validation passed!\n'));
  } else {
    console.log(
      pc.red(`Parity validation failed with ${errors.length} error(s)\n`)
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

async function main() {
  try {
    const result = await validateParity();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during parity validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
