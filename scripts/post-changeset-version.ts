/**
 * Post-processor for `changeset version` output.
 * Transforms the latest CHANGELOG.md entry from changesets format
 * into Keep a Changelog format, and bumps the `**Version**:` marker in
 * AGENTS.md to match the freshly-bumped package.json version (kept in sync
 * so `validate-agents` stays green without a manual edit).
 *
 * Run via: pnpm version (package.json: "changeset version && tsx scripts/post-changeset-version.ts")
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const CHANGELOG_PATH = resolve(import.meta.dirname, '..', 'CHANGELOG.md');
const AGENTS_PATH = resolve(import.meta.dirname, '..', 'AGENTS.md');

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

  // Strip commit hash prefixes added by the default changelog plugin, at both
  // the top-level (`- 91101c4: ...`) and changeset-indented (`  - 91101c4: ...`)
  // positions. MUST run BEFORE the `- ###` unwrap below: changesets emits a
  // changeset whose summary leads with a category header as
  // `- <hash>: ### Changed`, and only once the hash is stripped to
  // `- ### Changed` can the next step unwrap it into a real `### Changed`
  // heading. Stripping last instead left `- ### Changed` intact, which dropped
  // every changeset's leading category section.
  cleaned = cleaned.replace(/^(\s*)- [a-f0-9]{7,}: /gm, '$1- ');

  // Unwrap indented content from changeset bullet wrapping:
  // "- ### Added\n  - item" becomes "### Added\n- item"
  cleaned = cleaned.replace(/^- ###/gm, '###');
  cleaned = cleaned.replace(/^ {2}- /gm, '- ');
  cleaned = cleaned.replace(/^ {2}###/gm, '###');
  cleaned = cleaned.replace(/^ {2}(\S)/gm, '$1');

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

/**
 * Extract the freshly-bumped version from the latest changesets header
 * (`## X.Y.Z`, before {@link rewriteChangelog} rewrites it to `## [X.Y.Z] - date`).
 */
export function parseLatestVersion(content: string): string {
  const header = content.split('\n').find((l) => /^## \d/.test(l));
  if (header === undefined) {
    throw new Error('No version header found in CHANGELOG.md');
  }
  const match = header.match(/^## (\d+\.\d+\.\d+)/);
  if (!match) {
    throw new Error(`Could not parse version from: ${header}`);
  }
  return match[1];
}

/**
 * Rewrite the `**Version**: X.Y.Z` marker in AGENTS.md to `version`,
 * preserving the rest of the line. No-op when the marker is absent or already
 * matches. Mirrors the regex `validate-agents.ts` uses to read the marker.
 */
export function bumpAgentsVersion(agentsText: string, version: string): string {
  return agentsText.replace(
    /(\*\*Version\*\*:\s*)[\d.]+(?:-[a-zA-Z0-9.]+)?(\s*\|)/,
    `$1${version}$2`
  );
}

function run(): void {
  try {
    const changelog = readFileSync(CHANGELOG_PATH, 'utf-8');
    const today = todayISO();
    const version = parseLatestVersion(changelog);
    const result = rewriteChangelog(changelog, today);
    writeFileSync(CHANGELOG_PATH, result);
    console.error(`CHANGELOG.md: reformatted ${today}`);

    const agents = readFileSync(AGENTS_PATH, 'utf-8');
    const bumpedAgents = bumpAgentsVersion(agents, version);
    if (bumpedAgents !== agents) {
      writeFileSync(AGENTS_PATH, bumpedAgents);
      console.error(`AGENTS.md: bumped version to ${version}`);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

if (process.argv[1] === __filename) {
  run();
}
