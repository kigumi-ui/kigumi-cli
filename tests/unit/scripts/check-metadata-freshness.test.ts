import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  compareFreshness,
  newestInputMtime,
} from '../../../scripts/check-metadata-freshness.js';

describe('compareFreshness', () => {
  it('marks metadata missing as stale (metadata-missing)', () => {
    expect(compareFreshness(null, 1_000)).toEqual({
      isStale: true,
      reason: 'metadata-missing',
    });
  });

  it('marks metadata missing as stale even when CEM is also missing', () => {
    expect(compareFreshness(null, null)).toEqual({
      isStale: true,
      reason: 'metadata-missing',
    });
  });

  it('skips check when CEM is unreachable but metadata exists', () => {
    expect(compareFreshness(1_000, null)).toEqual({
      isStale: false,
      reason: 'cem-missing-skip-check',
    });
  });

  it('marks metadata stale when CEM mtime is newer', () => {
    expect(compareFreshness(1_000, 2_000)).toEqual({
      isStale: true,
      reason: 'cem-newer',
    });
  });

  it('marks metadata fresh when CEM mtime is older', () => {
    expect(compareFreshness(2_000, 1_000)).toEqual({
      isStale: false,
      reason: 'fresh',
    });
  });

  it('treats equal mtimes as fresh (no regen)', () => {
    expect(compareFreshness(1_500, 1_500)).toEqual({
      isStale: false,
      reason: 'fresh',
    });
  });
});

describe('newestInputMtime (test-only export)', () => {
  it('counts an event declaration newer than the CEM', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-freshness-'));
    try {
      const cem = path.join(dir, 'custom-elements.json');
      const events = path.join(dir, 'events');
      await fs.writeFile(cem, '{}');
      await fs.ensureDir(events);
      await fs.writeFile(path.join(events, 'hide.d.ts'), '');
      await fs.writeFile(path.join(events, 'hide.js'), '');
      await fs.utimes(cem, 1_000, 1_000);
      await fs.utimes(path.join(events, 'hide.d.ts'), 3_000, 3_000);
      // Only declarations count: a newer .js must not.
      await fs.utimes(path.join(events, 'hide.js'), 9_000, 9_000);

      expect(await newestInputMtime(cem)).toBe(3_000_000);
      // Metadata written between the CEM and the declaration is stale.
      expect(compareFreshness(2_000_000, await newestInputMtime(cem))).toEqual({
        isStale: true,
        reason: 'cem-newer',
      });
    } finally {
      await fs.remove(dir);
    }
  });

  it('falls back to the CEM alone when there is no events directory', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-freshness-'));
    try {
      const cem = path.join(dir, 'custom-elements.json');
      await fs.writeFile(cem, '{}');
      await fs.utimes(cem, 1_000, 1_000);
      expect(await newestInputMtime(cem)).toBe(1_000_000);
    } finally {
      await fs.remove(dir);
    }
  });
});
