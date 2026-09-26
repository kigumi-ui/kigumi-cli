/**
 * Issue #34: ComponentMetadata (and the CSS-metadata types) must exist as
 * one TypeScript declaration. Generated modules import and re-export that
 * type; they must not re-declare it.
 *
 * `generateTypeScriptSource` and `generateCssMetadataSource` are a test-only
 * seam: re-exported from the bottom of scripts/parse-custom-elements.ts solely
 * so these assertions can reach the emit contract, with no new public callers.
 * See tests/AGENTS.md, "Internals Exported for Test Coverage".
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ComponentMetadata } from '../../src/utils/component-metadata.js';
import { CSS_METADATA } from '../../scripts/css-metadata.js';
import {
  generateTypeScriptSource,
  generateCssMetadataSource,
} from '../../scripts/parse-custom-elements.js';

const ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '.claude',
]);

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

/** Matches an interface anywhere, including inside template strings. */
function declarationPattern(name: string): RegExp {
  return new RegExp(`(?:export\\s+)?interface\\s+${name}\\b`);
}

/**
 * Matches a real TypeScript declaration at the start of a line. String
 * literals in this test (`expect(...interface ComponentMetadata)`) do not
 * match, so uniqueness can be asserted repo-wide.
 */
function declarationAtLineStart(name: string): RegExp {
  return new RegExp(`^\\s*(?:export\\s+)?interface\\s+${name}\\b`, 'm');
}

describe('generateTypeScriptSource / generateCssMetadataSource (issue #34)', () => {
  it('generated component-metadata module imports and re-exports ComponentMetadata', () => {
    const source = readRepoFile('src/utils/component-metadata.ts');
    expect(source).not.toMatch(declarationPattern('ComponentMetadata'));
    expect(source).toMatch(/from ['"]\.\/metadata-types\.js['"]/);
    expectReexported(source, ['ComponentMetadata']);
  });

  it('generated css-metadata module imports and re-exports CSS types', () => {
    const source = readRepoFile('scripts/css-metadata.ts');
    expect(source).not.toMatch(declarationPattern('CSSPart'));
    expect(source).not.toMatch(declarationPattern('CSSCustomProperty'));
    expect(source).not.toMatch(declarationPattern('ComponentCSSMetadata'));
    expect(source).toMatch(/from ['"]\.\.\/src\/utils\/metadata-types\.js['"]/);
    expectReexported(source, [
      'CSSPart',
      'CSSCustomProperty',
      'ComponentCSSMetadata',
    ]);
  });

  it('parser uses the shared declarations as its working types', () => {
    const source = readRepoFile('scripts/parse-custom-elements.ts');
    expect(source).not.toMatch(declarationPattern('ComponentMetadata'));
    expect(source).not.toMatch(declarationPattern('CSSPart'));
    expect(source).not.toMatch(declarationPattern('CSSCustomProperty'));
    expect(source).not.toMatch(declarationPattern('ComponentCSSMetadata'));
    expect(source).toMatch(/from ['"]\.\.\/src\/utils\/metadata-types\.js['"]/);
  });

  it('declares each metadata interface exactly once in the repo', () => {
    const types = readRepoFile('src/utils/metadata-types.ts');
    expect(types).toMatch(/^export interface ComponentMetadata/m);
    expect(types).toMatch(/^export interface CSSPart/m);
    expect(types).toMatch(/^export interface CSSCustomProperty/m);
    expect(types).toMatch(/^export interface ComponentCSSMetadata/m);
    expect(types).toMatch(/Absent for Pro components/);

    const hits = {
      ComponentMetadata: [] as string[],
      CSSPart: [] as string[],
      CSSCustomProperty: [] as string[],
      ComponentCSSMetadata: [] as string[],
    };

    collectDeclarations(ROOT, hits);

    expect(hits.ComponentMetadata).toEqual(['src/utils/metadata-types.ts']);
    expect(hits.CSSPart).toEqual(['src/utils/metadata-types.ts']);
    expect(hits.CSSCustomProperty).toEqual(['src/utils/metadata-types.ts']);
    expect(hits.ComponentCSSMetadata).toEqual(['src/utils/metadata-types.ts']);
  });

  it('metadata emitters output data plus a re-export, not a duplicated interface', () => {
    const componentSource = generateTypeScriptSource({});
    expect(componentSource).not.toMatch(
      declarationPattern('ComponentMetadata')
    );
    expect(componentSource).toMatch(/from ['"]\.\/metadata-types\.js['"]/);
    expectReexported(componentSource, ['ComponentMetadata']);
    expect(componentSource).toContain(
      'export const COMPONENT_METADATA: Record<string, ComponentMetadata>'
    );
    expect(componentSource).toContain('DO NOT EDIT MANUALLY');
    expect(componentSource).toContain(
      'Descriptions are present for Free-tier components only'
    );

    const cssSource = generateCssMetadataSource({});
    expect(cssSource).not.toMatch(declarationPattern('CSSPart'));
    expect(cssSource).not.toMatch(declarationPattern('CSSCustomProperty'));
    expect(cssSource).not.toMatch(declarationPattern('ComponentCSSMetadata'));
    expect(cssSource).toMatch(
      /from ['"]\.\.\/src\/utils\/metadata-types\.js['"]/
    );
    expectReexported(cssSource, [
      'CSSPart',
      'CSSCustomProperty',
      'ComponentCSSMetadata',
    ]);
    expect(cssSource).toContain(
      'export const CSS_METADATA: Record<string, ComponentCSSMetadata>'
    );
    expect(cssSource).toContain('DO NOT EDIT MANUALLY');
  });

  it('existing ComponentMetadata and CSS_METADATA import paths still type-check', () => {
    const sample: ComponentMetadata = {
      tagName: 'wa-button',
      className: 'WaButton',
      attributes: [],
      events: [],
      slots: [],
      methods: [],
    };
    expect(sample.tagName).toBe('wa-button');
    expect(CSS_METADATA['button']).toBeDefined();
  });
});

function expectReexported(source: string, names: string[]): void {
  const exported = [...source.matchAll(/export type \{([^}]+)\}/g)]
    .map((match) => match[1])
    .join(' ');
  for (const name of names) {
    expect(exported).toMatch(new RegExp(`\\b${name}\\b`));
  }
}

function collectDeclarations(
  dir: string,
  hits: Record<string, string[]>
): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'fixtures' && path.basename(dir) === 'tests') {
        continue;
      }
      collectDeclarations(full, hits);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const text = fs.readFileSync(full, 'utf-8');
    const relative = path.relative(ROOT, full);
    for (const name of Object.keys(hits)) {
      if (declarationAtLineStart(name).test(text)) {
        hits[name].push(relative);
      }
    }
  }
}
