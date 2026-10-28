import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { buildPreviewStyle } from '../lib/preview-style';
import { DEFAULT_VALUES } from '../lib/defaults';

// The theme the docs site installs: Web Awesome Pro, aliased to its own name.
const require = createRequire(import.meta.url);
const THEME = join(
  dirname(require.resolve('@awesome.me/webawesome-pro/package.json')),
  'dist/styles/themes/default.css'
);

/** Each declaration of `name` in `css`, whitespace collapsed. */
function declarations(css: string, name: string): string[] {
  const pattern = new RegExp(`${name}\\s*:\\s*([^;]+);`, 'g');
  return [...css.matchAll(pattern)].map((m) =>
    m[1].replace(/\s+/g, ' ').trim()
  );
}

describe('buildPreviewStyle shadows', () => {
  it("declares --wa-shadow-m as Web Awesome's theme does, so the preview paints a project's shadow", () => {
    // Read, never skipped: a missing theme file fails the test.
    const theme = readFileSync(THEME, 'utf8');
    const style = buildPreviewStyle(DEFAULT_VALUES, 'light');
    for (const name of [
      '--wa-shadow-offset-x-m',
      '--wa-shadow-offset-y-m',
      '--wa-shadow-blur-m',
      '--wa-shadow-spread-m',
      '--wa-shadow-m',
    ]) {
      expect(declarations(theme, name), name).toEqual([style[name]]);
    }
  });
});
