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
 * interface; where it documents its props in a `<Name>Props` JSDoc typedef
 * (the files `JSX_PROPS_TYPEDEFS` pins), that typedef must name every
 * registry prop too. The Angular half is the Angular
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

/**
 * The member names of `interface <name>` in a TypeScript module. A
 * `type <name> = ...` alias declares no members of its own: the generator
 * writes one for a wrapper with no props and no events (issue #136).
 */
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
    if (ts.isTypeAliasDeclaration(statement) && statement.name.text === name) {
      return new Set();
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

/**
 * The prop names a `.jsx` documents as `@param {...} [props.<name>]` (or
 * `[props['<name>']]`, or unbracketed for a required prop) under an
 * `@param {Object} props`, or `null` when it has no such list.
 */
function jsdocParamProps(source: string): Set<string> | null {
  if (!source.includes('@param {Object} props')) return null;
  return new Set(
    [
      ...source.matchAll(
        /@param \{[^}]*\} \[?props(?:\.(\w+)|\['([\w-]+)'\])/g
      ),
    ].map((match) => match[1] ?? match[2])
  );
}

/**
 * The `.jsx` Templates that document their props as an `@param props.*`
 * list instead of a typedef (issue #102: TimeInput's list lacked the props
 * #101 and #102 added, and nothing read it). Pinned as committed data for
 * the same reason as `JSX_PROPS_TYPEDEFS` below.
 */
const JSX_PROPS_PARAMS: ReadonlySet<string> = new Set([
  'Accordion',
  'AccordionItem',
  'Card',
  'Dialog',
  'Drawer',
  'KnownDate',
  'TimeInput',
]);

/**
 * The `.jsx` Templates that document their props in a `<Name>Props` JSDoc
 * typedef. Pinned as committed data rather than read from the files: a
 * derived list would drop a component whose typedef was deleted, and the
 * check below would then pass without running for it. Adding or removing a
 * typedef means editing this list in the same commit.
 */
const JSX_PROPS_TYPEDEFS: ReadonlySet<string> = new Set([
  'AnimatedImage',
  'Animation',
  'Avatar',
  'Badge',
  'BarChart',
  'Breadcrumb',
  'BreadcrumbItem',
  'BubbleChart',
  'Button',
  'ButtonGroup',
  'Callout',
  'Carousel',
  'Chart',
  'Checkbox',
  'CheckboxGroup',
  'DateInput',
  'DatePicker',
  'Divider',
  'DoughnutChart',
  'FileInput',
  'FormatBytes',
  'Icon',
  'Input',
  'LineChart',
  'NumberInput',
  'Page',
  'PieChart',
  'PolarAreaChart',
  'QrCode',
  'RadarChart',
  'RandomContent',
  'ScatterChart',
  'Sparkline',
  'Toast',
  'ToastItem',
  'Video',
  'VideoPlaylist',
]);

describe('registry props are typed in every React and Vue Template', () => {
  it('pins only registry components as documenting .jsx props', () => {
    const components = new Set(
      Object.values(LOCAL_REGISTRY).map((component) => component.name)
    );
    expect(
      [...JSX_PROPS_TYPEDEFS, ...JSX_PROPS_PARAMS].filter(
        (name) => !components.has(name)
      )
    ).toEqual([]);
  });

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

    it(`${component.name}.jsx documents each registry prop where it pins a props typedef`, async () => {
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
      expect(
        documented !== null,
        `${component.name}.jsx has a ${component.name}Props typedef exactly when JSX_PROPS_TYPEDEFS lists it`
      ).toBe(JSX_PROPS_TYPEDEFS.has(component.name));
      // Reached only where the pin says there is no typedef to check.
      if (!documented) return;
      const missing = propNames.filter((name) => !documented.has(name));
      expect(missing).toEqual([]);
    });

    it(`${component.name}.jsx documents each registry prop where it pins an @param props list`, async () => {
      const source = await fs.readFile(
        path.join(
          REPO_ROOT,
          'templates/react',
          component.name,
          `${component.name}.jsx`
        ),
        'utf-8'
      );
      const documented = jsdocParamProps(source);
      expect(
        documented !== null,
        `${component.name}.jsx has an @param {Object} props list exactly when JSX_PROPS_PARAMS lists it`
      ).toBe(JSX_PROPS_PARAMS.has(component.name));
      // Reached only where the pin says there is no @param list to check.
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
