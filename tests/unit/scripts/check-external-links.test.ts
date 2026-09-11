import { describe, expect, it } from 'vitest';
import {
  extractUrls,
  isPlaceholder,
  normalizeUrl,
} from '../../../scripts/check-external-links.js';

/**
 * Internals exported for test coverage: `isPlaceholder`, `normalizeUrl` and
 * `extractUrls` are the URL matchers, pulled out of the reporter so the
 * placeholder-and-punctuation boundary can be pinned case by case without
 * making a single network request. Registered in tests/AGENTS.md.
 */
describe('check-external-links matchers (test-only seams)', () => {
  describe('isPlaceholder', () => {
    it('treats the documented registry example as a placeholder', () => {
      // README documents community registries with this shape. It is an
      // example of a URL, not a claim that one resolves.
      expect(isPlaceholder('https://github.com/user/my-registry')).toBe(true);
    });

    it('matches on prefix, so any path under a placeholder host counts', () => {
      expect(isPlaceholder('https://github.com/user/anything/at/all')).toBe(
        true
      );
      expect(isPlaceholder('https://example.com/docs')).toBe(true);
    });

    it('does not treat a real project URL as a placeholder', () => {
      expect(isPlaceholder('https://kigumi.style')).toBe(false);
      expect(isPlaceholder('https://webawesome.com/docs')).toBe(false);
      // The org's own repos live under github.com but not under /user/.
      expect(isPlaceholder('https://github.com/kigumi-ui/kigumi-cli')).toBe(
        false
      );
    });
  });

  describe('normalizeUrl', () => {
    it('drops sentence punctuation that is not part of the address', () => {
      expect(normalizeUrl('https://kigumi.style.')).toBe(
        'https://kigumi.style'
      );
      expect(normalizeUrl('https://kigumi.style,')).toBe(
        'https://kigumi.style'
      );
      expect(normalizeUrl('https://kigumi.style;')).toBe(
        'https://kigumi.style'
      );
    });

    it('repairs a markdown seam where one URL runs into the next', () => {
      // `[text](url)` sitting directly beside another link yields this shape.
      expect(
        normalizeUrl(
          'https://webawesome.com/login](https://webawesome.com/login'
        )
      ).toBe('https://webawesome.com/login');
    });

    it('leaves a clean URL untouched, trailing slash included', () => {
      expect(normalizeUrl('https://webawesome.com/docs/layout/')).toBe(
        'https://webawesome.com/docs/layout/'
      );
    });

    it('keeps a path that legitimately ends in a dot-suffixed segment', () => {
      expect(normalizeUrl('https://example.org/file.txt')).toBe(
        'https://example.org/file.txt'
      );
    });
  });

  describe('extractUrls', () => {
    it('finds every distinct URL and sorts them', () => {
      const text = 'See https://b.example and https://a.example for details.';
      expect(extractUrls(text)).toEqual([
        'https://a.example',
        'https://b.example',
      ]);
    });

    it('deduplicates a URL mentioned more than once', () => {
      const text = 'https://kigumi.style and again https://kigumi.style';
      expect(extractUrls(text)).toEqual(['https://kigumi.style']);
    });

    it('drops placeholders so an example never lands in the report', () => {
      const text =
        'Real: https://kigumi.style Example: https://github.com/user/my-registry';
      expect(extractUrls(text)).toEqual(['https://kigumi.style']);
    });

    it('does not capture the closing paren of a markdown link', () => {
      expect(extractUrls('[docs](https://webawesome.com/docs)')).toEqual([
        'https://webawesome.com/docs',
      ]);
    });

    it('returns nothing for prose with no links', () => {
      expect(extractUrls('No links here at all.')).toEqual([]);
    });

    it('handles http as well as https', () => {
      expect(extractUrls('http://legacy.example/page')).toEqual([
        'http://legacy.example/page',
      ]);
    });
  });
});
