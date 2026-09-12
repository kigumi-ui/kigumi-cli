#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Keep a cache key that lives in two workflows from drifting apart.
 *
 * GitHub scopes a cache written on a PR branch to that PR's ref, so only a
 * save on the default branch is visible to other branches. The Playwright
 * browser cache is therefore written by cache-warm.yml on pushes to main and
 * read by ci.yml on pull requests. That only works while both use the same
 * key and path.
 *
 * Drift here is silent in the worst way: CI still passes, it just downloads
 * 249 MB of browser on every run, which is indistinguishable from the cache
 * step not existing. The failure this guards against already happened once,
 * as PR-scoped saves that nothing could ever read.
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const WORKFLOWS = path.join(PROJECT_ROOT, '.github/workflows');

/**
 * A cache that one workflow writes on the default branch for another to read.
 * `producer` must run on `push` to main, or the entry is never visible.
 */
interface SharedCache {
  name: string;
  producer: string;
  consumer: string;
  /** Matches the `key:` line, so a changed hash input is caught too. */
  keyPattern: RegExp;
  pathPattern: RegExp;
}

const SHARED_CACHES: SharedCache[] = [
  {
    name: 'Playwright browsers',
    producer: 'cache-warm.yml',
    consumer: 'ci.yml',
    keyPattern: /key:\s*(playwright-chromium-\$\{\{[^}]*\}\})/,
    pathPattern: /path:\s*(\S*ms-playwright\S*|\S*playwright\S*)/,
  },
];

export interface CacheKeyFinding {
  cache: string;
  message: string;
}

/**
 * Compare one shared cache across its two workflows.
 *
 * Exported for testing: the rule matters more than the current pair, and a
 * table test can feed it sources that disagree without editing real
 * workflows.
 */
export function compareCacheDefinition(
  cache: SharedCache,
  producerSource: string,
  consumerSource: string
): CacheKeyFinding[] {
  const findings: CacheKeyFinding[] = [];

  const producerKey = producerSource.match(cache.keyPattern)?.[1];
  const consumerKey = consumerSource.match(cache.keyPattern)?.[1];
  const producerPath = producerSource.match(cache.pathPattern)?.[1];
  const consumerPath = consumerSource.match(cache.pathPattern)?.[1];

  if (!producerKey) {
    findings.push({
      cache: cache.name,
      message: `${cache.producer} no longer defines the cache key. Nothing writes this cache on the default branch, so ${cache.consumer} can never hit it.`,
    });
  }

  if (!consumerKey) {
    findings.push({
      cache: cache.name,
      message: `${cache.consumer} no longer defines the cache key, so the entry ${cache.producer} writes is never read.`,
    });
  }

  if (producerKey && consumerKey && producerKey !== consumerKey) {
    findings.push({
      cache: cache.name,
      message: `Key drift.\n      ${cache.producer}: ${producerKey}\n      ${cache.consumer}: ${consumerKey}`,
    });
  }

  if (!producerPath || !consumerPath) {
    findings.push({
      cache: cache.name,
      message: `Cache path missing in ${!producerPath ? cache.producer : cache.consumer}. The two steps must cache the same directory.`,
    });
  } else if (producerPath !== consumerPath) {
    findings.push({
      cache: cache.name,
      message: `Path drift.\n      ${cache.producer}: ${producerPath}\n      ${cache.consumer}: ${consumerPath}`,
    });
  }

  return findings;
}

/**
 * True when a workflow triggers on a push to the default branch, which is the
 * only way its cache saves become visible to pull requests.
 */
export function runsOnPushToMain(source: string): boolean {
  const onBlock = source.match(
    /^on:\n([\s\S]*?)(?=^(?:permissions|concurrency|jobs|env):)/m
  );
  if (!onBlock) return false;

  // Isolate the `push:` trigger from the others under `on:`, then look for
  // a main entry in its branch filter. Scoping to the block matters: a
  // `pull_request` trigger also carries `branches: [main]`, and matching
  // that would report every PR-only workflow as safe.
  const push = onBlock[1].match(/^ {2}push:\n((?:^ {4}.*\n|^[ \t]*\n)*)/m);
  if (!push) return false;

  return /^ {4}branches:\s*\[[^\]]*\bmain\b/m.test(push[1]);
}

export async function validateCacheKeys(): Promise<CacheKeyFinding[]> {
  const findings: CacheKeyFinding[] = [];

  for (const cache of SHARED_CACHES) {
    const producerPath = path.join(WORKFLOWS, cache.producer);
    const consumerPath = path.join(WORKFLOWS, cache.consumer);

    if (!(await fs.pathExists(producerPath))) {
      findings.push({
        cache: cache.name,
        message: `${cache.producer} is missing. Without it nothing writes this cache on the default branch.`,
      });
      continue;
    }

    const producerSource = await fs.readFile(producerPath, 'utf-8');
    const consumerSource = await fs.readFile(consumerPath, 'utf-8');

    if (!runsOnPushToMain(producerSource)) {
      findings.push({
        cache: cache.name,
        message: `${cache.producer} no longer runs on pushes to main, so its cache saves are scoped to the triggering ref and ${cache.consumer} can never read them.`,
      });
    }

    findings.push(
      ...compareCacheDefinition(cache, producerSource, consumerSource)
    );
  }

  return findings;
}

function printResults(findings: CacheKeyFinding[]): void {
  console.log(pc.cyan('\nValidating shared cache keys...\n'));

  if (findings.length === 0) {
    console.log(
      pc.green(
        `Cache key validation passed! ${SHARED_CACHES.length} shared cache(s) consistent.\n`
      )
    );
    return;
  }

  for (const f of findings) {
    console.log(pc.red(`  ${f.cache}: ${f.message}`));
  }
  console.log('');
  console.log(
    pc.yellow(
      'A cache is only shared while the producer writes it on the default\n' +
        'branch under the same key the consumer looks up. When that breaks, CI\n' +
        'still passes and silently re-downloads instead.\n'
    )
  );
  console.log(
    pc.red(`Cache key validation failed with ${findings.length} error(s)\n`)
  );
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    const findings = await validateCacheKeys();
    printResults(findings);
    process.exit(findings.length === 0 ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during cache key validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
