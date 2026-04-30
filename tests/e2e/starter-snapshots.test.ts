/**
 * Starter Snapshot Diff
 *
 * Walks every emitted file under componentsDir + utilsDir + stylesDir of a
 * real Kigumi starter, and asserts each file matches a frozen fixture under
 * tests/fixtures/starter-snapshots/<framework>/<rel>. Drift fails the test.
 *
 * Run via the per-framework matrix lane (CI) or `pnpm test:starters` (local),
 * with KIGUMI_STARTER and KIGUMI_STARTER_DIR set.
 *
 * Update fixtures with `pnpm run update:starter-snapshots`.
 *
 * When KIGUMI_STARTER / KIGUMI_STARTER_DIR are unset, the suite is skipped so
 * the broader `pnpm test:e2e` run can pass without an explicit selection.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  mergeWithDefaults,
  type KigumiConfig,
} from '../../src/schemas/config.js';

const FRAMEWORK = process.env.KIGUMI_STARTER;
const STARTER_DIR = process.env.KIGUMI_STARTER_DIR;
const ENABLED = Boolean(FRAMEWORK && STARTER_DIR);

const FIXTURES_ROOT = path.resolve(__dirname, '../fixtures/starter-snapshots');

function loadStarterConfig(starterDir: string): KigumiConfig {
  const configPath = path.join(starterDir, 'kigumi.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `starter-snapshots: ${starterDir} has no kigumi.config.json`
    );
  }
  const raw = JSON.parse(
    fs.readFileSync(configPath, 'utf-8')
  ) as Partial<KigumiConfig>;
  return mergeWithDefaults(raw);
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out.sort();
}

function fixtureRelative(starterDir: string, file: string): string {
  const rel = path.relative(starterDir, file);
  // Normalize cross-starter path layout: strip a leading `src/` so the fixture
  // tree is consistent across React/Vue/Angular (src/-rooted) and Next (root).
  return rel.startsWith(`src${path.sep}`)
    ? rel.slice(`src${path.sep}`.length)
    : rel;
}

if (!ENABLED) {
  describe.skip('starter snapshots: disabled', () => {
    it('disabled (set KIGUMI_STARTER and KIGUMI_STARTER_DIR to enable)', () => {
      // intentionally empty
    });
  });
} else {
  const framework = FRAMEWORK as string;
  const starterDir = STARTER_DIR as string;
  const config = loadStarterConfig(starterDir);
  // Schema marks utilsDir/stylesDir as optional; mergeWithDefaults supplies values
  // for omitted keys, but a starter could still pass them as `undefined`. Filter
  // narrows to defined strings before we walk, so a starter that nulls a dir
  // explicitly is treated as "not present" instead of crashing path.join.
  const targetRoots = [
    config.componentsDir,
    config.utilsDir,
    config.stylesDir,
  ].filter((d): d is string => typeof d === 'string' && d.length > 0);

  const allFiles = targetRoots
    .flatMap((rel) => walk(path.join(starterDir, rel)))
    .sort();

  describe(`starter snapshots: ${framework}`, () => {
    it('emits at least one file (components+utils+styles non-empty)', () => {
      expect(allFiles.length).toBeGreaterThan(0);
    });

    for (const file of allFiles) {
      const fixtureRel = fixtureRelative(starterDir, file);
      const fixturePath = path.join(FIXTURES_ROOT, framework, fixtureRel);
      it(fixtureRel, async () => {
        const actual = fs.readFileSync(file, 'utf-8');
        await expect(actual).toMatchFileSnapshot(fixturePath);
      });
    }
  });
}
