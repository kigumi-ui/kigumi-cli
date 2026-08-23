#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Web Awesome Pin Consistency Checker
 *
 * PURPOSE: The Web Awesome version Kigumi targets is written down in six
 * independent places. Nothing kept them in agreement, so a bump that missed one
 * of them shipped silently. This check makes every location agree, or fails.
 *
 * CHECKS (all fail the build):
 * - All six pins name the same exact Web Awesome version
 * - Every pin is exact (no ^, ~ or range syntax): a Kigumi release is
 *   conformant to one specific WA version and must never auto-float
 * - The newest VERSION_MAP entry resolves to DEFAULT_WEBAWESOME_VERSION
 *
 * WHY THE LAST ONE MATTERS: `kigumi upgrade` writes
 * `getVersionEntry(target).webAwesomeVersion` into the user's config and
 * installs it (src/commands/upgrade.ts). `getVersionEntry` falls back to the
 * highest entry <= the requested version, so a WA bump that does not add a
 * VERSION_MAP entry makes `upgrade` install an older Web Awesome than the CLI
 * actually ships. Nothing else in the repo notices.
 *
 * The invariant is asserted against DEFAULT_WEBAWESOME_VERSION, never against a
 * hardcoded literal, so this check cannot rot into protecting a stale value.
 *
 * USAGE:
 *   pnpm validate:wa-pins
 *   node scripts/validate-wa-pins.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { DEFAULT_WEBAWESOME_VERSION } from '../src/constants.js';
import { VERSION_MAP } from '../src/utils/version-map.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));

// ── Types ───────────────────────────────────────────────────────────────────

export interface PinFinding {
  location: string;
  message: string;
}

export interface PinResult {
  passed: boolean;
  findings: PinFinding[];
  pins: Array<{ location: string; version: string | null }>;
}

const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

// ── Pin readers ─────────────────────────────────────────────────────────────

function readJson(rel: string): Record<string, unknown> | null {
  const abs = path.join(PROJECT_ROOT, rel);
  return fs.pathExistsSync(abs)
    ? (fs.readJsonSync(abs) as Record<string, unknown>)
    : null;
}

/** Read a dependency spec from any of the dependency blocks of a package.json. */
function readDependencyPin(rel: string, pkgName: string): string | null {
  const pkg = readJson(rel);
  if (!pkg) return null;

  for (const block of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    const deps = pkg[block] as Record<string, string> | undefined;
    const spec = deps?.[pkgName];
    if (typeof spec === 'string') return spec;
  }
  return null;
}

function readConfigPin(rel: string): string | null {
  const cfg = readJson(rel) as { webAwesome?: { version?: string } } | null;
  return cfg?.webAwesome?.version ?? null;
}

/**
 * Collect every location that names a Web Awesome version. Adding a seventh
 * location means adding it here, and the check then covers it everywhere.
 */
export function collectPins(): Array<{
  location: string;
  version: string | null;
}> {
  return [
    {
      location: 'package.json',
      version: readDependencyPin('package.json', '@awesome.me/webawesome'),
    },
    {
      location: 'docs/package.json',
      version: readDependencyPin(
        'docs/package.json',
        '@awesome.me/webawesome-pro'
      ),
    },
    {
      location: 'kigumi.config.json',
      version: readConfigPin('kigumi.config.json'),
    },
    {
      location: 'docs/kigumi.config.json',
      version: readConfigPin('docs/kigumi.config.json'),
    },
    {
      location: 'src/constants.ts (DEFAULT_WEBAWESOME_VERSION)',
      version: DEFAULT_WEBAWESOME_VERSION,
    },
    {
      location: 'src/utils/version-map.ts (newest entry)',
      version: VERSION_MAP[0]?.webAwesomeVersion ?? null,
    },
  ];
}

// ── Checks ──────────────────────────────────────────────────────────────────

export function validateWaPins(): PinResult {
  const pins = collectPins();
  const findings: PinFinding[] = [];

  for (const { location, version } of pins) {
    if (version === null) {
      findings.push({
        location,
        message: 'no Web Awesome version found at this location',
      });
      continue;
    }

    if (!EXACT_VERSION.test(version)) {
      findings.push({
        location,
        message: `"${version}" is not an exact version. Kigumi releases target one specific Web Awesome version and must never auto-float`,
      });
      continue;
    }

    if (version !== DEFAULT_WEBAWESOME_VERSION) {
      findings.push({
        location,
        message: `pinned to ${version}, but DEFAULT_WEBAWESOME_VERSION is ${DEFAULT_WEBAWESOME_VERSION}`,
      });
    }
  }

  // The upgrade-path invariant, stated against the constant rather than a
  // literal so it cannot rot into protecting a stale value.
  const newest = VERSION_MAP[0];
  if (!newest) {
    findings.push({
      location: 'src/utils/version-map.ts',
      message: 'VERSION_MAP is empty',
    });
  } else if (newest.webAwesomeVersion !== DEFAULT_WEBAWESOME_VERSION) {
    findings.push({
      location: 'src/utils/version-map.ts',
      message: `newest entry (kigumi ${newest.kigumiVersion}) maps to Web Awesome ${newest.webAwesomeVersion}, but the CLI ships ${DEFAULT_WEBAWESOME_VERSION}. "kigumi upgrade" would install ${newest.webAwesomeVersion}. Add a VERSION_MAP entry for the release that introduced ${DEFAULT_WEBAWESOME_VERSION}`,
    });
  }

  return { passed: findings.length === 0, findings, pins };
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: PinResult): void {
  console.log(pc.cyan('\nValidating Web Awesome pin consistency...\n'));

  console.log(pc.bold('Pins:'));
  for (const { location, version } of result.pins) {
    const shown = version ?? '(missing)';
    const ok = version === DEFAULT_WEBAWESOME_VERSION;
    console.log(
      `  ${ok ? pc.green('OK ') : pc.red('BAD')} ${shown.padEnd(12)} ${location}`
    );
  }
  console.log('');

  if (result.findings.length > 0) {
    console.log(pc.red(`Errors (${result.findings.length}):`));
    for (const f of result.findings) {
      console.log(pc.red(`  [${f.location}] ${f.message}`));
    }
    console.log('');
    console.log(
      pc.yellow(
        'Fix: bring every location to the same exact version. When bumping Web\n' +
          'Awesome, DEFAULT_WEBAWESOME_VERSION and the newest VERSION_MAP entry\n' +
          'must move together, or "kigumi upgrade" installs the older one.\n'
      )
    );
  }

  if (result.passed) {
    console.log(
      pc.green(
        `Web Awesome pin consistency passed! All ${result.pins.length} locations agree on ${DEFAULT_WEBAWESOME_VERSION}.\n`
      )
    );
  } else {
    console.log(
      pc.red(`Pin validation failed with ${result.findings.length} error(s)\n`)
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  try {
    const result = validateWaPins();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during pin validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
