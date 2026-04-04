#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * AGENTS.md Validation Script
 *
 * PURPOSE: Validates that AGENTS.md files stay in sync with codebase reality.
 * Catches stale component counts, wrong pro lists, outdated tier logic, etc.
 *
 * CHECKS:
 * - Version in root AGENTS.md matches package.json
 * - Component counts match registry (root + src/AGENTS.md)
 * - Pro-only component list matches registry tier assignments
 * - Template diagram lists all frameworks with correct counts
 * - Test file count and list completeness in tests/AGENTS.md
 *
 * USAGE:
 *   pnpm validate:agents
 *   tsx scripts/validate-agents.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { getAllComponents } from '../src/utils/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    checksRun: number;
    checksPassed: number;
    checksFailed: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readAgentsFile(relativePath: string): Promise<string> {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFile(fullPath, 'utf-8');
}

// ---------------------------------------------------------------------------
// Check: Version
// ---------------------------------------------------------------------------

async function checkVersion(): Promise<string[]> {
  const errors: string[] = [];

  const pkg = await fs.readJSON(path.join(PROJECT_ROOT, 'package.json'));
  const expectedVersion: string = pkg.version;

  const rootAgents = await readAgentsFile('AGENTS.md');
  const versionMatch = rootAgents.match(
    /\*\*Version\*\*:\s*([\d.]+(?:-[a-zA-Z0-9.]+)?)\s*\|/
  );

  if (!versionMatch) {
    errors.push('AGENTS.md: Could not find **Version**: X.Y.Z line');
  } else if (versionMatch[1] !== expectedVersion) {
    errors.push(
      `AGENTS.md version "${versionMatch[1]}" does not match package.json "${expectedVersion}"`
    );
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Check: Component counts
// ---------------------------------------------------------------------------

async function checkComponentCounts(): Promise<string[]> {
  const errors: string[] = [];

  const components = getAllComponents();
  const totalCount = Object.keys(components).length;

  // Root AGENTS.md -- mermaid registry node
  const rootAgents = await readAgentsFile('AGENTS.md');
  const registryNodeMatch = rootAgents.match(
    /registry\["registry\.ts\\n(\d+)\+?\s*ComponentDefinitions/
  );
  if (registryNodeMatch) {
    const claimed = parseInt(registryNodeMatch[1], 10);
    if (claimed !== totalCount) {
      errors.push(
        `AGENTS.md mermaid registry node says ${claimed} components, actual ${totalCount}`
      );
    }
  }

  // Root AGENTS.md -- template subgraph counts
  const tplCountMatches = [
    ...rootAgents.matchAll(/tpl_\w+\["(\w+)\/ — (\d+) components/g),
  ];
  for (const m of tplCountMatches) {
    const framework = m[1];
    const claimed = parseInt(m[2], 10);
    if (claimed !== totalCount) {
      errors.push(
        `AGENTS.md mermaid ${framework} template node says ${claimed} components, actual ${totalCount}`
      );
    }
  }

  // src/AGENTS.md -- code comment count
  const srcAgents = await readAgentsFile('src/AGENTS.md');
  const srcCountMatch = srcAgents.match(/\/\/\s*\.\.\.\s*(\d+)\s*components/);
  if (srcCountMatch) {
    const claimed = parseInt(srcCountMatch[1], 10);
    if (claimed !== totalCount) {
      errors.push(
        `src/AGENTS.md says "// ... ${claimed} components", actual ${totalCount}`
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Check: Pro component list
// ---------------------------------------------------------------------------

async function checkProComponents(): Promise<string[]> {
  const errors: string[] = [];

  const components = getAllComponents();
  const actualProKeys = Object.entries(components)
    .filter(([, c]) => c.tier === 'pro')
    .map(([key]) => key)
    .sort();

  const rootAgents = await readAgentsFile('AGENTS.md');
  const proListMatch = rootAgents.match(/\*\*Pro-only components:\*\*\s*(.+)/);

  if (!proListMatch) {
    errors.push('AGENTS.md: Could not find **Pro-only components:** line');
    return errors;
  }

  const claimedPro = proListMatch[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();

  // Check for items in doc that are not actually pro
  for (const name of claimedPro) {
    const key = name.replace(/-/g, '');
    const component = components[name] || components[key];
    if (!component) {
      errors.push(
        `AGENTS.md pro list includes "${name}" which does not exist in registry`
      );
    } else if (component.tier !== 'pro') {
      errors.push(
        `AGENTS.md pro list includes "${name}" but it is tier "${component.tier}"`
      );
    }
  }

  // Check for actual pro components missing from doc
  for (const key of actualProKeys) {
    const kebab = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (!claimedPro.includes(key) && !claimedPro.includes(kebab)) {
      errors.push(`AGENTS.md pro list is missing pro component "${kebab}"`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Check: Template framework directories
// ---------------------------------------------------------------------------

async function checkTemplateDirs(): Promise<string[]> {
  const errors: string[] = [];

  const components = getAllComponents();
  const totalCount = Object.keys(components).length;
  const templatesDir = path.join(PROJECT_ROOT, 'templates');

  const expectedFrameworks = ['react', 'vue', 'angular'];

  for (const fw of expectedFrameworks) {
    const fwDir = path.join(templatesDir, fw);
    if (!(await fs.pathExists(fwDir))) {
      errors.push(`Template directory templates/${fw}/ does not exist`);
      continue;
    }

    const entries = await fs.readdir(fwDir);
    // Count only directories (component template dirs), not files
    const dirs: string[] = [];
    for (const entry of entries) {
      const stat = await fs.stat(path.join(fwDir, entry));
      if (stat.isDirectory()) dirs.push(entry);
    }

    if (dirs.length !== totalCount) {
      errors.push(
        `templates/${fw}/ has ${dirs.length} component dirs, expected ${totalCount}`
      );
    }
  }

  // Check that the mermaid diagram includes all frameworks
  const rootAgents = await readAgentsFile('AGENTS.md');
  for (const fw of expectedFrameworks) {
    const pattern = new RegExp(`tpl_${fw}\\[`);
    if (!pattern.test(rootAgents)) {
      errors.push(
        `AGENTS.md mermaid diagram is missing tpl_${fw} node for ${fw} templates`
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Check: Test file count and completeness
// ---------------------------------------------------------------------------

async function checkTestFiles(): Promise<string[]> {
  const errors: string[] = [];

  const testDir = path.join(PROJECT_ROOT, 'tests', 'unit');
  const actualFiles = (await fs.readdir(testDir))
    .filter((f) => f.endsWith('.test.ts'))
    .sort();

  const testsAgents = await readAgentsFile('tests/AGENTS.md');

  // Check count in header
  const countMatch = testsAgents.match(/unit\/\s+#.*?\((\d+)\s+files/);
  if (countMatch) {
    const claimed = parseInt(countMatch[1], 10);
    if (claimed !== actualFiles.length) {
      errors.push(
        `tests/AGENTS.md says ${claimed} test files, actual ${actualFiles.length}`
      );
    }
  }

  // Check each file is listed in the tree
  for (const file of actualFiles) {
    if (!testsAgents.includes(file)) {
      errors.push(`tests/AGENTS.md tree is missing test file: ${file}`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function validateAgents(): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    stats: {
      checksRun: 0,
      checksPassed: 0,
      checksFailed: 0,
    },
  };

  console.log(pc.cyan('\n🔍 Validating AGENTS.md files...\n'));

  const checks = [
    { name: 'Version', fn: checkVersion },
    { name: 'Component counts', fn: checkComponentCounts },
    { name: 'Pro component list', fn: checkProComponents },
    { name: 'Template directories', fn: checkTemplateDirs },
    { name: 'Test files', fn: checkTestFiles },
  ];

  for (const check of checks) {
    result.stats.checksRun++;
    const checkErrors = await check.fn();
    if (checkErrors.length > 0) {
      result.errors.push(...checkErrors);
      result.stats.checksFailed++;
    } else {
      result.stats.checksPassed++;
    }
  }

  result.passed = result.errors.length === 0;

  return result;
}

function printResults(result: ValidationResult): void {
  console.log(pc.bold('Statistics:'));
  console.log(`  Checks run:    ${result.stats.checksRun}`);
  console.log(`  Checks passed: ${result.stats.checksPassed}`);
  console.log(`  Checks failed: ${result.stats.checksFailed}`);
  console.log('');

  if (result.warnings.length > 0) {
    console.log(pc.yellow('Warnings:'));
    for (const warning of result.warnings) {
      console.log(pc.yellow(`  • ${warning}`));
    }
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log(pc.red('Errors:'));
    for (const error of result.errors.slice(0, 20)) {
      console.log(pc.red(`  • ${error}`));
    }
    if (result.errors.length > 20) {
      console.log(pc.red(`  ... and ${result.errors.length - 20} more errors`));
    }
    console.log('');
  }

  if (result.passed) {
    console.log(pc.green('AGENTS.md validation passed!\n'));
  } else {
    console.log(
      pc.red(
        `AGENTS.md validation failed with ${result.errors.length} error(s)\n`
      )
    );
  }
}

async function main() {
  try {
    const result = await validateAgents();
    printResults(result);

    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during validation:'));
    console.error(error);
    process.exit(1);
  }
}

main();
