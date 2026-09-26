/**
 * Importing scripts/parse-custom-elements.ts must not regenerate metadata.
 *
 * Two unit tests import the parser for its pure emitters. While main() ran
 * unguarded at module load, every `pnpm test` rewrote
 * src/utils/component-metadata.ts and scripts/css-metadata.ts from whatever
 * manifest was installed, and a stale one dropped components from committed
 * files (issue #106).
 *
 * The assertion is on main() starting, not on the files changing: with an
 * up-to-date manifest the regeneration is byte-identical, so a file-diff
 * check would pass while the side effect is still there.
 */
import fs from 'fs-extra';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('parse-custom-elements import', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not run the regeneration when imported', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Stubbed so a regression cannot write the committed files mid-test.
    const write = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation(() => Promise.resolve());

    vi.resetModules();
    const mod = await import('../../scripts/parse-custom-elements.js');
    // Premise: the module really loaded and exposes what the tests import.
    expect(typeof mod.extractCssMetadata).toBe('function');

    // Give an unguarded main() time to reach its writes.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const started = log.mock.calls.some((args) =>
      String(args[0]).includes('Parsing Web Awesome custom-elements.json')
    );
    expect(started).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
});
