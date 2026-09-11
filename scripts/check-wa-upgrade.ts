#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Web Awesome Upgrade Reporter
 *
 * PURPOSE: Web Awesome is the one dependency Dependabot is explicitly told to
 * leave alone, because a bump is not a version string: it touches the
 * registry, the templates, the docs and the fixtures at once, and
 * `validate:wa-pins` guards six separate places that name the version. That
 * exclusion is deliberate, and this script is built around it rather than
 * through it.
 *
 * The cost of the exclusion is that nobody notices a release. This closes
 * that gap without touching the pin: it fetches the published package,
 * compares its custom-elements manifest against the pinned one, and reports
 * what an upgrade would actually mean.
 *
 * REPORTS (never fails the build):
 * - Components added and removed between the pinned and latest versions.
 * - Attributes removed, or whose type changed, on components that exist in
 *   both. Those are where a bump breaks generated wrappers.
 * - The six pin locations an upgrade has to update.
 *
 * This script always exits 0. A release upstream is information, and the
 * decision to take it stays a human one.
 *
 * WHY THE FREE PACKAGE: the Pro package carries the same manifest but needs a
 * token. Component and attribute shape is identical across both, so reading
 * the free tarball keeps this job credential-free.
 *
 * USAGE:
 *   pnpm check:wa-upgrade
 *   tsx scripts/check-wa-upgrade.ts
 */

import { execFileSync } from 'node:child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import pc from 'picocolors';
import { collectPins } from './validate-wa-pins.js';
import { DEFAULT_WEBAWESOME_VERSION } from '../src/constants.js';

const PACKAGE = '@awesome.me/webawesome';
const CEM_SUBPATH = 'package/dist/custom-elements.json';

// ── Types ───────────────────────────────────────────────────────────────────

export interface AttributeChange {
  component: string;
  attribute: string;
  from: string;
  to: string;
}

export interface UpgradeReport {
  current: string;
  latest: string;
  upToDate: boolean;
  addedComponents: string[];
  removedComponents: string[];
  removedAttributes: string[];
  changedAttributes: AttributeChange[];
  pinLocations: string[];
}

// ── Manifest reading ────────────────────────────────────────────────────────

/**
 * Every custom element tag the manifest declares. A component the manifest
 * does not name cannot be wrapped, so this is the unit an upgrade adds or
 * takes away.
 */
export function tagNames(manifest: unknown): string[] {
  const modules =
    (manifest as { modules?: Array<{ declarations?: unknown[] }> }).modules ??
    [];
  const tags = new Set<string>();
  for (const module of modules) {
    for (const declaration of module.declarations ?? []) {
      const tag = (declaration as { tagName?: string }).tagName;
      if (tag) {
        tags.add(tag);
      }
    }
  }
  return [...tags].sort();
}

/**
 * Flatten the manifest to `tag.attribute -> declared type`. Comparing this
 * map across two versions is what turns "a release happened" into "this is
 * what would break".
 */
export function attributeTypes(manifest: unknown): Map<string, string> {
  const modules =
    (manifest as { modules?: Array<{ declarations?: unknown[] }> }).modules ??
    [];
  const types = new Map<string, string>();
  for (const module of modules) {
    for (const declaration of module.declarations ?? []) {
      const dec = declaration as {
        tagName?: string;
        attributes?: Array<{ name?: string; type?: { text?: string } }>;
      };
      if (!dec.tagName) {
        continue;
      }
      for (const attribute of dec.attributes ?? []) {
        if (attribute.name) {
          types.set(
            `${dec.tagName}.${attribute.name}`,
            attribute.type?.text ?? ''
          );
        }
      }
    }
  }
  return types;
}

/**
 * Compare two manifests. Attribute findings are limited to components present
 * in both versions: an attribute "missing" because its whole component was
 * removed is already reported as a removed component, and repeating it as an
 * attribute finding would bury the signal.
 */
export function diffManifests(
  pinned: unknown,
  latest: unknown
): Pick<
  UpgradeReport,
  | 'addedComponents'
  | 'removedComponents'
  | 'removedAttributes'
  | 'changedAttributes'
> {
  const before = new Set(tagNames(pinned));
  const after = new Set(tagNames(latest));

  const addedComponents = [...after].filter((tag) => !before.has(tag)).sort();
  const removedComponents = [...before].filter((tag) => !after.has(tag)).sort();

  const survivors = new Set([...before].filter((tag) => after.has(tag)));
  const beforeAttrs = attributeTypes(pinned);
  const afterAttrs = attributeTypes(latest);

  const removedAttributes: string[] = [];
  const changedAttributes: AttributeChange[] = [];

  for (const [key, from] of beforeAttrs) {
    const component = key.slice(0, key.indexOf('.'));
    if (!survivors.has(component)) {
      continue;
    }
    if (!afterAttrs.has(key)) {
      removedAttributes.push(key);
      continue;
    }
    const to = afterAttrs.get(key)!;
    if (to !== from) {
      changedAttributes.push({
        component,
        attribute: key.slice(key.indexOf('.') + 1),
        from,
        to,
      });
    }
  }

  return {
    addedComponents,
    removedComponents,
    removedAttributes: removedAttributes.sort(),
    changedAttributes: changedAttributes.sort((a, b) =>
      `${a.component}.${a.attribute}`.localeCompare(
        `${b.component}.${b.attribute}`
      )
    ),
  };
}

