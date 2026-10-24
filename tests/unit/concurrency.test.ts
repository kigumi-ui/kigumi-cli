/**
 * Concurrency behavior pin (F-X8, #171).
 *
 * `saveConfig` is a `load -> merge -> write` sequence in
 * `src/utils/config.ts`. The write goes to a temporary file in the same
 * directory, which is then renamed over the config, so the config on disk
 * is always one whole file. These tests pin what that does and does not
 * buy:
 *
 *   1. Two parallel `saveConfig` calls patching disjoint nested keys both
 *      load the same on-disk state, both merge their patch onto it, both
 *      write. Both fulfil, the file ends up valid JSON, but only one patch
 *      survives (last-write-wins). Before #171 the writes went into the
 *      file in place, and two of them could leave the tail of the longer
 *      payload behind the shorter one.
 *   2. While one save is writing, the config is never empty: an
 *      overlapping save reads the previous config and succeeds, and the
 *      later rename wins.
 *   3. `loadConfig` during an in-flight save returns the prior valid state.
 *   4. `saveConfig` propagates a rejected write as a thrown error; no
 *      `process.exit`, no silent swallow.
 *
 * `vi.spyOn` only; no module-replacement mocks. Restored in `afterEach`
 * via `vi.restoreAllMocks()` so leakage cannot bleed across tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fsExtra from 'fs-extra';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadConfig, saveConfig } from '../../src/utils/config.js';

let testDir: string;

const baseConfig = {
  framework: 'react' as const,
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: {
    selected: 'default',
    palette: 'default',
    brandColor: 'blue',
  },
};

beforeEach(async () => {
  testDir = await fsExtra.mkdtemp(
    path.join(os.tmpdir(), 'kigumi-concurrency-')
  );
  await fsExtra.writeJson(path.join(testDir, 'kigumi.config.json'), baseConfig);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fsExtra.remove(testDir);
});

describe('saveConfig: concurrent disjoint patches', () => {
  it('leaves disk in a valid JSON state and both patches fulfil', async () => {
    // Both saves load the original before either writes, so both fulfil
    // and the later rename wins. The race is real I/O, not a spy, so the
    // pair runs several times: an in-place write tears the file or empties
    // it under a reader on a share of runs, never on all of them.
    for (let run = 0; run < 25; run++) {
      await fsExtra.writeJson(
        path.join(testDir, 'kigumi.config.json'),
        baseConfig
      );

      const results = await Promise.allSettled([
        saveConfig({ theme: { selected: 'brutalist' } }, testDir),
        saveConfig({ webAwesome: { version: '4.0.0' } }, testDir),
      ]);

      expect(results.map((r) => r.status)).toEqual(['fulfilled', 'fulfilled']);

      const final = (await fsExtra.readJson(
        path.join(testDir, 'kigumi.config.json')
      )) as Record<string, unknown>;
      expect(final.framework).toBe('react');
      // At least one patch landed.
      const themeChanged =
        (final.theme as { selected: string }).selected === 'brutalist';
      const waChanged =
        (final.webAwesome as { version: string } | undefined)?.version ===
        '4.0.0';
      expect(themeChanged || waChanged).toBe(true);
    }
  });

  it('never empties the config mid-save: an overlapping save reads the previous config, and the later rename wins', async () => {
    // Hold save A inside its write. The spy first empties the file it was
    // given, as `open(O_TRUNC)` does, so a save that writes into the config
    // in place would leave the config empty for B to find. Saving through a
    // temporary file means A only ever empties its own temporary file.
    let releaseA!: () => void;
    const gateA = new Promise<void>((r) => {
      releaseA = r;
    });
    let signalTruncated!: () => void;
    const truncated = new Promise<void>((r) => {
      signalTruncated = r;
    });
    const file = path.join(testDir, 'kigumi.config.json');
    const spy = vi
      .spyOn(fsExtra, 'writeFile')
      .mockImplementationOnce(async (...args: unknown[]): Promise<void> => {
        const [target, data] = args as [string, string];
        await writeFile(target, '');
        signalTruncated();
        await gateA;
        await writeFile(target, data);
      });

    const aPromise = saveConfig({ theme: { selected: 'brutalist' } }, testDir);

    // Wait until A has emptied the file it writes before B reads the config.
    await truncated;

    await saveConfig({ webAwesome: { version: '4.0.0' } }, testDir);
    expect(
      ((await fsExtra.readJson(file)) as { webAwesome?: unknown }).webAwesome
    ).toEqual({ version: '4.0.0' });

    releaseA();
    await aPromise;
    expect(spy).toHaveBeenCalledTimes(2);

    // A loaded the config before B saved, so its rename drops B's patch:
    // overlapping saves still lose updates, they no longer tear the file.
    const final = (await fsExtra.readJson(file)) as {
      theme: { selected: string };
      webAwesome?: unknown;
    };
    expect(final.theme.selected).toBe('brutalist');
    expect(final.webAwesome).toBeUndefined();
  });
});

describe('saveConfig: loadConfig race against in-flight write', () => {
  it('loadConfig sees a valid prior state while saveConfig is writing', async () => {
    // Hold the write open so loadConfig can run in the gap.
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const writeSpy = vi
      .spyOn(fsExtra, 'writeFile')
      .mockImplementationOnce(async (...args: unknown[]): Promise<void> => {
        const [target, data] = args as [string, string];
        await gate;
        await writeFile(target, data);
      });

    const savePromise = saveConfig(
      { theme: { selected: 'brutalist' } },
      testDir
    );

    // Concurrent loadConfig while the write is still gated.
    const midFlight = loadConfig(testDir);
    expect(midFlight).not.toBeNull();
    // Pre-write disk state still has the original theme.
    expect(
      (midFlight?.config as { theme: { selected: string } }).theme.selected
    ).toBe('default');

    release();
    await savePromise;
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('saveConfig: write failure propagates', () => {
  it('throws when the write rejects (no process.exit, no silent swallow)', async () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(
        (_code?: string | number | null | undefined): never => {
          throw new Error('process.exit was called');
        }
      );
    const ioErr = Object.assign(new Error('ENOSPC: no space left on device'), {
      code: 'ENOSPC',
    });
    vi.spyOn(fsExtra, 'writeFile').mockRejectedValueOnce(ioErr);

    await expect(
      saveConfig({ theme: { selected: 'brutalist' } }, testDir)
    ).rejects.toThrow(/ENOSPC/);
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
