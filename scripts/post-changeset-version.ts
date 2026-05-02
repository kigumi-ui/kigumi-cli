/**
 * Post-processor for `changeset version` output.
 * Transforms the latest CHANGELOG.md entry from changesets format
 * into Keep a Changelog format.
 *
 * Run via: pnpm version (package.json: "changeset version && tsx scripts/post-changeset-version.ts")
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const CHANGELOG_PATH = resolve(import.meta.dirname, '..', 'CHANGELOG.md');

const CATEGORY_ORDER = [
  'Breaking Changes',
  'Added',
  'Changed',
  'Fixed',
  'Deprecated',
  'Removed',
  'Security',
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Parse a version block's content into category buckets.
 * Handles both:
 * - Direct ### Category headers (from well-formatted changesets)
 * - Nested categories inside changeset bullet items (from changesets wrapping)
 */
function parseCategories(content: string): Map<string, string[]> {
  const categories = new Map<string, string[]>();

  // Strip ### Major/Minor/Patch Changes wrapper headers
  let cleaned = content.replace(
    /^### (?:Major|Minor|Patch) Changes\s*\n/gm,
    ''
  );

  // Unwrap indented content from changeset bullet wrapping:
  // "- ### Added\n  - item" becomes "### Added\n- item"
  cleaned = cleaned.replace(/^- ###/gm, '###');
  cleaned = cleaned.replace(/^ {2}- /gm, '- ');
  cleaned = cleaned.replace(/^ {2}###/gm, '###');
  cleaned = cleaned.replace(/^ {2}(\S)/gm, '$1');

  // Strip commit hash prefixes added by the default changelog plugin.
  // Runs AFTER unwrapping so that originally-indented bullets (`  - abc1234: ...`)
  // also get stripped once they're flattened to top-level (`- abc1234: ...`).
  cleaned = cleaned.replace(/^- [a-f0-9]{7}: /gm, '- ');

  // Parse into categories
  let currentCategory: string | null = null;
  const lines = cleaned.split('\n');

  for (const line of lines) {
    const headerMatch = line.match(/^### (.+)$/);
    if (headerMatch) {
      currentCategory = headerMatch[1].trim();
      if (!categories.has(currentCategory)) {
        categories.set(currentCategory, []);
      }
      continue;
    }

    if (currentCategory && line.trim()) {
      categories.get(currentCategory)!.push(line);
    }
  }

  return categories;
}

function formatCategories(categories: Map<string, string[]>): string {
  const sections: string[] = [];

  for (const cat of CATEGORY_ORDER) {
    const items = categories.get(cat);
    if (items && items.length > 0) {
      sections.push(`### ${cat}\n\n${items.join('\n')}`);
    }
  }

  // Include any categories not in the standard order
  for (const [cat, items] of categories) {
    if (!CATEGORY_ORDER.includes(cat) && items.length > 0) {
      sections.push(`### ${cat}\n\n${items.join('\n')}`);
    }
  }

  return sections.join('\n\n');
}

const PREAMBLE = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

export function rewriteChangelog(content: string, today: string): string {
  const lines = content.split('\n');

  // Find the first unformatted ## version header (the new entry from changesets).
  // Changesets writes "## X.Y.Z", our formatted entries use "## [X.Y.Z] - date".
  const firstVersionIdx = lines.findIndex((l) => /^## \d/.test(l));
  if (firstVersionIdx === -1) {
    throw new Error('No version header found in CHANGELOG.md');
  }

  // Find the next ## header (start of previous version or preamble remnants)
  const nextVersionIdx = lines.findIndex(
    (l, i) => i > firstVersionIdx && /^## /.test(l)
  );

  const versionLine = lines[firstVersionIdx];
  const versionMatch = versionLine.match(/^## (\d+\.\d+\.\d+)/);
  if (!versionMatch) {
    throw new Error(`Could not parse version from: ${versionLine}`);
  }
  const version = versionMatch[1];

  // Extract the content between version headers.
  // Note: changesets may push our preamble text below the new entry,
  // so we strip any preamble lines from the content.
  const endIdx = nextVersionIdx === -1 ? lines.length : nextVersionIdx;
  const rawBody = lines.slice(firstVersionIdx + 1, endIdx).join('\n');
  const body = rawBody
    .replace(/^All notable changes.*$/gm, '')
    .replace(/^The format is based on.*$/gm, '')
    .replace(/^and this project adheres.*$/gm, '');

  // Parse and reformat
  const categories = parseCategories(body);
  const formatted = formatCategories(categories);

  // Build the new entry
  const newEntry = `## [${version}] - ${today}\n\n${formatted}`;

  // Reassemble with canonical preamble
  const after =
    nextVersionIdx === -1 ? '' : '\n' + lines.slice(nextVersionIdx).join('\n');

  return `${PREAMBLE}${newEntry}\n${after}`;
}

function run(): void {
  try {
    const changelog = readFileSync(CHANGELOG_PATH, 'utf-8');
    const today = todayISO();
    const result = rewriteChangelog(changelog, today);
    writeFileSync(CHANGELOG_PATH, result);
    console.error(`CHANGELOG.md: reformatted ${today}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

if (process.argv[1] === __filename) {
  run();
}
