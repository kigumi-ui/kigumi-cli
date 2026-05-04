/**
 * Corrupt-config edge-case coverage.
 *
 * Drives `loadConfig` / `getConfig` through real fixtures written with
 * `fs-extra` to `mkdtemp` directories. Cluster A's strict schemas pin the
 * accept/reject contract; this file pins the realistic failure modes that
 * surface during cosmiconfig reads from user disks.
 *
 * Existing edge cases at `tests/unit/config.test.ts:394-425` cover empty
 * config, malformed JSON, and unknown-keys-preserved-at-load. These are
 * parallel coverage; nothing here overlaps.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { loadConfig, getConfig } from '../../../src/utils/config.js';
import { ConfigInvalidError } from '../../../src/errors/config.js';

let testDir: string;

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-corrupt-'));
});

afterEach(async () => {
  await fs.remove(testDir);
});

const validConfigJson = JSON.stringify({
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
});

// Parse-error scenarios assert bare `.toThrow()` rather than a specific
// class because `loadConfig` does not wrap cosmiconfig's parse failures
// (see `src/utils/config.ts:78-87`); the surfaced error is whatever
// parse-json / JSON.parse raised. A future wrap into `ConfigParseError`
// would tighten these assertions.

describe('config corrupt: BOM-prefixed JSON', () => {
  it('throws when kigumi.config.json starts with a UTF-8 BOM (parse-json + JSON.parse reject it)', async () => {
    // Node's JSON.parse does not tolerate a leading BOM; cosmiconfig's
    // parse-json loader surfaces the SyntaxError. Pin this so a future
    // loader swap to a BOM-tolerant parser doesn't silently change the
    // failure surface: users would prefer a loud failure to a silent
    // accept of corrupted UTF-8 with BOM.
    const file = path.join(testDir, 'kigumi.config.json');
    await fs.writeFile(file, '﻿' + validConfigJson, 'utf8');

    expect(() => loadConfig(testDir)).toThrow();
  });
});

describe('config corrupt: trailing-comma JSON', () => {
  it('throws when JSON has a trailing comma after the last property', async () => {
    const file = path.join(testDir, 'kigumi.config.json');
    await fs.writeFile(
      file,
      '{"framework":"react","typescript":true,}',
      'utf8'
    );

    expect(() => loadConfig(testDir)).toThrow();
  });
});

describe('config corrupt: truncated mid-write', () => {
  it('throws when the config file was truncated to a partial JSON payload', async () => {
    const file = path.join(testDir, 'kigumi.config.json');
    const half = validConfigJson.slice(
      0,
      Math.floor(validConfigJson.length / 2)
    );
    await fs.writeFile(file, half, 'utf8');

    expect(() => loadConfig(testDir)).toThrow();
  });
});

describe('config corrupt: null byte in framework string', () => {
  it('rejects via ConfigInvalidError when framework contains an embedded null byte', async () => {
    const file = path.join(testDir, 'kigumi.config.json');
    await fs.writeFile(
      file,
      '{"framework":"react\\u0000","typescript":true,"componentsDir":"src/components/ui","utilsDir":"src/lib","stylesDir":"src/styles","theme":{"selected":"default","palette":"default","brandColor":"blue"}}',
      'utf8'
    );

    let thrown: unknown;
    try {
      getConfig(testDir);
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(ConfigInvalidError);
  });
});

describe('config corrupt: wrong type per required field', () => {
  // Each row swaps one required field for a value of the wrong type. The
  // schema reports the offending field by path; we assert the error class
  // and that the issues mention the field name.
  const cases: ReadonlyArray<{ field: string; value: unknown }> = [
    { field: 'framework', value: 42 },
    { field: 'typescript', value: 'yes' },
    { field: 'componentsDir', value: null },
    { field: 'utilsDir', value: ['src', 'lib'] },
    { field: 'stylesDir', value: 0 },
    { field: 'theme', value: 'default' },
  ];

  it.each(cases)(
    'rejects $field set to a wrong-type value via ConfigInvalidError',
    async ({ field, value }) => {
      const base = JSON.parse(validConfigJson) as Record<string, unknown>;
      base[field] = value;
      const file = path.join(testDir, 'kigumi.config.json');
      await fs.writeJson(file, base);

      let thrown: unknown;
      try {
        getConfig(testDir);
      } catch (err) {
        thrown = err;
      }
      expect(thrown).toBeInstanceOf(ConfigInvalidError);
      const errors = (thrown as ConfigInvalidError).context.details
        ?.errors as string[];
      expect(errors).toEqual(
        expect.arrayContaining([expect.stringContaining(field)])
      );
    }
  );
});
