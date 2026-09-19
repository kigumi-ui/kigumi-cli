import { describe, it, expect } from 'vitest';
import { generateCssTemplate } from '../../../scripts/generator-utils.js';
import { CSS_METADATA } from '../../../scripts/css-metadata.js';

/**
 * The CSS-template emitter, pinned by assertion rather than by snapshot.
 *
 * This emitter used to exist three times: byte-identical in the React and Vue
 * generators, and a drifted third copy in the Angular one that hardcoded the
 * documentation URL and so ignored `docsUrl` entirely. Each generator had its
 * own snapshot calling its own copy with 'Button', so three passing snapshots
 * and three divergent implementations coexisted happily: the snapshots pinned
 * the drift instead of catching it.
 *
 * These assertions name the properties that must hold, so a future divergence
 * fails on the property rather than on an opaque blob.
 *
 * See issue #30 and docs/adr/0002.
 */

const REACT = {
  selector: '.Button',
  body: '  /* Add your custom styles here */',
};
const ANGULAR = { selector: ':host', body: '  display: contents;' };

describe('generateCssTemplate', () => {
  describe('documentation URL', () => {
    it('honours docsUrl from the metadata', () => {
      const original = CSS_METADATA['button'].docsUrl;
      CSS_METADATA['button'].docsUrl = 'https://example.com/custom/button';
      try {
        for (const options of [REACT, ANGULAR]) {
          expect(generateCssTemplate('Button', options)).toContain(
            'Documentation: https://example.com/custom/button'
          );
        }
      } finally {
        CSS_METADATA['button'].docsUrl = original;
      }
    });

    it('does not hardcode the derived URL, the Angular drift this fixes', () => {
      const original = CSS_METADATA['button'].docsUrl;
      CSS_METADATA['button'].docsUrl = 'https://example.com/custom/button';
      try {
        expect(generateCssTemplate('Button', ANGULAR)).not.toContain(
          'https://webawesome.com/docs/components/button'
        );
      } finally {
        CSS_METADATA['button'].docsUrl = original;
      }
    });

    it('falls back to the derived URL for a component with no metadata', () => {
      expect(generateCssTemplate('NotARealComponent', REACT)).toContain(
        'Documentation: https://webawesome.com/docs/components/not-a-real-component'
      );
    });
  });

  describe('custom properties', () => {
    it('renders each property as "- name: description"', () => {
      // 'radar-chart' carries custom properties in the metadata.
      const out = generateCssTemplate('RadarChart', REACT);
      expect(out).toContain(' * CSS Custom Properties:');
      expect(out).toContain(' * - --fill-color-1:');
    });

    it('appends the default value when the metadata declares one', () => {
      const withDefault = Object.values(CSS_METADATA)
        .flatMap((m) => m.customProperties)
        .find((p) => p.default);
      expect(
        withDefault,
        'fixture assumption: some property has a default'
      ).toBeDefined();

      const owner = Object.entries(CSS_METADATA).find(([, m]) =>
        m.customProperties.some((p) => p.default)
      );
      expect(owner).toBeDefined();
      const [kebab, meta] = owner!;
      const prop = meta.customProperties.find((p) => p.default)!;
      const pascal = kebab
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');

      expect(generateCssTemplate(pascal, REACT)).toContain(
        `(default: ${prop.default})`
      );
    });

    it('emits the empty-state fallback when there are none', () => {
      // 'button' has zero custom properties.
      expect(generateCssTemplate('Button', REACT)).toContain(
        '(No custom properties defined for this component)'
      );
    });

    it('emits the empty-state fallback for an unknown component too', () => {
      expect(generateCssTemplate('NotARealComponent', ANGULAR)).toContain(
        '(No custom properties defined for this component)'
      );
    });
  });

  describe('CSS parts', () => {
    it('renders each part as "- name: description"', () => {
      const out = generateCssTemplate('Button', REACT);
      expect(out).toContain(' * CSS Parts:');
      expect(out).toContain(" * - button: The component's outer wrapper.");
    });

    it('omits the CSS Parts heading when the component has none', () => {
      expect(generateCssTemplate('NotARealComponent', REACT)).not.toContain(
        'CSS Parts:'
      );
    });
  });

  describe('the selector block is the only per-framework difference', () => {
    it('scopes React and Vue to a class named after the component', () => {
      expect(generateCssTemplate('Button', REACT)).toContain(
        '.Button {\n  /* Add your custom styles here */\n}'
      );
    });

    it('scopes Angular to the host, keeping display: contents', () => {
      expect(generateCssTemplate('Button', ANGULAR)).toContain(
        ':host {\n  display: contents;\n}'
      );
    });

    it('emits an identical header for both, differing only after the comment', () => {
      const react = generateCssTemplate('Button', REACT);
      const angular = generateCssTemplate('Button', ANGULAR);
      const header = (s: string) => s.slice(0, s.indexOf(' */') + 3);
      expect(header(react)).toBe(header(angular));
      expect(react).not.toBe(angular);
    });
  });

  describe('consecutive-capital component names resolve to the right metadata', () => {
    it('finds the qr-code entry from either spelling', () => {
      const parts = " * - qr-code: The component's outer wrapper.";
      expect(generateCssTemplate('QrCode', REACT)).toContain(parts);
      expect(generateCssTemplate('QRCode', REACT)).toContain(parts);
    });
  });
});
