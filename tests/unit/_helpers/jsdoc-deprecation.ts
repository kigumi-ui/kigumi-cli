/**
 * Reads a Template's `@deprecated` tags the way TypeScript does (issue #129).
 *
 * A deprecation only reaches a consumer's editor when TypeScript attaches the
 * JSDoc tag to the prop's declaration: a tag in the wrong comment, or one cut
 * off by a blank line, is text nobody sees. So the check asks TypeScript's own
 * JSDoc parser (`ts.getJSDocDeprecatedTag`) instead of matching the string.
 *
 * Covers the three shapes a Template declares a prop in: an interface member
 * (React `.tsx`, Vue `.vue`), a class property (the Angular `@Input()`), and a
 * `defineProps({...})` object key (Vue `.js.vue`).
 */

import ts from 'typescript';
import { parse as parseSfc } from 'vue/compiler-sfc';

/** How a Template's source is read: plain TS/TSX, or a Vue SFC. */
export type TemplateSourceKind = 'ts' | 'tsx' | 'vue';

function scriptOf(source: string, kind: TemplateSourceKind): string {
  if (kind !== 'vue') return source;
  const { descriptor } = parseSfc(source);
  const block = descriptor.scriptSetup ?? descriptor.script;
  if (!block) throw new Error('SFC has no <script> block');
  return block.content;
}

function propertyName(name: ts.PropertyName): string | null {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNoSubstitutionTemplateLiteral(name)
  ) {
    return name.text;
  }
  return null;
}

/**
 * Every prop-shaped declaration in the Template, by name, with the text of
 * its `@deprecated` tag (`''` for a bare tag) or `null` when it has none.
 */
export function readPropDeprecations(
  source: string,
  kind: TemplateSourceKind
): Map<string, string | null> {
  const file = ts.createSourceFile(
    kind === 'tsx' ? 'template.tsx' : 'template.ts',
    scriptOf(source, kind),
    ts.ScriptTarget.Latest,
    true,
    kind === 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const found = new Map<string, string | null>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertySignature(node) ||
      ts.isPropertyDeclaration(node) ||
      ts.isPropertyAssignment(node)
    ) {
      const name = propertyName(node.name);
      if (name !== null && !found.has(name)) {
        const tag = ts.getJSDocDeprecatedTag(node);
        found.set(
          name,
          tag ? (ts.getTextOfJSDocComment(tag.comment) ?? '') : null
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}
