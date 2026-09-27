/**
 * Reads how each Template and docs surface states a prop's deprecation
 * (issue #129), so the tests can hold every copy to the registry.
 *
 * `readPropDeprecations` asks TypeScript's own JSDoc parser
 * (`ts.getJSDocDeprecatedTag`) instead of matching the string: a deprecation
 * only reaches a consumer's editor when TypeScript attaches the tag to the
 * prop's declaration, and a tag in the wrong comment, or one cut off by a
 * blank line, is text nobody sees. It covers the three shapes a Template or
 * docs wrapper declares a prop in: an interface member (React `.tsx`, Vue
 * `.vue`, docs wrappers), a class property (the Angular `@Input()`), and a
 * `defineProps({...})` object key (Vue `.js.vue`).
 *
 * The `.jsx` typedef and the story argTypes cannot carry a tag, so they state
 * a deprecation in text, with a fixed prefix the other two readers look for.
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

/** How a `.jsx` typedef `@property` description starts for a deprecated prop. */
export const JSX_DEPRECATED_PREFIX = 'Deprecated: ';

/**
 * Each `@property {type} [name] - description` line of a `.jsx` typedef, by
 * prop name: the deprecation message after `JSX_DEPRECATED_PREFIX`, or `null`
 * for a description without it.
 */
export function readJsxTypedefDeprecations(
  source: string
): Map<string, string | null> {
  const found = new Map<string, string | null>();
  const line =
    /^\s*\*\s*@property\s+\{[^}]*\}\s+\[([^\]=\s]+)[^\]]*\]\s+-\s+(.*)$/gm;
  for (const [, name, description] of source.matchAll(line)) {
    if (found.has(name)) continue;
    found.set(
      name,
      description.startsWith(JSX_DEPRECATED_PREFIX)
        ? description.slice(JSX_DEPRECATED_PREFIX.length)
        : null
    );
  }
  return found;
}

/** How a story argType `description` starts for a deprecated prop. */
export const STORY_DEPRECATED_PREFIX = '**Deprecated.** ';

/**
 * Each entry of a story file's `argTypes`, by prop name: the deprecation
 * message after `STORY_DEPRECATED_PREFIX` in its `description`, or `null`
 * when the description does not start with it (or is not a plain string).
 */
export function readStoryDeprecations(
  source: string
): Map<string, string | null> {
  const file = ts.createSourceFile(
    'story.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const found = new Map<string, string | null>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      propertyName(node.name) === 'argTypes' &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const entry of node.initializer.properties) {
        if (!ts.isPropertyAssignment(entry)) continue;
        const name = propertyName(entry.name);
        if (name === null || !ts.isObjectLiteralExpression(entry.initializer)) {
          continue;
        }
        const description = entry.initializer.properties.find(
          (p): p is ts.PropertyAssignment =>
            ts.isPropertyAssignment(p) && propertyName(p.name) === 'description'
        )?.initializer;
        const text =
          description && ts.isStringLiteralLike(description)
            ? description.text
            : '';
        found.set(
          name,
          text.startsWith(STORY_DEPRECATED_PREFIX)
            ? text.slice(STORY_DEPRECATED_PREFIX.length)
            : null
        );
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}
