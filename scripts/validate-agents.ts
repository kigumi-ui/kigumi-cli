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
 * - The tests/AGENTS.md tree has a row for every test file under tests/, each
 *   row names a file that exists, and no file count is stated
 * - Component-count claims in templates/AGENTS.md prose match the registry
 * - No AGENTS.md or CLAUDE.md carries a "Last Updated" stamp or a changelog
 *
 * USAGE:
 *   pnpm validate:agents
 *   tsx scripts/validate-agents.ts
 */

import { execFileSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { getAllComponents } from '../src/utils/registry.js';
import { toKebabCase } from '../src/utils/naming.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

export interface ValidationResult {
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

async function readAgentsFile(
  relativePath: string,
  root = PROJECT_ROOT
): Promise<string> {
  return fs.readFile(path.join(root, relativePath), 'utf-8');
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
    const kebab = toKebabCase(key);
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
// Check: templates/AGENTS.md component-count claims
// ---------------------------------------------------------------------------

/**
 * A count claim found in prose, e.g. "a single set of 84 React templates".
 */
export interface TemplateCountClaim {
  /** The framework the claim is about. */
  framework: string;
  /** The number the prose asserts. */
  claimed: number;
  /** The full sentence fragment, for the error message. */
  context: string;
}

/**
 * Extracts per-framework template-count claims from prose.
 *
 * Pure on purpose: templates/AGENTS.md is the one AGENTS.md file no check
 * ever opened, and it drifted to "80 React templates" while the real count
 * was 84. A matcher buried in a filesystem walk cannot be table-tested,
 * which is exactly how the className regex stayed dead for months.
 */
export function findTemplateCountClaims(content: string): TemplateCountClaim[] {
  const claims: TemplateCountClaim[] = [];
  // "<n> React templates", "<n> Vue templates", "<n> Angular templates".
  // Case-insensitive on the framework, so "84 react templates" also counts.
  const pattern = /(\d+)\s+(React|Vue|Angular)\s+templates/gi;

  for (const match of content.matchAll(pattern)) {
    claims.push({
      framework: match[2].toLowerCase(),
      claimed: parseInt(match[1], 10),
      context: match[0],
    });
  }

  return claims;
}

/**
 * Compares every count claim in prose against the real component total.
 * Pure, so the comparison is testable without touching disk.
 */
export function checkTemplateCountClaims(
  content: string,
  actualCount: number,
  filename = 'templates/AGENTS.md'
): string[] {
  return findTemplateCountClaims(content)
    .filter((claim) => claim.claimed !== actualCount)
    .map(
      (claim) =>
        `${filename} says "${claim.context}", but templates/${claim.framework}/ ` +
        `has ${actualCount} components. Update the sentence to ${actualCount}`
    );
}

async function checkTemplateGuideCounts(): Promise<string[]> {
  const totalCount = Object.keys(getAllComponents()).length;
  const templatesAgents = await readAgentsFile('templates/AGENTS.md');
  return checkTemplateCountClaims(templatesAgents, totalCount);
}

// ---------------------------------------------------------------------------
// Check: No history in agent context files
// ---------------------------------------------------------------------------

/**
 * A "Last Updated" date stamp: `**Last Updated:** 2026-09-28`, the older
 * `**Last Updated**: 2026-01-09`, and non-ISO forms such as `29/09/2026` or
 * `Sep 29, 2026`, also after `on` / `as of`. Keyed on the date that follows,
 * so prose that merely names the rule ("no Last Updated date") does not match.
 */
const DATE_STAMP =
  /last updated\W{0,6}(?:(?:on|as of)\s+)?(?:\d|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d)/i;

/** A heading that opens a changelog section. */
const CHANGELOG_HEADING =
  /^#{1,6}\s+(change\s*log|update\s*log|history|recent changes|revision history)\b/i;

/**
 * Finds history in an agent context file, as `line N: text` entries.
 *
 * Every AGENTS.md used to end in a changelog that each PR appended to. All
 * PRs appended after the same last line, so every pair of open PRs touching
 * the same file conflicted there, and every agent loaded the whole history on
 * every task. History lives in git and the PR; these files state what is true
 * now. Pure, so the matcher is table-tested without touching disk.
 */
export function findHistory(content: string): string[] {
  return content
    .split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => DATE_STAMP.test(line) || CHANGELOG_HEADING.test(line))
    .map(({ line, number }) => `line ${number}: ${line.trim()}`);
}

export function checkHistoryFree(content: string, filename: string): string[] {
  return findHistory(content).map(
    (hit) =>
      `${filename} carries history (${hit}). Delete it: history belongs in ` +
      `git log and the PR, and an appended footer conflicts with every other open PR`
  );
}

export async function checkNoHistory(root = PROJECT_ROOT): Promise<string[]> {
  // Every tracked file, so a new AGENTS.md is covered without a list to edit.
  const files = execFileSync(
    'git',
    ['ls-files', '--', ':(glob)**/AGENTS.md', ':(glob)**/CLAUDE.md'],
    { cwd: root, encoding: 'utf-8' }
  )
    .split('\n')
    .filter(Boolean);

  if (!files.includes('AGENTS.md')) {
    return ['git ls-files found no root AGENTS.md, so no file was checked'];
  }

  const errors: string[] = [];
  for (const file of files) {
    const content = await fs.readFile(path.join(root, file), 'utf-8');
    errors.push(...checkHistoryFree(content, file));
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Check: Test file completeness
// ---------------------------------------------------------------------------

/**
 * Finds a test-file count in the tests/AGENTS.md tree, e.g. "(120 files".
 *
 * The tree used to state one, and every PR that added a test bumped it. Two
 * PRs bumping 119 to 120 is the same edit on both sides, so git merged it
 * without a conflict to a number one too low (#154 and #161: 120 claimed,
 * 121 real), and main went red. The tree already lists every file, which is
 * what checkTestFiles() holds, so the number carries nothing but that risk.
 * Pure, so the matcher is table-tested without touching disk.
 */
export function findTestCountClaim(content: string): string | null {
  const match = content.match(/unit\/\s+#.*?\(\d+\s+files/);
  return match ? match[0] : null;
}

/** A test file, by the extensions vitest picks up in this repo. */
const TEST_FILE = /\.test\.(?:ts|tsx|js|jsx)$/;

/** One tree entry: its `│   ` / `    ` indent, the branch, then its name. */
const TREE_ENTRY = /^((?:│ {3}| {4})*)[├└]── (\S+)/;

export interface TestTree {
  /** Whether content holds a fenced block opening with `tests/`. */
  found: boolean;
  /** Every test-file row, as its path under tests/ (globs kept as written). */
  rows: string[];
  /** Tree lines that are not a readable entry, so their depth is unknown. */
  unreadable: string[];
}

/**
 * Reads the directory tree in tests/AGENTS.md: the fenced block whose first
 * line is `tests/`. An entry's depth is its indent in 4-character steps, so
 * a row's path is the directories open above it plus its own name. Only the
 * tree is read; a test file named in prose elsewhere is not a row.
 * Pure, so the parser is table-tested without touching disk.
 */
export function parseTestTree(content: string): TestTree {
  const lines = content.split('\n');
  const start = lines.findIndex(
    (line, i) => line === 'tests/' && lines[i - 1]?.startsWith('```')
  );
  if (start === -1) return { found: false, rows: [], unreadable: [] };

  const rows: string[] = [];
  const unreadable: string[] = [];
  const open: string[] = [];

  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('```')) break;
    if (line.trim() === '') continue;

    const entry = TREE_ENTRY.exec(line);
    if (!entry) {
      unreadable.push(line);
      continue;
    }
    const depth = entry[1].length / 4;
    const name = entry[2];
    open.length = depth;
    if (name.endsWith('/')) {
      open.push(name.slice(0, -1));
    } else if (TEST_FILE.test(name)) {
      rows.push([...open, name].join('/'));
    }
  }

  return { found: true, rows, unreadable };
}

/** A row's file name as a pattern: `*`, `?` and `{a,b}` are globs. */
function globToRegExp(glob: string): RegExp {
  let source = '';
  for (const char of glob) {
    if (char === '*') source += '[^/]*';
    else if (char === '?') source += '[^/]';
    else if (char === '{') source += '(?:';
    else if (char === '}') source += ')';
    else if (char === ',') source += '|';
    else source += char.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`);
}

const GLOB_CHARS = /[*?{]/;

/**
 * Compares tree rows with the test files on disk, both as paths under
 * tests/. Every file needs a row naming it exactly, or a glob row in its own
 * directory matching it. Every exact row needs its file, and every glob row
 * at least one match. Whole paths, so neither a longer name containing a
 * shorter one nor a same-named file in another directory counts.
 * Pure, so the comparison is table-tested without touching disk.
 */
export function findTestTreeDrift(rows: string[], files: string[]): string[] {
  const exact = new Set(rows.filter((row) => !GLOB_CHARS.test(row)));
  const globs = rows
    .filter((row) => GLOB_CHARS.test(row))
    .map((row) => ({
      row,
      dir: path.posix.dirname(row),
      pattern: globToRegExp(path.posix.basename(row)),
    }));

  const matchesGlob = (file: string, glob: (typeof globs)[number]) =>
    path.posix.dirname(file) === glob.dir &&
    glob.pattern.test(path.posix.basename(file));

  const errors: string[] = [];
  for (const file of [...files].sort()) {
    if (!exact.has(file) && !globs.some((glob) => matchesGlob(file, glob))) {
      errors.push(`tests/AGENTS.md tree has no row for tests/${file}`);
    }
  }

  const onDisk = new Set(files);
  for (const row of exact) {
    if (!onDisk.has(row)) {
      errors.push(
        `tests/AGENTS.md tree lists tests/${row}, which does not exist`
      );
    }
  }
  for (const glob of globs) {
    if (!files.some((file) => matchesGlob(file, glob))) {
      errors.push(
        `tests/AGENTS.md tree lists tests/${glob.row}, which matches no test file`
      );
    }
  }

  return errors;
}

/**
 * Test files under tests/, as paths below it: tracked ones and new ones not
 * yet staged, never git-ignored scratch such as the `.tmp-e2e-*` projects.
 * tests/fixtures holds recorded CLI output, not suites, so it is skipped.
 */
async function listTestFiles(root: string): Promise<string[]> {
  const listed = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'tests'],
    { cwd: root, encoding: 'utf-8' }
  )
    .split('\n')
    .filter((file) => TEST_FILE.test(file))
    .map((file) => file.slice('tests/'.length))
    .filter((file) => !file.startsWith('fixtures/'));

  // A tracked file deleted but not yet staged is still in the index.
  const present: string[] = [];
  for (const file of listed) {
    if (await fs.pathExists(path.join(root, 'tests', file))) present.push(file);
  }
  return present;
}

export async function checkTestFiles(root = PROJECT_ROOT): Promise<string[]> {
  const errors: string[] = [];
  const testsAgents = await readAgentsFile('tests/AGENTS.md', root);

  const countClaim = findTestCountClaim(testsAgents);
  if (countClaim) {
    errors.push(
      `tests/AGENTS.md states a test-file count ("${countClaim}"). Delete it: ` +
        `the tree lists every file, and parallel PRs bumping the same number merge to a wrong one silently`
    );
  }

  const tree = parseTestTree(testsAgents);
  if (!tree.found) {
    return [
      ...errors,
      'tests/AGENTS.md has no fenced `tests/` tree, so no test file was checked',
    ];
  }
  for (const line of tree.unreadable) {
    errors.push(
      `tests/AGENTS.md tree line cannot be placed in the tree: "${line.trim()}"`
    );
  }
  // Rows below an unreadable line sit at a guessed depth; report that first.
  if (tree.unreadable.length > 0) return errors;

  errors.push(...findTestTreeDrift(tree.rows, await listTestFiles(root)));
  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Every check `validate:agents` runs, exported so the wiring is testable. */
export const AGENTS_CHECKS = [
  { name: 'Version', fn: checkVersion },
  { name: 'Component counts', fn: checkComponentCounts },
  { name: 'Pro component list', fn: checkProComponents },
  { name: 'Template directories', fn: checkTemplateDirs },
  { name: 'Test files', fn: checkTestFiles },
  { name: 'Template guide counts', fn: checkTemplateGuideCounts },
  { name: 'No history in agent context', fn: checkNoHistory },
];

export async function validateAgents(): Promise<ValidationResult> {
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

  for (const check of AGENTS_CHECKS) {
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

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
