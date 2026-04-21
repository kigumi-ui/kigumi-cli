/**
 * Template Render Smoke Test
 *
 * Renders every React wrapper template against the registry context and
 * verifies the output is syntactically valid TS/JS. Catches regressions
 * from template edits that would otherwise only surface at
 * `kigumi add`-time for end users (a bad closing tag, a missing brace,
 * an un-escaped Handlebars token, etc.).
 *
 * This is a pure syntax check (no type resolution), so missing WA types
 * or unresolved imports are not errors. Only parse-level issues fail.
 */

import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import {
  renderTemplate,
  buildTemplateContext,
  getTemplatePath,
} from '../../src/utils/template.js';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';

/**
 * Run TS's syntactic parser on `source`. Returns a list of diagnostic
 * messages; an empty list means the code parses cleanly.
 *
 * Uses `parseDiagnostics` — an internal-but-stable field on SourceFile
 * that only carries parse-level errors (no type-checking), which is
 * what we want for a template smoke test.
 */
function getSyntaxErrors(
  source: string,
  kind: ts.ScriptKind,
  fileLabel: string
): string[] {
  const sf = ts.createSourceFile(
    fileLabel,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind
  );
  const diagnostics =
    (sf as ts.SourceFile & { parseDiagnostics?: ts.Diagnostic[] })
      .parseDiagnostics ?? [];
  return diagnostics.map((d) => {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (d.file && typeof d.start === 'number') {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      return `${fileLabel}:${line + 1}:${character + 1} ${msg}`;
    }
    return `${fileLabel}: ${msg}`;
  });
}

describe('React template render smoke', () => {
  const components = Object.values(LOCAL_REGISTRY);

  it('covers all 74 components', () => {
    expect(components).toHaveLength(74);
  });

  it.each(components.map((c) => [c.name, c]))(
    '%s.tsx.hbs renders into syntactically valid TSX',
    async (name, component) => {
      const templatePath = getTemplatePath('react', `${name}/${name}.tsx.hbs`);
      const rendered = await renderTemplate(
        templatePath,
        buildTemplateContext(component)
      );
      const errors = getSyntaxErrors(
        rendered,
        ts.ScriptKind.TSX,
        `${name}.tsx`
      );
      expect(errors).toEqual([]);
    }
  );

  it.each(components.map((c) => [c.name, c]))(
    '%s.jsx.hbs renders into syntactically valid JSX',
    async (name, component) => {
      const templatePath = getTemplatePath('react', `${name}/${name}.jsx.hbs`);
      const rendered = await renderTemplate(
        templatePath,
        buildTemplateContext(component)
      );
      const errors = getSyntaxErrors(
        rendered,
        ts.ScriptKind.JSX,
        `${name}.jsx`
      );
      expect(errors).toEqual([]);
    }
  );
});
