/**
 * No-Handlebars-Tokens Regression Guard
 *
 * Templates ship as real framework source files (`.tsx` / `.jsx` / `.vue` /
 * `.component.ts` / `.test.*`). The previous Handlebars-based pipeline used
 * tokens like `{{name}}`, `{{tagName}}`, `{{description}}`, and
 * `{{{importPath}}}`. The runtime no longer recognises any of these — a
 * stray token would ship verbatim to the user's project and likely fail to
 * compile.
 *
 * `scripts/validate-templates.ts` runs the same check, but a unit test gives
 * us a faster feedback loop during development and keeps the guard close to
 * the rest of the test suite.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, '../..', 'templates');

const TOKEN_PATTERN = /\{\{[^}]+\}\}/;

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue']);

function* walkSources(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkSources(full);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      if (dot >= 0 && SOURCE_EXTENSIONS.has(entry.name.slice(dot))) {
        yield full;
      }
    }
  }
}

describe('templates carry no Handlebars-style tokens', () => {
  it('no `.ts/.tsx/.js/.jsx/.vue` template file matches /\\{\\{[^}]+\\}\\}/', () => {
    expect(statSync(TEMPLATES_DIR).isDirectory()).toBe(true);

    const violations: string[] = [];
    for (const file of walkSources(TEMPLATES_DIR)) {
      const content = readFileSync(file, 'utf-8');
      const match = content.match(TOKEN_PATTERN);
      if (match) {
        const rel = file.replace(TEMPLATES_DIR + '/', '');
        violations.push(`${rel}: ${match[0]}`);
      }
    }

    expect(
      violations,
      `Stray Handlebars-style token in template:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
