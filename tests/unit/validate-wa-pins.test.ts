/**
 * Web Awesome Pin Consistency Tests
 *
 * The pin check exists because the WA version is written in six places and
 * nothing kept them in agreement. These tests assert the invariant against
 * DEFAULT_WEBAWESOME_VERSION, never against a version literal, so they cannot
 * rot into protecting a stale value the way a hardcoded assertion would.
 */

import { describe, it, expect } from 'vitest';
import { validateWaPins, collectPins } from '../../scripts/validate-wa-pins.js';
import { DEFAULT_WEBAWESOME_VERSION } from '../../src/constants.js';
import { VERSION_MAP } from '../../src/utils/version-map.js';

describe('validate:wa-pins', () => {
  it('passes against the current tree', () => {
    const result = validateWaPins();

    expect(result.findings).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('covers every known pin location', () => {
    // A seventh location must be added to collectPins(), or it goes unchecked.
    expect(collectPins()).toHaveLength(6);
  });

  it('finds a version at every location', () => {
    for (const pin of collectPins()) {
      expect(pin.version, `${pin.location} has no version`).not.toBeNull();
    }
  });

  it('holds every pin to the same exact version', () => {
    for (const pin of collectPins()) {
      expect(pin.version, pin.location).toBe(DEFAULT_WEBAWESOME_VERSION);
      expect(pin.version, `${pin.location} must be exact`).toMatch(
        /^\d+\.\d+\.\d+$/
      );
    }
  });

  it('keeps the newest VERSION_MAP entry on the shipped Web Awesome version', () => {
    // The upgrade path reads this entry. If it lags DEFAULT_WEBAWESOME_VERSION,
    // `kigumi upgrade` silently installs an older Web Awesome than the CLI
    // ships. Asserted against the constant, never a literal.
    expect(VERSION_MAP[0]?.webAwesomeVersion).toBe(DEFAULT_WEBAWESOME_VERSION);
  });

  it('orders VERSION_MAP newest-first, so entry 0 is the newest', () => {
    // collectPins() and the invariant both read VERSION_MAP[0]. If the array
    // were ordered oldest-first, both would silently check the wrong entry.
    const versions = VERSION_MAP.map((e) => e.kigumiVersion);
    const sorted = [...versions].sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      return pb[0] - pa[0] || pb[1] - pa[1] || pb[2] - pa[2];
    });
    expect(versions).toEqual(sorted);
  });
});
