/**
 * Community components must not be skipped silently by diff and update.
 *
 * Both commands scan the components directory and drop anything the builtin
 * registry does not know. Components installed from a community registry are
 * exactly that, so `kigumi update` reported "all components are up to date"
 * while never having looked at them.
 *
 * The resolver now reports which installed components it cannot handle, so the
 * commands can tell the user instead of staying quiet.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { KigumiConfig } from '../../../src/schemas/config.js';

let testDir: string;

const config = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
  installedComponents: {
    Button: { source: 'builtin' as const },
    FancyChart: {
      source: 'community' as const,
      registryUrl: 'https://github.com/acme/registry',
    },
  },
} as unknown as KigumiConfig;

beforeEach(async () => {
  testDir = fs.realpathSync(
    await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-f095-'))
  );
  // One builtin component and one installed from a community registry.
  await fs.ensureDir(path.join(testDir, 'src/components/ui/Button'));
  await fs.ensureDir(path.join(testDir, 'src/components/ui/FancyChart'));
});

afterEach(async () => {
  await fs.remove(testDir);
});

describe('resolveComponents reports unmanaged components', () => {
  it('separates builtin components from community ones when scanning', async () => {
    const { resolveComponents } =
      await import('../../../src/utils/installed-components.js');

    const result = await resolveComponents([], config, testDir);

    expect(result.components).toEqual(['Button']);
    expect(result.unmanaged).toEqual([
      { name: 'FancyChart', registryUrl: 'https://github.com/acme/registry' },
    ]);
  });

  it('reports a named community component instead of dropping it', async () => {
    const { resolveComponents } =
      await import('../../../src/utils/installed-components.js');

    const result = await resolveComponents(['FancyChart'], config, testDir);

    expect(result.components).toEqual([]);
    expect(result.unmanaged).toEqual([
      { name: 'FancyChart', registryUrl: 'https://github.com/acme/registry' },
    ]);
  });

  it('still canonicalizes multi-word builtin names', async () => {
    await fs.ensureDir(path.join(testDir, 'src/components/ui/ButtonGroup'));
    const { resolveComponents } =
      await import('../../../src/utils/installed-components.js');

    const byKebab = await resolveComponents(['button-group'], config, testDir);
    expect(byKebab.components).toEqual(['ButtonGroup']);
    expect(byKebab.unmanaged).toEqual([]);

    const byPascal = await resolveComponents(['ButtonGroup'], config, testDir);
    expect(byPascal.components).toEqual(['ButtonGroup']);
  });

  it('treats a directory with no provenance entry as unmanaged too', async () => {
    await fs.ensureDir(path.join(testDir, 'src/components/ui/HandWritten'));
    const { resolveComponents } =
      await import('../../../src/utils/installed-components.js');

    const result = await resolveComponents([], config, testDir);

    expect(result.components).toEqual(['Button']);
    expect(result.unmanaged.map((u) => u.name).sort()).toEqual([
      'FancyChart',
      'HandWritten',
    ]);
  });
});
