#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Upstream Version Drift Reporter
 *
 * PURPOSE: `validate:wa-pins` checks that the Web Awesome version is
 * consistent across the six places this repo names it. Nothing asks npm
 * whether a *newer* version exists. The same blind spot covers the toolchain:
 * TypeScript removing `baseUrl` in 7.0 broke `kigumi init` without any file in
 * this repo changing, and no change-triggered check could have seen it coming.
 *
 * REPORTS (never fails the build):
 * - The pinned Web Awesome version against the latest published release.
 * - The declared range for tracked toolchain packages against the latest
 *   published major, which is where the breaking changes live.
 *
 * This script always exits 0. An upstream release is information, not a break.
 * A new major landing is exactly the thing worth a weekly heads-up, and
 * exactly the thing that must never turn the repo red on its own.
 *
 * WHAT IS DELIBERATELY NOT DONE:
 * - Updating anything. Dependabot already opens dependency PRs; Web Awesome is
 *   deliberately excluded from it because a bump there is a coordinated effort
 *   touching registry, templates, docs and fixtures at once.
 *
 * USAGE:
 *   pnpm check:upstream-versions
 *   tsx scripts/check-upstream-versions.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));

/**
 * Toolchain packages whose major bumps have historically broken this repo.
 * TypeScript is here because 7.0 removing `baseUrl` is the reason this check
 * exists at all.
 */
const TRACKED_PACKAGES: readonly string[] = [
  'typescript',
  'tsup',
  'vitest',
  'commander',
];

const REGISTRY = 'https://registry.npmjs.org';
const TIMEOUT_MS = 15_000;

export interface VersionDrift {
  name: string;
  current: string;
  latest: string;
  majorBump: boolean;
}

/**
 * Strip a semver range down to the version it is anchored on, so `^6.0.3`
 * compares against a bare `7.0.0` without pulling in a semver dependency for
 * a report that only needs the leading number.
 */
export function parsePinned(range: string): string {
  return range.replace(/^[\^~>=<\s]+/, '').trim();
}

/** The leading number of a version string, or null when it is unparseable. */
export function majorOf(version: string): number | null {
  const match = /^(\d+)\./.exec(version);
  return match ? Number.parseInt(match[1]!, 10) : null;
}

/**
 * True when latest crosses a major boundary above current. That is the signal
 * worth a heads-up; a patch release upstream is noise at this cadence.
 */
export function isMajorBump(current: string, latest: string): boolean {
  const a = majorOf(current);
  const b = majorOf(latest);
  if (a === null || b === null) {
    return false;
  }
  return b > a;
}

async function latestVersion(name: string): Promise<string | null> {
  try {
    const response = await fetch(`${REGISTRY}/${name}/latest`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as { version?: string };
    return body.version ?? null;
  } catch {
    return null;
  }
}

/** Read the Web Awesome pin out of the constant that owns it. */
export function readWebAwesomePin(source: string): string | null {
  const match = /DEFAULT_WEBAWESOME_VERSION\s*=\s*'([^']+)'/.exec(source);
  return match ? match[1]! : null;
}

export interface DriftReport {
  webAwesome: VersionDrift | null;
  toolchain: VersionDrift[];
  unreachable: string[];
}

export async function checkUpstreamVersions(): Promise<DriftReport> {
  const unreachable: string[] = [];

  const constantsPath = path.join(PROJECT_ROOT, 'src', 'constants.ts');
  const pinnedWa = fs.existsSync(constantsPath)
    ? readWebAwesomePin(fs.readFileSync(constantsPath, 'utf8'))
    : null;

  let webAwesome: VersionDrift | null = null;
  if (pinnedWa) {
    const latest = await latestVersion('@awesome.me/webawesome');
    if (latest === null) {
      unreachable.push('@awesome.me/webawesome');
    } else if (latest !== pinnedWa) {
      webAwesome = {
        name: '@awesome.me/webawesome',
        current: pinnedWa,
        latest,
        majorBump: isMajorBump(pinnedWa, latest),
      };
    }
  }

  const pkg = fs.readJsonSync(path.join(PROJECT_ROOT, 'package.json')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };

  const toolchain: VersionDrift[] = [];
  for (const name of TRACKED_PACKAGES) {
    const range = declared[name];
    if (!range) {
      continue;
    }
    const current = parsePinned(range);
    const latest = await latestVersion(name);
    if (latest === null) {
      unreachable.push(name);
      continue;
    }
    if (isMajorBump(current, latest)) {
      toolchain.push({ name, current, latest, majorBump: true });
    }
  }

  return { webAwesome, toolchain, unreachable };
}

function printReport(report: DriftReport): void {
  console.log(pc.cyan('\nComparing pinned versions against the registry...\n'));

  if (report.webAwesome) {
    const { current, latest, majorBump } = report.webAwesome;
    const label = majorBump ? pc.yellow('major') : pc.dim('minor/patch');
    console.log(
      `  ${pc.yellow('Web Awesome')}  ${current} -> ${latest}  (${label})`
    );
  } else {
    console.log(pc.green('  Web Awesome is on the latest published version.'));
  }

  if (report.toolchain.length > 0) {
    console.log(pc.yellow('\n  Toolchain majors available:'));
    for (const drift of report.toolchain) {
      console.log(`    ${drift.name}: ${drift.current} -> ${drift.latest}`);
    }
  } else {
    console.log(pc.green('  No toolchain major bumps pending.'));
  }

  if (report.unreachable.length > 0) {
    console.log(
      pc.dim(
        `\n  Could not reach the registry for: ${report.unreachable.join(', ')}`
      )
    );
  }

  console.log(
    pc.dim('\nReported, not failed. An upstream release is information.\n')
  );
}

async function main(): Promise<void> {
  try {
    const report = await checkUpstreamVersions();
    printReport(report);

    if (process.env.GITHUB_OUTPUT) {
      const driftCount = (report.webAwesome ? 1 : 0) + report.toolchain.length;
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `drift=${driftCount > 0 ? '1' : '0'}\n`
      );
      if (report.webAwesome) {
        fs.appendFileSync(
          process.env.GITHUB_OUTPUT,
          `wa_current=${report.webAwesome.current}\nwa_latest=${report.webAwesome.latest}\n`
        );
      }
    }
  } catch (error) {
    console.error(
      pc.yellow(
        `Upstream version check could not complete: ${
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
