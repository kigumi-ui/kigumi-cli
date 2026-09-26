/**
 * Tests for CEM → ComponentMetadata.attributes extraction (issue #105).
 *
 * Exercises two layers:
 *   1. Pure `extractAttributes` function — input/output contracts
 *   2. Regression checks against the committed COMPONENT_METADATA — the
 *      Dialog function harness (issue #74) reads wa-dialog's attribute names
 *      from here instead of opening a CEM at test time.
 */
import { describe, it, expect } from 'vitest';
import { extractAttributes } from '../../scripts/parse-custom-elements.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';

describe('extractAttributes (pure)', () => {
  it('classifies a boolean-typed attribute', () => {
    expect(
      extractAttributes({
        tagName: 'wa-dialog',
        attributes: [{ name: 'open', type: { text: 'boolean' } }],
      })
    ).toEqual([{ name: 'open', type: 'boolean' }]);
  });

  it('classifies a string-typed attribute as string, not boolean', () => {
    expect(
      extractAttributes({
        tagName: 'wa-dialog',
        attributes: [{ name: 'label', type: { text: 'string' } }],
      })
    ).toEqual([{ name: 'label', type: 'string' }]);
  });

  it('classifies any non-boolean CEM type text as string', () => {
    // The CEM's type-text vocabulary spans enums, unions, and named types
    // (e.g. "'brand' | 'neutral'", "IconCanvas | undefined"). The harness
    // only needs boolean-vs-not to pick a probe value.
    expect(
      extractAttributes({
        tagName: 'wa-tag',
        attributes: [
          { name: 'appearance', type: { text: "'accent' | 'filled'" } },
        ],
      })
    ).toEqual([{ name: 'appearance', type: 'string' }]);
  });

  it('keeps an attribute with no CEM type, omitting the type field', () => {
    // wa-dialog's did-ssr (inherited from WebAwesomeElement) has no `type`.
    // It must stay in the list rather than being dropped.
    expect(
      extractAttributes({
        tagName: 'wa-dialog',
        attributes: [{ name: 'did-ssr' }],
      })
    ).toEqual([{ name: 'did-ssr' }]);
  });

  it('filters entries where CEM omits the name field', () => {
    expect(
      extractAttributes({
        tagName: 'wa-dialog',
        attributes: [
          { type: { text: 'string' } },
          { name: 'label', type: { text: 'string' } },
        ],
      })
    ).toEqual([{ name: 'label', type: 'string' }]);
  });

  it('returns an empty array when the declaration has no attributes', () => {
    expect(extractAttributes({ tagName: 'wa-include' })).toEqual([]);
  });
});

describe('COMPONENT_METADATA.dialog.attributes regression', () => {
  it('includes did-ssr, matching the pinned Free CEM (issue #105)', () => {
    const names = COMPONENT_METADATA.dialog.attributes.map((a) => a.name);
    expect(names).toContain('did-ssr');
    const didSsr = COMPONENT_METADATA.dialog.attributes.find(
      (a) => a.name === 'did-ssr'
    );
    expect(didSsr).toEqual({ name: 'did-ssr' });
  });

  it('classifies open as boolean and label as string', () => {
    const open = COMPONENT_METADATA.dialog.attributes.find(
      (a) => a.name === 'open'
    );
    const label = COMPONENT_METADATA.dialog.attributes.find(
      (a) => a.name === 'label'
    );
    expect(open?.type).toBe('boolean');
    expect(label?.type).toBe('string');
  });
});

describe('COMPONENT_METADATA.attributes coverage', () => {
  it('every registry component has an attributes array (possibly empty)', () => {
    for (const [key, meta] of Object.entries(COMPONENT_METADATA)) {
      expect(
        Array.isArray(meta.attributes),
        `COMPONENT_METADATA['${key}'] is missing an attributes array`
      ).toBe(true);
    }
  });

  it('otp-input, pagination, and tag-input have attribute coverage', () => {
    // These three were the components missing from a partial 3.10.0 CEM;
    // their presence with populated attributes proves the regen ran against
    // the complete 3.13.0 manifest (issue #105).
    for (const key of ['otp-input', 'pagination', 'tag-input']) {
      expect(
        COMPONENT_METADATA[key]?.attributes.length,
        `COMPONENT_METADATA['${key}'] has no attributes`
      ).toBeGreaterThan(0);
    }
  });
});
