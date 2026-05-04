/**
 * Concurrency behavior pin (F-X8).
 *
 * `saveConfig` is a `load -> merge -> write` sequence in
 * `src/utils/config.ts:174-191`. It is NOT an atomic-rename primitive.
 * These tests pin the current behavior so a future atomic-rename change
 * has a baseline:
 *
 *   1. Two parallel `saveConfig` calls patching disjoint nested keys both
 *      load the same on-disk state, both merge their patch onto it, both
 *      write. The on-disk file ends up valid JSON, but only one patch
 *      survives (last-write-wins). `loadConfig` after the dust settles
 *      sees the surviving patch.
 *   2. While `fs.writeJson` is in-flight (spy delays one tick),
 *      `loadConfig` returns either the prior valid state or null
 *      depending on what cosmiconfig sees: never partial JSON.
 *   3. `saveConfig` propagates a rejected `fs.writeJson` as a thrown
 *      error; no `process.exit`, no silent swallow.
 *
 * `vi.spyOn` only; no module-replacement mocks. Restored in `afterEach`
 * via `vi.restoreAllMocks()` so leakage cannot bleed across tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fsExtra from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { loadConfig, saveConfig } from '../../src/utils/config.js';
import { ConfigNotFoundError } from '../../src/errors/config.js';

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
  it('leaves disk in a valid JSON state and at least one patch fulfils', async () => {
    // Pin the non-atomic load -> merge -> write semantics. Two patches
    // race; `fs.writeJson` opens the file with O_TRUNC, so the second
    // saveConfig's `loadConfig` may hit the file while it's empty and
    // throw `ConfigNotFoundError`. Both fulfilling is also valid (when
    // the first writeFile completes before the second loadConfig runs).
    // Either way: at least one fulfils and the disk file is valid JSON.
    const results = await Promise.allSettled([
      saveConfig({ theme: { selected: 'brutalist' } }, testDir),
      saveConfig({ webAwesome: { version: '4.0.0' } }, testDir),
    ]);

    expect(results.some((r) => r.status === 'fulfilled')).toBe(true);

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
  });

  it('exposes the load-modify-write race: a mid-write loadConfig can return null', async () => {
    // Force the race deterministically: spy on the writeJson used by
    // saveConfig A so it holds the file truncated for one tick. saveConfig
    // B's loadConfig then runs while the file is empty, observes "no
    // config found", and throws ConfigNotFoundError. This pins the
    // current load-modify-write contract; a future atomic-rename change
    // would flip this to "both fulfil" and update the assertion.
    let releaseA!: () => void;
    const gateA = new Promise<void>((r) => {
      releaseA = r;
    });
    const file = path.join(testDir, 'kigumi.config.json');
    const spy = vi
      .spyOn(fsExtra, 'writeJson')
      .mockImplementationOnce(async (...args: unknown[]): Promise<void> => {
        // Truncate the file to simulate the open(O_TRUNC) -> write window.
        await fsExtra.writeFile(file, '');
        await gateA;
        // Then write the intended payload.
        const [target, value, opts] = args as [
          string,
          unknown,
          { spaces?: number } | undefined,
        ];
        await fsExtra.writeFile(
          target,
          JSON.stringify(value, null, opts?.spaces ?? 2)
        );
      });

    const aPromise = saveConfig({ theme: { selected: 'brutalist' } }, testDir);

    let bError: unknown;
    try {
      await saveConfig({ webAwesome: { version: '4.0.0' } }, testDir);
    } catch (err) {
      bError = err;
    }
    expect(bError).toBeInstanceOf(ConfigNotFoundError);

    releaseA();
    await aPromise;
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('saveConfig: loadConfig race against in-flight write', () => {
  it('loadConfig sees a valid prior state while saveConfig is awaiting fs.writeJson', async () => {
    // Hold writeJson open for two ticks so loadConfig can run in the gap.
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const writeSpy = vi
      .spyOn(fsExtra, 'writeJson')
      .mockImplementationOnce(async (..._args: unknown[]): Promise<void> => {
        await gate;
      });

    const savePromise = saveConfig(
      { theme: { selected: 'brutalist' } },
      testDir
    );

    // Concurrent loadConfig while writeJson is still gated.
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
  it('throws when fs.writeJson rejects (no process.exit, no silent swallow)', async () => {
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
    vi.spyOn(fsExtra, 'writeJson').mockRejectedValueOnce(ioErr);

    await expect(
      saveConfig({ theme: { selected: 'brutalist' } }, testDir)
    ).rejects.toThrow(/ENOSPC/);
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
