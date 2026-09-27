/**
 * Every registry prop is a typed prop of the component's React and Vue
 * TypeScript Templates (issue #101).
 *
 * The function harnesses prove an attribute reaches the host, but React and
 * Vue forward undeclared attributes too (rest spread, `useAttrs()`), so a
 * prop the generator forgot to type still passes them. This reads the
 * Templates' declared surface instead: the `<Name>Props` interface in the
 * `.tsx`, and the props the `.vue` declares, where a `v-model` Template
 * declares `modelValue` in place of the attribute its model carries
 * (`_helpers/vue-model-attributes.ts`). A hand-maintained `.jsx` has no
 * interface; where it documents its props in a `<Name>Props` JSDoc typedef,
 * that typedef must name every registry prop too. The Angular half is the Angular
 * registry harness, which fails on a CEM attribute with no `@Input()` unless
 * `_helpers/angular-omitted-inputs.ts` pins it.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { extractVueSurface } from '../../scripts/check-generated-fresh.js';
import { VUE_MODEL_ATTRIBUTE } from './_helpers/vue-model-attributes.js';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

/** The member names of `interface <name>` in a TypeScript module. */
function interfaceMembers(source: string, name: string): Set<string> | null {
  const file = ts.createSourceFile(
    'template.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  for (const statement of file.statements) {
    if (ts.isInterfaceDeclaration(statement) && statement.name.text === name) {
      const members = new Set<string>();
      for (const member of statement.members) {
        const memberName = member.name;
        if (
          memberName &&
          (ts.isIdentifier(memberName) || ts.isStringLiteral(memberName))
        ) {
          members.add(memberName.text);
        }
      }
      return members;
    }
  }
  return null;
}

/**
 * The prop names a `.jsx` documents in its `@typedef {Object} <name>Props`,
 * or `null` when it has no such typedef.
 */
function jsdocTypedefProps(source: string, name: string): Set<string> | null {
  const typedef = new RegExp(
    `@typedef \\{Object\\} ${name}Props([\\s\\S]*?)\\*/`
  ).exec(source);
  if (!typedef) return null;
  return new Set(
    [...typedef[1].matchAll(/@property \{[^}]*\} \[?([\w-]+)/g)].map(
      (match) => match[1]
    )
  );
}

describe('registry props are typed in every React and Vue Template', () => {
  for (const [slug, component] of Object.entries(LOCAL_REGISTRY)) {
    const propNames = component.props.map((prop) => prop.name);

    it(`${component.name}.tsx declares each registry prop in ${component.name}Props`, async () => {
      const source = await fs.readFile(
        path.join(
          REPO_ROOT,
          'templates/react',
          component.name,
          `${component.name}.tsx`
        ),
        'utf-8'
      );
      const members = interfaceMembers(source, `${component.name}Props`);
      expect(members).not.toBeNull();
      const missing = propNames.filter((name) => !members?.has(name));
      expect(missing).toEqual([]);
    });

    it(`${component.name}.jsx documents each registry prop, if it documents any`, async () => {
      const source = await fs.readFile(
        path.join(
          REPO_ROOT,
          'templates/react',
          component.name,
          `${component.name}.jsx`
        ),
        'utf-8'
      );
      const documented = jsdocTypedefProps(source, component.name);
      if (!documented) return;
      const missing = propNames.filter((name) => !documented.has(name));
      expect(missing).toEqual([]);
    });

    it(`${component.name}.vue declares each registry prop`, async () => {
      const source = await fs.readFile(
        path.join(
          REPO_ROOT,
          'templates/vue',
          component.name,
          `${component.name}.vue`
        ),
        'utf-8'
      );
      const surface = extractVueSurface(source);
      expect(surface.unreadable).toEqual([]);
      const model = VUE_MODEL_ATTRIBUTE[slug];
      const missing = propNames
        .map((name) => (name === model ? 'modelValue' : name))
        .filter((name) => !surface.props.has(name));
      expect(missing).toEqual([]);
    });
  }
});
