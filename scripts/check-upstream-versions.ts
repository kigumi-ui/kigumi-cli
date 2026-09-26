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
 * - The pinned create-vite version (test scaffold fixture, issue #98)
 *   against the latest published release. Not in package.json — invoked
 *   via `pnpm create`, not installed — so Dependabot cannot see it.
 * - The declared range for tracked toolchain packages against the latest
 *   published major, which is where the breaking changes live, EXCLUDING
 *   majors already recorded in `scripts/upstream-holds.json` — a major that
 *   was evaluated and is being deliberately held (e.g. TypeScript 7 removing
 *   `baseUrl`, Vitest 5 collapsing mutation score) is a decision already
 *   made, not new information, and re-reporting it every week trains the
 *   reader to stop opening the report.
 *
 * Web Awesome is NOT reported here. `wa-upgrade` (in the same workflow)
 * already tracks it precisely — comparing the published CEM against the pin
 * and describing what an upgrade would touch — and only comments when the
 * version actually changes. Counting WA drift in this script's `drift`
 * output too would post the same release twice, once per job, every week
 * WA has shipped a minor/patch nobody has taken yet.
 *
 * This script always exits 0. An upstream release is information, not a break.
 * A new, not-yet-held major landing is exactly the thing worth a weekly
 * heads-up, and exactly the thing that must never turn the repo red on its
 * own.
 *
 * WHAT IS DELIBERATELY NOT DONE:
 * - Updating anything. Dependabot already opens dependency PRs; Web Awesome is
 *   deliberately excluded from it because a bump there is a coordinated effort
 *   touching registry, templates, docs and fixtures at once.
 * - Expiring a hold automatically. `scripts/upstream-holds.json` is edited by
 *   hand when the held package is upgraded or a newer major appears above the
 *   held version; there is no TTL, because "still holding" is a fact about
 *   this repo, not about how much time has passed.
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
const HOLDS_PATH = path.join(path.dirname(__filename), 'upstream-holds.json');

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

export interface UpstreamHold {
  upTo: string;
  reason: string;
}

export type UpstreamHolds = Record<string, UpstreamHold>;

/**
 * Read `scripts/upstream-holds.json`. An absent file means nothing is held —
 * every package reports normally.
 */
export function readHolds(holdsPath = HOLDS_PATH): UpstreamHolds {
  if (!fs.existsSync(holdsPath)) {
    return {};
  }
  return fs.readJsonSync(holdsPath) as UpstreamHolds;
}

/**
 * True when `latest` is a version this repo already knows about and is
 * deliberately not taking yet. Compares by major only: a hold recorded
 * against 7.0.2 still covers 7.1.0, since the reason for holding (baseUrl
 * removed, mutation score collapsed) is a property of the major, not the
 * exact patch that was on npm the week the hold was written. A newer major
 * than the held one (8.x when the hold says 7.0.2) is NOT covered — that is
 * new information the hold has never seen.
 */
export function isHeld(
  latest: string,
  hold: UpstreamHold | undefined
): boolean {
  if (!hold) {
    return false;
  }
  const heldMajor = majorOf(hold.upTo);
  const latestMajor = majorOf(latest);
  if (heldMajor === null || latestMajor === null) {
    return false;
  }
  return latestMajor === heldMajor;
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

/**
 * Read the create-vite pin out of the constant that owns it (issue #98).
 * Not in package.json — `create-vite` is invoked via `pnpm create`, not
 * installed as a dependency — so Dependabot cannot see it; this weekly
 * report is the only drift signal for it.
 */
export function readCreateVitePin(source: string): string | null {
  const match = /CREATE_VITE_VERSION\s*=\s*'([^']+)'/.exec(source);
  return match ? match[1]! : null;
}

export interface DriftReport {
  createVite: VersionDrift | null;
  toolchain: VersionDrift[];
  /** Toolchain majors that exist upstream but are suppressed by a hold. */
  held: VersionDrift[];
  unreachable: string[];
}

export async function checkUpstreamVersions(
  holds: UpstreamHolds = readHolds()
): Promise<DriftReport> {
  const unreachable: string[] = [];

  const constantsPath = path.join(PROJECT_ROOT, 'src', 'constants.ts');
  const pinnedCreateVite = fs.existsSync(constantsPath)
    ? readCreateVitePin(fs.readFileSync(constantsPath, 'utf8'))
    : null;

  let createVite: VersionDrift | null = null;
  if (pinnedCreateVite) {
    const latest = await latestVersion('create-vite');
    if (latest === null) {
      unreachable.push('create-vite');
    } else if (latest !== pinnedCreateVite) {
      createVite = {
        name: 'create-vite',
        current: pinnedCreateVite,
        latest,
        majorBump: isMajorBump(pinnedCreateVite, latest),
      };
    }
  }

  const pkg = fs.readJsonSync(path.join(PROJECT_ROOT, 'package.json')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };

  const toolchain: VersionDrift[] = [];
  const held: VersionDrift[] = [];
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
    if (!isMajorBump(current, latest)) {
      continue;
    }
    const drift: VersionDrift = { name, current, latest, majorBump: true };
    if (isHeld(latest, holds[name])) {
      held.push(drift);
    } else {
      toolchain.push(drift);
    }
  }

  return { createVite, toolchain, held, unreachable };
}

function printReport(report: DriftReport): void {
  console.log(pc.cyan('\nComparing pinned versions against the registry...\n'));

  if (report.createVite) {
    const { current, latest, majorBump } = report.createVite;
    const label = majorBump ? pc.yellow('major') : pc.dim('minor/patch');
    console.log(
      `  ${pc.yellow('create-vite')}  ${current} -> ${latest}  (${label})`
    );
  } else {
    console.log(pc.green('  create-vite is on the latest published version.'));
  }

  if (report.toolchain.length > 0) {
    console.log(pc.yellow('\n  Toolchain majors available:'));
    for (const drift of report.toolchain) {
      console.log(`    ${drift.name}: ${drift.current} -> ${drift.latest}`);
    }
  } else {
    console.log(pc.green('  No new toolchain major bumps pending.'));
  }

  if (report.held.length > 0) {
    console.log(pc.dim('\n  Held (already triaged, not re-reported):'));
    for (const drift of report.held) {
      console.log(
        pc.dim(`    ${drift.name}: ${drift.current} -> ${drift.latest}`)
      );
    }
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
      const driftCount = (report.createVite ? 1 : 0) + report.toolchain.length;
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `drift=${driftCount > 0 ? '1' : '0'}\n`
      );
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