// ── Package fetching ────────────────────────────────────────────────────────

function latestPublished(): string | null {
  try {
    const out = execFileSync('npm', ['view', PACKAGE, 'version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Download one published version and return its manifest. Uses `npm pack`
 * rather than an install, so nothing is added to the tree and no lockfile is
 * touched.
 */
function fetchManifest(version: string, workDir: string): unknown | null {
  try {
    execFileSync('npm', ['pack', `${PACKAGE}@${version}`, '--silent'], {
      cwd: workDir,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const tarball = fs
      .readdirSync(workDir)
      .find((name) => name.includes(version) && name.endsWith('.tgz'));
    if (!tarball) {
      return null;
    }
    execFileSync('tar', ['-xzf', tarball, CEM_SUBPATH], {
      cwd: workDir,
      stdio: 'ignore',
    });
    return fs.readJsonSync(path.join(workDir, CEM_SUBPATH));
  } catch {
    return null;
  }
}

export function checkWaUpgrade(): UpgradeReport | null {
  const current = DEFAULT_WEBAWESOME_VERSION;
  const latest = latestPublished();

  if (latest === null) {
    return null;
  }

  const pinLocations = collectPins().map((pin) => pin.location);

  if (latest === current) {
    return {
      current,
      latest,
      upToDate: true,
      addedComponents: [],
      removedComponents: [],
      removedAttributes: [],
      changedAttributes: [],
      pinLocations,
    };
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-upgrade-'));
  try {
    const pinnedManifest = fetchManifest(current, workDir);
    // The extracted path is reused, so the second fetch needs a clean slate.
    fs.removeSync(path.join(workDir, 'package'));
    const latestManifest = fetchManifest(latest, workDir);

    if (!pinnedManifest || !latestManifest) {
      return null;
    }

    return {
      current,
      latest,
      upToDate: false,
      ...diffManifests(pinnedManifest, latestManifest),
      pinLocations,
    };
  } finally {
    fs.removeSync(workDir);
  }
}

// ── Reporting ───────────────────────────────────────────────────────────────

function printReport(report: UpgradeReport): void {
  if (report.upToDate) {
    console.log(
      pc.green(
        `\nWeb Awesome is on the latest published version (${report.current}).\n`
      )
    );
    return;
  }

  console.log(pc.cyan(`\nWeb Awesome ${report.current} -> ${report.latest}\n`));

  const breaking =
    report.removedComponents.length > 0 ||
    report.removedAttributes.length > 0 ||
    report.changedAttributes.length > 0;

  if (!breaking) {
    console.log(
      'Additive only: nothing was removed and no attribute type changed.\n'
    );
  }

  if (report.addedComponents.length > 0) {
    console.log(`New components (${report.addedComponents.length}):`);
    for (const tag of report.addedComponents) {
      console.log(`  + ${tag}`);
    }
    console.log('');
  }

  if (report.removedComponents.length > 0) {
    console.log(`Removed components (${report.removedComponents.length}):`);
    for (const tag of report.removedComponents) {
      console.log(`  - ${tag}`);
    }
    console.log('');
  }

  if (report.removedAttributes.length > 0) {
    console.log(
      `Attributes removed from existing components (${report.removedAttributes.length}):`
    );
    for (const key of report.removedAttributes) {
      console.log(`  - ${key}`);
    }
    console.log('');
  }

  if (report.changedAttributes.length > 0) {
    console.log(
      `Attribute types changed (${report.changedAttributes.length}):`
    );
    for (const change of report.changedAttributes) {
      console.log(`  ~ ${change.component}.${change.attribute}`);
      console.log(`      ${change.from || '(none)'}`);
      console.log(`   -> ${change.to || '(none)'}`);
    }
    console.log('');
  }

  console.log('An upgrade has to update every pin location:');
  for (const location of report.pinLocations) {
    console.log(`  - ${location}`);
  }
  console.log(
    '\nThen regenerate: pnpm generate:metadata && pnpm generate:templates'
  );
  console.log(
    'Reported, not failed. Web Awesome is excluded from Dependabot on purpose.\n'
  );
}

function main(): void {
  try {
    const report = checkWaUpgrade();

    if (report === null) {
      console.log(
        pc.dim('\nCould not reach the registry; nothing to report this run.\n')
      );
      process.exit(0);
    }

    printReport(report);

    if (process.env.GITHUB_OUTPUT) {
      const lines = [
        `upgrade=${report.upToDate ? '0' : '1'}`,
        `current=${report.current}`,
        `latest=${report.latest}`,
      ];
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
    }
  } catch (error) {
    console.error(
      pc.yellow(
        `Web Awesome upgrade check could not complete: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
