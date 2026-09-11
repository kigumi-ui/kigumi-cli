#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * External Link Reporter
 *
 * PURPOSE: `validate:doc-links` deliberately checks only relative links,
 * because reaching the network during a build makes it flaky and turns someone
 * else's outage into a failed build here. That leaves external URLs unchecked:
 * README.md and NOTICE point readers at documentation that can 404 without
 * anything here noticing.
 *
 * Weekly is the right cadence for the network. A dead link is worth knowing
 * about, just not worth blocking a merge on.
 *
 * REPORTS (never fails the build):
 * - Every external URL in README.md and NOTICE is requested, and the ones that
 *   do not respond successfully are printed as a report.
 *
 * This script always exits 0. An upstream outage is information, not a break,
 * and a third-party server having a bad day must never turn this repo red.
 * The caller decides what to do with the report.
 *
 * WHAT IS DELIBERATELY NOT CHECKED:
 * - Placeholder URLs. `https://github.com/user/my-registry` is an example of
 *   the shape of a registry URL in the docs, not a claim that it resolves.
 * - Anything outside README.md and NOTICE. Those two are what npm and GitHub
 *   render, so a dead link there is the one a stranger actually hits.
 *
 * USAGE:
 *   pnpm check:external-links
 *   tsx scripts/check-external-links.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));

/**
 * The files a stranger actually reads: README.md renders on npm and on the
 * repository landing page, NOTICE carries the attribution links.
 */
const CHECKED_FILES: readonly string[] = ['README.md', 'NOTICE'];

/**
 * URLs that are examples of a shape rather than claims that a page exists.
 * Matched as a prefix, so a placeholder host covers every path under it.
 */
const PLACEHOLDER_PREFIXES: readonly string[] = [
  'https://github.com/user/',
  'https://example.com',
];

const URL_PATTERN = /https?:\/\/[^\s)>"'`\]]+/g;

/** How long a single request may take before it counts as unreachable. */
const TIMEOUT_MS = 15_000;

/** Pause between requests, so a run does not read as a burst to one host. */
const REQUEST_DELAY_MS = 500;

/** Longer pause before the single retry a failing URL is given. */
const RETRY_DELAY_MS = 3_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface LinkResult {
  url: string;
  status: number | null;
  detail: string;
}

/**
 * True when the URL stands in for a real one in an example, so a failure to
 * resolve it says nothing about the health of the docs.
 */
export function isPlaceholder(url: string): boolean {
  return PLACEHOLDER_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/**
 * Trailing punctuation is part of the sentence, not the URL. Markdown link
 * syntax also lets a URL run into a following `](`, which yields a
 * doubled-up string that is not a real address.
 */
export function normalizeUrl(raw: string): string {
  let url = raw.replace(/[.,;:]+$/, '');
  const markdownSeam = url.indexOf('](');
  if (markdownSeam !== -1) {
    url = url.slice(0, markdownSeam);
  }
  return url;
}

/**
 * Pull every distinct external URL out of the given text, dropping
 * placeholders and repairing markdown seams.
 */
export function extractUrls(text: string): string[] {
  const found = text.match(URL_PATTERN) ?? [];
  const cleaned = found.map(normalizeUrl).filter((url) => !isPlaceholder(url));
  return [...new Set(cleaned)].sort();
}

/**
 * Probe one URL. HEAD first because it is cheaper, falling back to GET: some
 * servers answer HEAD with 405 while serving the page perfectly well.
 */
async function probe(url: string): Promise<LinkResult> {
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const response = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.ok) {
        return { url, status: response.status, detail: 'ok' };
      }
      // A 405 on HEAD is a statement about the method, not the page.
      if (method === 'HEAD' && response.status === 405) {
        continue;
      }
      return {
        url,
        status: response.status,
        detail: `HTTP ${response.status}`,
      };
    } catch (error) {
      if (method === 'GET') {
        const detail =
          error instanceof Error ? error.message : 'request failed';
        return { url, status: null, detail };
      }
    }
  }
  return { url, status: null, detail: 'request failed' };
}

export interface ExternalLinkReport {
  checked: number;
  failures: LinkResult[];
}

export async function checkExternalLinks(): Promise<ExternalLinkReport> {
  const urls = new Set<string>();

  for (const file of CHECKED_FILES) {
    const absolute = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(absolute)) {
      continue;
    }
    const text = fs.readFileSync(absolute, 'utf8');
    for (const url of extractUrls(text)) {
      urls.add(url);
    }
  }

  const sorted = [...urls].sort();

  // Sequential with a pause between requests. Firing every URL at once reads
  // as a burst to the host and earns a rate-limit response, which looks
  // exactly like a dead link in the report. A weekly job that cries wolf is
  // worse than no job, so the checker stays slow and polite.
  const results: LinkResult[] = [];
  for (const url of sorted) {
    let result = await probe(url);
    if (result.detail !== 'ok') {
      // One retry, after a longer pause: a single failure is more often
      // throttling or a blip than a genuinely missing page.
      await delay(RETRY_DELAY_MS);
      result = await probe(url);
    }
    results.push(result);
    await delay(REQUEST_DELAY_MS);
  }

  return {
    checked: sorted.length,
    failures: results.filter((result) => result.detail !== 'ok'),
  };
}

function printReport(report: ExternalLinkReport): void {
  console.log(
    pc.cyan('\nChecking external links in README.md and NOTICE...\n')
  );

  if (report.failures.length === 0) {
    console.log(
      pc.green(`All ${report.checked} external links responded successfully.\n`)
    );
    return;
  }

  console.log(
    pc.yellow(
      `${report.failures.length} of ${report.checked} external links did not respond successfully:\n`
    )
  );
  for (const failure of report.failures) {
    console.log(`  ${pc.yellow(failure.detail.padEnd(24))} ${failure.url}`);
  }
  console.log(
    pc.dim(
      '\nReported, not failed. An upstream outage is information, not a break.\n'
    )
  );
}

async function main(): Promise<void> {
  try {
    const report = await checkExternalLinks();
    printReport(report);

    // Surface the result for a workflow step without ever failing the build.
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `failures=${report.failures.length}\n`
      );
    }
  } catch (error) {
    // Even an unexpected crash must not turn the repo red: this job reports.
    console.error(
      pc.yellow(
        `External link check could not complete: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
