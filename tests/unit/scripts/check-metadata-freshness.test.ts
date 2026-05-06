import { describe, it, expect } from 'vitest';
import { compareFreshness } from '../../../scripts/check-metadata-freshness.js';

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
