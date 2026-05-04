/**
 * Property-based coverage for the strict config schemas.
 *
 * Three properties:
 *   1. Round-trip: arbitrary valid input survives parse + JSON serialization.
 *   2. Strict rejection: arbitrary valid input + arbitrary unknown key always
 *      rejects with a `unrecognized_keys` issue, across all three schemas.
 *   3. mergeWithDefaults invariance: running merge twice equals running it once.
 *
 * Every required field of `kigumiConfigSchema` is exercised by the round-trip
 * generator, which lists all six (`framework`, `typescript`, `componentsDir`,
 * `utilsDir`, `stylesDir`, `theme`) in `requiredKeys`. The optional `webAwesome`
 * field is also held required in the round-trip generator for deterministic
 * coverage; the absent-WA case is exercised by `partialArb` in the
 * mergeWithDefaults-invariance property below (`requiredKeys: []`).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  FRAMEWORKS,
  kigumiConfigSchema,
  themeConfigSchema,
  webAwesomeConfigSchema,
  mergeWithDefaults,
} from '../../../src/schemas/config.js';

const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 32 });

const versionArb = fc.constantFrom(
  '^3.5.0',
  '~3.5.0',
  '3.5.0',
  '^4.0.0',
  '4.0.0-rc.1'
);

const themeArb = fc.record({
  selected: nonEmptyStringArb,
  palette: nonEmptyStringArb,
  brandColor: nonEmptyStringArb,
});

const webAwesomeArb = fc.record({ version: versionArb }, { requiredKeys: [] });

const validKigumiConfigArb = fc.record(
  {
    framework: fc.constantFrom(...FRAMEWORKS),
    typescript: fc.boolean(),
    componentsDir: nonEmptyStringArb,
    utilsDir: nonEmptyStringArb,
    stylesDir: nonEmptyStringArb,
    theme: themeArb,
    webAwesome: webAwesomeArb,
  },
  {
    // webAwesome is held required here for deterministic round-trip coverage of
    // the WA codepath. The absent-WA case is exercised by `partialArb` below.
    requiredKeys: [
      'framework',
      'typescript',
      'componentsDir',
      'utilsDir',
      'stylesDir',
      'theme',
      'webAwesome',
    ],
  }
);

// Schema-known keys that must NOT be drawn as "unknown" for the rejection
// property. Includes legacy keys (`aliases`, `webAwesome.cdnUrl`) to keep the
// contract honest about which keys count as unknown, plus prototype-flavored
// keys (`__proto__`, `constructor`, `prototype`) to avoid spread-time
// prototype semantics confusing the generator.
const PROTO_KEYS = ['__proto__', 'constructor', 'prototype'];
const KIGUMI_KNOWN_KEYS = new Set([
  'framework',
  'typescript',
  'componentsDir',
  'utilsDir',
  'stylesDir',
  'theme',
  'webAwesome',
  'registries',
  'installedComponents',
  'installedThemes',
  'kigumiVersion',
  'aliases',
  ...PROTO_KEYS,
]);
const THEME_KNOWN_KEYS = new Set([
  'selected',
  'palette',
  'brandColor',
  ...PROTO_KEYS,
]);
const WA_KNOWN_KEYS = new Set(['version', 'cdnUrl', ...PROTO_KEYS]);

const unknownKeyArb = (known: Set<string>) =>
  fc.string({ minLength: 1, maxLength: 16 }).filter((k) => !known.has(k));

describe('config property: round-trip via JSON', () => {
  it('preserves arbitrary valid input through JSON.parse(JSON.stringify(...)) + schema.parse', () => {
    fc.assert(
      fc.property(validKigumiConfigArb, (value) => {
        const cycled: unknown = JSON.parse(JSON.stringify(value));
        const parsed = kigumiConfigSchema.parse(cycled);
        // Assert against the original generator output, not the JSON-cycled
        // intermediate. The generator never emits explicit `undefined`s
        // (absent keys are absent), so `value` and `cycled` are deeply equal -
        // but asserting against `value` makes the round-trip claim explicit
        // rather than tautological ("schema is identity on JSON-clean input").
        expect(parsed).toEqual(value);
      }),
      { numRuns: 500 }
    );
  });
});

describe('config property: strict rejection of unknown keys', () => {
  it('rejects an arbitrary unknown top-level key on kigumiConfigSchema', () => {
    fc.assert(
      fc.property(
        validKigumiConfigArb,
        unknownKeyArb(KIGUMI_KNOWN_KEYS),
        (value, unknownKey) => {
          const tampered = { ...value, [unknownKey]: 'sentinel' };
          const result = kigumiConfigSchema.safeParse(tampered);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(
              result.error.issues.some(
                (iss) => iss.code === 'unrecognized_keys'
              )
            ).toBe(true);
          }
        }
      )
    );
  });

  it('rejects an arbitrary unknown key on themeConfigSchema', () => {
    fc.assert(
      fc.property(
        themeArb,
        unknownKeyArb(THEME_KNOWN_KEYS),
        (theme, unknownKey) => {
          const tampered = { ...theme, [unknownKey]: 'sentinel' };
          const result = themeConfigSchema.safeParse(tampered);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(
              result.error.issues.some(
                (iss) => iss.code === 'unrecognized_keys'
              )
            ).toBe(true);
          }
        }
      )
    );
  });

  it('rejects an arbitrary unknown key on webAwesomeConfigSchema', () => {
    fc.assert(
      fc.property(
        webAwesomeArb,
        unknownKeyArb(WA_KNOWN_KEYS),
        (wa, unknownKey) => {
          const tampered = { ...wa, [unknownKey]: 'sentinel' };
          const result = webAwesomeConfigSchema.safeParse(tampered);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(
              result.error.issues.some(
                (iss) => iss.code === 'unrecognized_keys'
              )
            ).toBe(true);
          }
        }
      )
    );
  });
});

describe('config property: mergeWithDefaults invariance', () => {
  it('is idempotent over the partial inputs that drive defaults injection', () => {
    // Input space: partial KigumiConfig where every field is independently
    // optional. mergeWithDefaults fills the gaps; running it again on the
    // fully-merged result is a no-op. The empty `requiredKeys` here is also
    // what gives the absent-`webAwesome` case its coverage (the round-trip
    // generator above keeps `webAwesome` required for determinism).
    const partialArb = fc.record(
      {
        framework: fc.constantFrom(...FRAMEWORKS),
        typescript: fc.boolean(),
        componentsDir: nonEmptyStringArb,
        utilsDir: nonEmptyStringArb,
        stylesDir: nonEmptyStringArb,
        theme: themeArb,
        webAwesome: webAwesomeArb,
      },
      {
        requiredKeys: [],
      }
    );

    fc.assert(
      fc.property(partialArb, (partial) => {
        const once = mergeWithDefaults(partial);
        const twice = mergeWithDefaults(once);
        expect(twice).toEqual(once);
      })
    );
  });
});
