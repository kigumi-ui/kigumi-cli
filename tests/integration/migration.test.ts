/**
 * Migration Fixture Suite
 *
 * Exercises `kigumi upgrade` against committed historical config shapes
 * (0.18.x, 0.19.x). Catches regressions where a schema evolution or version-map
 * change breaks the upgrade path for users on older versions.
 *
 * The fixtures live in tests/fixtures/migration/ and represent realistic
 * configs from past releases (one-time captured, not regenerated).
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { cleanup, createTempProject, runKigumi } from './helpers.js';
import { kigumiConfigSchema } from '../../src/schemas/config.js';
import { getVersionEntry } from '../../src/utils/version-map.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures', 'migration');

const FIXTURES = ['0.18.x-config.json', '0.19.x-config.json'] as const;

describe('kigumi upgrade migration fixtures', () => {
  let testDir: string;
  let cliVersion: string;

  beforeAll(async () => {
    const cliExists = await fs.pathExists('dist/index.js');
    if (!cliExists) {
      throw new Error(
        'CLI not built. Run `pnpm build` before integration tests.'
      );
    }
    const pkg = await fs.readJson(path.join(process.cwd(), 'package.json'));
    cliVersion = pkg.version;
  });

  afterEach(async () => {
    if (testDir) {
      await cleanup(testDir);
    }
  });

  for (const fixture of FIXTURES) {
    it(`upgrades ${fixture} cleanly and produces a valid config`, async () => {
      const original = await fs.readJson(path.join(FIXTURES_DIR, fixture));

      testDir = await createTempProject('empty');
      await fs.writeJson(path.join(testDir, 'kigumi.config.json'), original, {
        spaces: 2,
      });

      const result = await runKigumi(testDir, [
        'upgrade',
        '--yes',
        '--no-install',
      ]);

      expect(result.exitCode).toBe(0);

      const upgraded = await fs.readJson(
        path.join(testDir, 'kigumi.config.json')
      );

      expect(upgraded.kigumiVersion).toBe(cliVersion);

      const expectedEntry = getVersionEntry(cliVersion);
      if (expectedEntry) {
        expect(upgraded.webAwesome?.version).toBe(
          expectedEntry.webAwesomeVersion
        );
      }

      const parseResult = kigumiConfigSchema.safeParse(upgraded);
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) {
        // Surface the validation errors in the test output for debugging.
        throw new Error(
          `Schema validation failed: ${JSON.stringify(parseResult.error.issues, null, 2)}`
        );
      }
    });
  }

  it('preserves installedComponents through the upgrade', async () => {
    const original = await fs.readJson(
      path.join(FIXTURES_DIR, '0.19.x-config.json')
    );

    testDir = await createTempProject('empty');
    await fs.writeJson(path.join(testDir, 'kigumi.config.json'), original, {
      spaces: 2,
    });

    const result = await runKigumi(testDir, [
      'upgrade',
      '--yes',
      '--no-install',
    ]);
    expect(result.exitCode).toBe(0);

    const upgraded = await fs.readJson(
      path.join(testDir, 'kigumi.config.json')
    );

    expect(Object.keys(upgraded.installedComponents)).toEqual(
      Object.keys(original.installedComponents)
    );
  });
});
