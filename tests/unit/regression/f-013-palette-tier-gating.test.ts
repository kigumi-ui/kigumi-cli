/**
 * Protects: F-013 (PR #115)
 * Bug: TIER_RESTRICTIONS.palettes.free previously listed all 9 palettes,
 *      identical to .pro. Web Awesome only ships default/bright/shoelace at
 *      the free tier; running `kigumi palette elegant` on a free project
 *      wrote the Pro palette to kigumi.config.json and the runtime silently
 *      fell back to default — the user's choice never visibly applied.
 * Fix: 27226834 (#115) — palettes.free shrunk to ['default', 'bright',
 *      'shoelace']. isPaletteAvailable() then returns false for Pro palettes
 *      on the free tier and the palette command rejects up front.
 *
 * Tier-boundary regression: any future drift that re-equates free and pro
 * palette lists (well-meaning copy-paste, schema rewrites) must trip this
 * test. Maps directly to bug-injection B3 (tier-guard `&&`→`||`) in the
 * scripts/bug-injection-gate.md runbook.
 */

import { describe, it, expect } from 'vitest';
import {
  TIER_RESTRICTIONS,
  isPaletteAvailable,
  getAvailablePalettes,
} from '../../../src/utils/tier-restrictions.js';

const PRO_ONLY_PALETTES = [
  'rudimentary',
  'elegant',
  'mild',
  'natural',
  'anodized',
  'vogue',
];

describe('F-013: free-tier palette gating', () => {
  it('TIER_RESTRICTIONS.palettes.free contains exactly the three free palettes', () => {
    expect(TIER_RESTRICTIONS.palettes.free.sort()).toEqual(
      ['bright', 'default', 'shoelace'].sort()
    );
  });

  it.each(PRO_ONLY_PALETTES)(
    'isPaletteAvailable("%s", "free") is false',
    (palette) => {
      expect(isPaletteAvailable(palette, 'free')).toBe(false);
    }
  );

  it.each(PRO_ONLY_PALETTES)(
    'isPaletteAvailable("%s", "pro") is true',
    (palette) => {
      expect(isPaletteAvailable(palette, 'pro')).toBe(true);
    }
  );

  it('getAvailablePalettes("free") strictly subsets getAvailablePalettes("pro")', () => {
    const free = new Set(getAvailablePalettes('free'));
    const pro = new Set(getAvailablePalettes('pro'));
    for (const p of free) {
      expect(pro.has(p)).toBe(true);
    }
    expect(free.size).toBeLessThan(pro.size);
  });
});
