import { describe, expect, it } from 'vitest';
import {
  attributeTypes,
  diffManifests,
  tagNames,
} from '../../../scripts/check-wa-upgrade.js';

/**
 * Internals exported for test coverage: `tagNames`, `attributeTypes` and
 * `diffManifests` are the manifest comparators, pulled out of the reporter so
 * the added/removed/changed boundary can be asserted against hand-built
 * manifests instead of downloading two real Web Awesome tarballs.
 * Registered in tests/AGENTS.md.
 */

/** Minimal custom-elements manifest in the shape Web Awesome publishes. */
function manifest(components: Record<string, Record<string, string>>): unknown {
  return {
    modules: Object.entries(components).map(([tagName, attributes]) => ({
      declarations: [
        {
          tagName,
          attributes: Object.entries(attributes).map(([name, text]) => ({
            name,
            type: { text },
          })),
        },
      ],
    })),
  };
}

describe('check-wa-upgrade comparators (test-only seams)', () => {
  describe('tagNames', () => {
    it('collects declared tags in sorted order', () => {
      const cem = manifest({ 'wa-button': {}, 'wa-avatar': {} });
      expect(tagNames(cem)).toEqual(['wa-avatar', 'wa-button']);
    });

    it('ignores declarations that are not custom elements', () => {
      // Manifests carry helper classes and types with no tagName. Those are
      // not components and must not show up as added or removed.
      const cem = {
        modules: [
          { declarations: [{ name: 'SomeHelper' }, { tagName: 'wa-card' }] },
        ],
      };
      expect(tagNames(cem)).toEqual(['wa-card']);
    });

    it('returns nothing for an empty or shapeless manifest', () => {
      expect(tagNames({})).toEqual([]);
      expect(tagNames({ modules: [] })).toEqual([]);
    });

    it('deduplicates a tag declared in more than one module', () => {
      const cem = {
        modules: [
          { declarations: [{ tagName: 'wa-button' }] },
          { declarations: [{ tagName: 'wa-button' }] },
        ],
      };
      expect(tagNames(cem)).toEqual(['wa-button']);
    });
  });

  describe('attributeTypes', () => {
    it('keys attributes by component and records the declared type', () => {
      const cem = manifest({ 'wa-button': { variant: "'brand' | 'neutral'" } });
      expect(attributeTypes(cem).get('wa-button.variant')).toBe(
        "'brand' | 'neutral'"
      );
    });

    it('records an empty string when no type is declared', () => {
      const cem = {
        modules: [
          {
            declarations: [{ tagName: 'wa-x', attributes: [{ name: 'open' }] }],
          },
        ],
      };
      expect(attributeTypes(cem).get('wa-x.open')).toBe('');
    });
  });

  describe('diffManifests', () => {
    it('reports a component added by the newer version', () => {
      const before = manifest({ 'wa-button': {} });
      const after = manifest({ 'wa-button': {}, 'wa-pagination': {} });
      const diff = diffManifests(before, after);
      expect(diff.addedComponents).toEqual(['wa-pagination']);
      expect(diff.removedComponents).toEqual([]);
    });

    it('reports a component the newer version dropped', () => {
      const before = manifest({ 'wa-button': {}, 'wa-legacy': {} });
      const after = manifest({ 'wa-button': {} });
      const diff = diffManifests(before, after);
      expect(diff.removedComponents).toEqual(['wa-legacy']);
    });

    it('reports an attribute removed from a surviving component', () => {
      // This is the shape that silently breaks a generated wrapper.
      const before = manifest({
        'wa-button': { variant: 'string', size: 'string' },
      });
      const after = manifest({ 'wa-button': { variant: 'string' } });
      const diff = diffManifests(before, after);
      expect(diff.removedAttributes).toEqual(['wa-button.size']);
    });

    it('reports an attribute whose declared type narrowed', () => {
      const before = manifest({
        'wa-button': { variant: "'brand' | 'neutral'" },
      });
      const after = manifest({ 'wa-button': { variant: "'brand'" } });
      const diff = diffManifests(before, after);
      expect(diff.changedAttributes).toEqual([
        {
          component: 'wa-button',
          attribute: 'variant',
          from: "'brand' | 'neutral'",
          to: "'brand'",
        },
      ]);
    });

    it('does not repeat a removed component as removed attributes', () => {
      // The component is already reported once. Listing each of its
      // attributes again would bury the signal under noise.
      const before = manifest({ 'wa-legacy': { a: 'string', b: 'string' } });
      const after = manifest({});
      const diff = diffManifests(before, after);
      expect(diff.removedComponents).toEqual(['wa-legacy']);
      expect(diff.removedAttributes).toEqual([]);
    });

    it('reports nothing when the two versions are identical', () => {
      const cem = manifest({ 'wa-button': { variant: 'string' } });
      const diff = diffManifests(cem, cem);
      expect(diff.addedComponents).toEqual([]);
      expect(diff.removedComponents).toEqual([]);
      expect(diff.removedAttributes).toEqual([]);
      expect(diff.changedAttributes).toEqual([]);
    });

    it('treats a new attribute on an existing component as additive', () => {
      // Adding an attribute cannot break an existing wrapper, so it is not
      // reported as a change; only the component list grows.
      const before = manifest({ 'wa-button': { variant: 'string' } });
      const after = manifest({
        'wa-button': { variant: 'string', pill: 'boolean' },
      });
      const diff = diffManifests(before, after);
      expect(diff.removedAttributes).toEqual([]);
      expect(diff.changedAttributes).toEqual([]);
    });
  });
});
