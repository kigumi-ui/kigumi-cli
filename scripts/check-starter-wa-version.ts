#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Starter Web Awesome Version Check
 *
 * PURPOSE: The Starter job typechecks and builds a fixed nine-component set
 * (docs/adr/0004). All nine existed in Web Awesome 3.6.0, so the starters
 * stayed on 3.6.0 while the CLI moved to 3.13.0 and CI stayed green
 * (issue #138). This check fails the Starter job when the starter's installed
 * Web Awesome is older than DEFAULT_WEBAWESOME_VERSION.
 *
 * "Not older", not "equal": starters are bumped first (AGENTS.md, Web Awesome
 * version-bump checklist). An equality check would turn every PR's Starter job
 * red from the moment a starter merges its bump until the CLI bump lands.
 *
 * It reads the installed package, not the package.json range: the lockfile
 * decides what the starter actually builds against. A starter with no Web
 * Awesome installed fails; it is never reported as checked (docs/adr/0003).
 *
 * USAGE:
 *   KIGUMI_STARTER_DIR=/path/to/starter pnpm check:starter-wa-version
 *   pnpm check:starter-wa-version -- /path/to/starter
 */

import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import semver from 'semver';
import { DEFAULT_WEBAWESOME_VERSION } from '../src/constants.js';
import { isEntryPoint } from './is-entry-point.js';

// ── Types ───────────────────────────────────────────────────────────────────

export interface StarterWaVersionResult {
  passed: boolean;
  message: string;
}

const WEB_AWESOME_PACKAGES = [
  '@awesome.me/webawesome',
  '@awesome.me/webawesome-pro',
] as const;

// ── Check ───────────────────────────────────────────────────────────────────

export function readInstalledWebAwesomeVersion(
  starterDir: string
): string | null {
  for (const pkg of WEB_AWESOME_PACKAGES) {
    const manifest = path.join(starterDir, 'node_modules', pkg, 'package.json');
    if (fs.pathExistsSync(manifest)) {
      const { version } = fs.readJsonSync(manifest) as { version?: unknown };
      return typeof version === 'string' ? version : null;
    }
  }
  return null;
}

export function checkStarterWebAwesome(
  installed: string | null,
  target: string = DEFAULT_WEBAWESOME_VERSION
): StarterWaVersionResult {
  if (installed === null) {
    return {
      passed: false,
      message:
        'No Web Awesome package is installed in the starter. Run `pnpm install` there first.',
    };
  }
  if (!semver.valid(installed)) {
    return {
      passed: false,
      message: `Cannot read the starter's Web Awesome version "${installed}".`,
    };
  }
  if (semver.lt(installed, target)) {
    return {
      passed: false,
      message:
        `The starter is on Web Awesome ${installed}, the CLI targets ${target}. ` +
        'Bump the starter first (AGENTS.md, Web Awesome version-bump checklist).',
    };
  }
  return {
    passed: true,
    message: `The starter is on Web Awesome ${installed}, not older than ${target}.`,
  };
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  const starterDir = process.argv[2] ?? process.env.KIGUMI_STARTER_DIR;
  if (!starterDir) {
    console.error(
      pc.red(
        'Pass the starter directory as an argument or set KIGUMI_STARTER_DIR.'
      )
    );
    process.exit(1);
  }

  const result = checkStarterWebAwesome(
    readInstalledWebAwesomeVersion(path.resolve(starterDir))
  );
  console.log(
    result.passed ? pc.green(result.message) : pc.red(result.message)
  );
  process.exit(result.passed ? 0 : 1);
}

if (isEntryPoint(import.meta.url)) {
  main();
}
