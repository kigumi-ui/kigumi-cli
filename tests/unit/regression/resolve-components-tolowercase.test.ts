/**
 * Protects: PR #108 (F-018 / F-025; resolveComponents toLowerCase bug)
 * Bug: Multi-word component names from user input (`ButtonGroup`,
 *      `AnimatedImage`, `QrCode`, `TabGroup`) failed registry lookup in
 *      diff/update because the lookup applied `name.toLowerCase()` instead
 *      of canonicalising via `toKebabCase`. The user's most common workflow
 *      (kigumi diff button-group / kigumi update tab-group) silently
 *      treated those components as "unknown" and skipped them.
 * Fix: 356af9ab ("fix(kebab-case): resolve multi-word components") —
 *      getComponent + normalizeComponentName + resolveComponents canonicalise
 *      via toKebabCase first so kebab/PascalCase variants resolve to the
 *      registry's stored name (`ButtonGroup`, not `buttongroup`).
 *
 * Invariant: for every multi-word built-in component, both the kebab and
 * PascalCase user inputs must round-trip to the registry's `component.name`.
 */

import { describe, it, expect } from 'vitest';
import {
  getComponent,
  hasComponent,
  normalizeComponentName,
} from '../../../src/utils/registry.js';

const MULTI_WORD_COMPONENTS = [
  { kebab: 'button-group', pascal: 'ButtonGroup' },
  { kebab: 'animated-image', pascal: 'AnimatedImage' },
  { kebab: 'qr-code', pascal: 'QrCode' },
  { kebab: 'tab-group', pascal: 'TabGroup' },
  { kebab: 'bar-chart', pascal: 'BarChart' },
];

describe('resolveComponents toLowerCase bug: multi-word lookup', () => {
  it.each(MULTI_WORD_COMPONENTS)(
    '$kebab kebab input resolves to canonical $pascal',
    ({ kebab, pascal }) => {
      expect(normalizeComponentName(kebab)).toBe(pascal);
      expect(hasComponent(kebab)).toBe(true);
      const def = getComponent(kebab);
      expect(def).not.toBeNull();
      expect(def?.name).toBe(pascal);
    }
  );

  it.each(MULTI_WORD_COMPONENTS)(
    '$pascal PascalCase input also resolves to $pascal',
    ({ pascal }) => {
      expect(normalizeComponentName(pascal)).toBe(pascal);
    }
  );

  it('hasComponent and getComponent agree under canonical kebab input', () => {
    // The pre-fix lookup did `name.toLowerCase()` and missed PascalCase
    // multi-word inputs. The diff/update commands canonicalise via
    // normalizeComponentName / toKebabCase before calling these — that
    // canonicalisation is what this regression test guards.
    expect(hasComponent('button-group')).toBe(true);
    expect(getComponent('button-group')?.name).toBe('ButtonGroup');
  });
});
