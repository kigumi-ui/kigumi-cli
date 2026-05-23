/**
 * Protects: F-058 (Cluster A close-out — `loadConfig` monorepo isolation,
 *           per `test-infrastructure-hardening-status.md` line 206).
 * Bug: cosmiconfig walks up the directory tree looking for the config file.
 *      A monorepo workspace without its own kigumi.config.json would
 *      silently inherit the repo-root config, then `kigumi add` would write
 *      components into whichever componentsDir the parent declared. Users
 *      saw components materialise in the wrong package.
 * Fix: b1bf2c0d ("feat(config): cluster A - load/validate/save lifecycle
 *      hardening") — `loadConfig(cwd)` passes `stopDir: cwd` to
 *      cosmiconfig.search() so the search is pinned to the supplied cwd
 *      and never crosses up.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { loadConfig, getConfig } from '../../../src/utils/config.js';
import { ConfigNotFoundError } from '../../../src/errors/config.js';

describe('F-058 / Cluster A: loadConfig pins to cwd via stopDir', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-regression-monorepo-'))
    );
  });

  afterEach(async () => {
    await fs.remove(tempRoot);
  });

  it('does not inherit a parent kigumi.config.json from above cwd', async () => {
    // Repo root carries a config.
    await fs.writeJSON(path.join(tempRoot, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
    });

    // Sub-package has no config of its own.
    const subPackage = path.join(tempRoot, 'packages', 'foo');
    await fs.ensureDir(subPackage);

    const result = loadConfig(subPackage);
    expect(result).toBeNull();

    // getConfig surfaces the same isolation as a typed not-found error
    // rather than silently merging the parent.
    expect(() => getConfig(subPackage)).toThrow(ConfigNotFoundError);
  });

  it('still loads when the config lives in cwd itself', async () => {
    await fs.writeJSON(path.join(tempRoot, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
    });

    const result = loadConfig(tempRoot);
    expect(result).not.toBeNull();
    expect(result?.filepath.endsWith('kigumi.config.json')).toBe(true);
  });
});
