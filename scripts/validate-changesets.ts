#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Changeset Format Validation Script
 *
 * PURPOSE: Catches changesets written without a Keep a Changelog category
 * header (### Added / ### Changed / ### Fixed / ...) before they merge.
 * scripts/post-changeset-version.ts silently drops any changeset content
 * that appears before the first such header, so a header-less changeset
 * produces an empty CHANGELOG.md entry at release time with no warning.
 *
 * See .claude/skills/release/SKILL.md for the required changeset format.
 *
 * USAGE:
 *   pnpm validate:changesets
 *   tsx scripts/validate-changesets.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);
const CHANGESET_DIR = path.join(PROJECT_ROOT, '.changeset');

const VALID_CATEGORIES = [
  'Breaking Changes',
  'Added',
  'Changed',
  'Fixed',
  'Deprecated',
  'Removed',
  'Security',
];

const CATEGORY_HEADER_PATTERN = new RegExp(
  `^### (?:${VALID_CATEGORIES.join('|')})\\s*$`,
  'm'
);

/**
 * Strips the `---\n...\n---` frontmatter block from a changeset file,
 * returning only the summary body that ends up in CHANGELOG.md.
 */
export function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '');
}

/**
 * Checks whether a changeset body contains at least one Keep a Changelog
 * category header. Returns null when valid, or an error message otherwise.
 */
export function checkChangesetFormat(
  filename: string,
  content: string
): string | null {
  const body = stripFrontmatter(content).trim();

  if (body.length === 0) {
    return `${filename}: changeset body is empty`;
  }

  if (!CATEGORY_HEADER_PATTERN.test(body)) {
    return (
      `${filename}: missing a Keep a Changelog category header ` +
      `(### Added / ### Changed / ### Fixed / ...). Content without a ` +
      `header is silently dropped from CHANGELOG.md at release time. ` +
      `See .claude/skills/release/SKILL.md for the required format.`
    );
  }

  return null;
}

async function listChangesetFiles(): Promise<string[]> {
  const entries = await fs.readdir(CHANGESET_DIR);
  return entries.filter((f) => f.endsWith('.md') && f !== 'README.md');
}

async function validateChangesets(): Promise<string[]> {
  const errors: string[] = [];
  const files = await listChangesetFiles();

  for (const file of files) {
    const content = await fs.readFile(path.join(CHANGESET_DIR, file), 'utf-8');
    const error = checkChangesetFormat(file, content);
    if (error) errors.push(error);
  }

  return errors;
}

async function main() {
  console.log(pc.cyan('\n🔍 Validating changeset format...\n'));

  try {
    const errors = await validateChangesets();

    if (errors.length > 0) {
      console.log(pc.red('Errors:'));
      for (const error of errors) {
        console.log(pc.red(`  • ${error}`));
      }
      console.log('');
      console.log(
        pc.red(`Changeset validation failed with ${errors.length} error(s)\n`)
      );
      process.exit(1);
    }

    console.log(pc.green('Changeset validation passed!\n'));
    process.exit(0);
  } catch (error) {
    console.error(pc.red('Fatal error during validation:'));
    console.error(error);
    process.exit(1);
  }
}

if (process.argv[1] === __filename) {
  main();
}
