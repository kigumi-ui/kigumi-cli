#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Story Interaction-Lane Checker
 *
 * PURPOSE: The interaction-test lane runs a curated subset of the stories.
 * That subset used to be typed out by hand in two files that must agree:
 * docs/.storybook-test/main.ts (the `stories` glob) and
 * docs/vitest.storybook.config.ts (`server.warmup.clientFiles`). Adding a
 * story to one and forgetting the other fails silently: the lane either skips
 * the story, or races the Vite deps optimizer and 404s on a cached
 * "?v=<hash>" URL.
 *
 * Both files now derive their list from
 * docs/.storybook-test/interaction-stories.ts, so they cannot disagree. What
 * this check adds is the other half: that the shared list matches the stories
 * actually tagged `interaction` on disk.
 *
 * CHECKS (all fail the build):
 * - Every story tagged `interaction` appears in the shared list
 * - Every entry in the shared list is a story file that exists and is tagged
 *
 * USAGE:
 *   pnpm validate:story-lanes
 *   tsx scripts/validate-story-lanes.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));
const STORIES_DIR = path.join(PROJECT_ROOT, 'docs', 'src', 'stories');
const LIST_FILE = path.join(
  PROJECT_ROOT,
  'docs',
  '.storybook-test',
  'interaction-stories.ts'
);

// ── Types ───────────────────────────────────────────────────────────────────

export interface LaneFinding {
  story: string;
  message: string;
}

export interface LaneResult {
  passed: boolean;
  findings: LaneFinding[];
  listed: string[];
  tagged: string[];
}

// ── Pure matchers ───────────────────────────────────────────────────────────

/**
 * Reads the component names out of the shared INTERACTION_STORIES array.
 * Pure so the parse is testable without a docs/ tree on disk.
 */
export function parseListedStories(source: string): string[] {
  const block = source.match(
    /INTERACTION_STORIES\s*=\s*\[([\s\S]*?)\]\s*as const/
  );
  if (!block) return [];
  return [...block[1].matchAll(/'([A-Za-z][A-Za-z0-9]*)'/g)].map((m) => m[1]);
}

/**
 * True when a story file opts into the interaction lane.
 *
 * Storybook tags are string literals in a `tags:` array, so a substring test
 * would also match the word inside a comment or a story title. This looks for
 * the quoted tag specifically.
 */
export function hasInteractionTag(source: string): boolean {
  return /tags:\s*\[[^\]]*'interaction'/.test(source);
}

/**
 * Compares the two sets and explains each mismatch.
 * Pure: takes the names, returns findings.
 */
export function diffLanes(listed: string[], tagged: string[]): LaneFinding[] {
  const findings: LaneFinding[] = [];
  const listedSet = new Set(listed);
  const taggedSet = new Set(tagged);

  for (const story of tagged) {
    if (!listedSet.has(story)) {
      findings.push({
        story,
        message: `${story}.stories.tsx is tagged 'interaction' but missing from INTERACTION_STORIES in docs/.storybook-test/interaction-stories.ts, so the lane never runs it. Add it there`,
      });
    }
  }

  for (const story of listed) {
    if (!taggedSet.has(story)) {
      findings.push({
        story,
        message: `INTERACTION_STORIES lists ${story}, but docs/src/stories/${story}.stories.tsx is absent or not tagged 'interaction'. Remove it from the list, or tag the story`,
      });
    }
  }

  return findings;
}

// ── Filesystem shell ────────────────────────────────────────────────────────

export function validateStoryLanes(): LaneResult {
  const listed = parseListedStories(fs.readFileSync(LIST_FILE, 'utf8'));

  const tagged = fs
    .readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith('.stories.tsx'))
    .filter((f) =>
      hasInteractionTag(fs.readFileSync(path.join(STORIES_DIR, f), 'utf8'))
    )
    .map((f) => f.replace('.stories.tsx', ''))
    .sort();

  const findings = diffLanes(listed, tagged);
  return { passed: findings.length === 0, findings, listed, tagged };
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: LaneResult): void {
  console.log(pc.cyan('\nValidating story interaction lanes...\n'));
  console.log(
    `  ${result.listed.length} listed in INTERACTION_STORIES, ${result.tagged.length} tagged on disk\n`
  );

  if (result.findings.length > 0) {
    console.log(pc.red(`Errors (${result.findings.length}):`));
    for (const f of result.findings) {
      console.log(pc.red(`  [${f.story}] ${f.message}`));
    }
    console.log('');
  }

  if (result.passed) {
    console.log(
      pc.green(
        `Story lane validation passed! All ${result.tagged.length} interaction-tagged stories are in the lane.\n`
      )
    );
  } else {
    console.log(
      pc.red(
        `Story lane validation failed with ${result.findings.length} error(s)\n`
      )
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  try {
    const result = validateStoryLanes();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during story lane validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
