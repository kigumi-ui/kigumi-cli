/**
 * Deprecated registry props reach consumers (issue #129).
 *
 * A registry prop marked `deprecated` stays in every Template but carries a
 * JSDoc `@deprecated` tag, which is what makes an editor strike it through.
 * Two things are proven here:
 *
 * 1. A consumer's TypeScript really reports it. Templates generated from a
 *    fixture are handed to the TypeScript language service next to a consumer
 *    that uses the deprecated props, and the service must report its
 *    deprecation diagnostic on exactly those: React through JSX attributes,
 *    and Vue, in both dialects, through the props type Vue's own component
 *    types derive (the `.js.vue` tag sits on a runtime `defineProps` key, so
 *    this is what shows it survives Vue's mapped types). None of this depends
 *    on what the registry currently deprecates, so it keeps proving the
 *    mechanism after the last deprecated prop is removed.
 * 2. Every committed surface states exactly the registry's deprecations, in
 *    both directions: the four TypeScript Templates and the docs wrappers by
 *    JSDoc tag, the `.jsx` typedef and the story argTypes by their text
 *    prefix (see `_helpers/deprecation-readers.ts`).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parse as parseSfc } from 'vue/compiler-sfc';
import { describe, expect, it } from 'vitest';
import { generateReactTypescriptTemplate } from '../../scripts/generate-react-templates.js';
import {
  generateVueJavascriptTemplate,
  generateVueTypescriptTemplate,
} from '../../scripts/generate-vue-templates.js';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import type { ComponentDefinition } from '../../src/utils/registry.js';
import { toCamelCase, toKebabCase } from '../../src/utils/naming.js';
import {
  readJsxTypedefDeprecations,
  readPropDeprecations,
  readStoryDeprecations,
} from './_helpers/deprecation-readers.js';
import { DEPRECATED_PROPS } from './_helpers/deprecated-props-fixture.js';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

/** TypeScript's suggestion diagnostic: "'{0}' is deprecated." */
const DEPRECATED_DIAGNOSTIC = 6385;

const PROBE_FIXTURE: ComponentDefinition = {
  name: 'Badge',
  tagName: 'wa-badge',
  category: 'Display',
  description: 'Deprecation probe',
  dependencies: [],
  files: { react: ['components/Badge.tsx'], vue: ['components/Badge.vue'] },
  props: [
    {
      name: 'pill',
      type: 'boolean',
      default: 'false',
      description: 'Not deprecated',
    },
    ...DEPRECATED_PROPS,
  ],
  importPath: '@awesome.me/webawesome/dist/components/badge/badge.js',
  tier: 'free',
};

/**
 * The names TypeScript reports as deprecated in `entry`, compiled with the
 * options (and ambient shims) of `tsconfig`, next to in-memory `files`.
 */
function deprecatedNamesSeenBy(
  tsconfig: string,
  files: Record<string, string>,
  entry: string
): string[] {
  const parsed = ts.getParsedCommandLineOfConfigFile(tsconfig, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      );
    },
  });
  if (!parsed) throw new Error(`cannot read ${tsconfig}`);

  const shims = parsed.fileNames.filter((file) =>
    file.includes('typecheck-shims')
  );
  const virtual = new Map(Object.entries(files));
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [...shims, ...virtual.keys()],
    getScriptVersion: () => '1',
    getScriptSnapshot: (file) => {
      const text = virtual.get(file) ?? ts.sys.readFile(file);
      return text === undefined
        ? undefined
        : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => path.dirname(tsconfig),
    getCompilationSettings: () => parsed.options,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: (file) => virtual.has(file) || ts.sys.fileExists(file),
    readFile: (file) => virtual.get(file) ?? ts.sys.readFile(file),
    // pnpm links packages; resolution has to follow the links.
    realpath: ts.sys.realpath,
    readDirectory: ts.sys.readDirectory,
    // Module resolution skips a directory that does not exist, and the
    // probe's lives only in memory.
    directoryExists: (dir) =>
      [...virtual.keys()].some((file) => path.dirname(file) === dir) ||
      ts.sys.directoryExists(dir),
    getDirectories: ts.sys.getDirectories,
  };
  const service = ts.createLanguageService(host);

  const errors = service
    .getSemanticDiagnostics(entry)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  expect(errors, 'the probe must type-check, or it proves nothing').toEqual([]);

  const text = virtual.get(entry) ?? '';
  return service
    .getSuggestionDiagnostics(entry)
    .filter((d) => d.code === DEPRECATED_DIAGNOSTIC && d.start !== undefined)
    .map((d) => text.slice(d.start, (d.start ?? 0) + (d.length ?? 0)))
    .map((name) => name.replace(/^['"]|['"]$/g, ''))
    .sort();
}

/** The `<script setup>` of a generated SFC, parsed. */
function scriptSetupOf(sfc: string): ts.SourceFile {
  const block = parseSfc(sfc).descriptor.scriptSetup;
  if (!block) throw new Error('generated SFC has no <script setup>');
  return ts.createSourceFile(
    'script.ts',
    block.content,
    ts.ScriptTarget.Latest,
    true
  );
}

function findNode<T extends ts.Node>(
  root: ts.Node,
  test: (node: ts.Node) => node is T
): T {
  let found: T | undefined;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (test(node)) found = node;
    else ts.forEachChild(node, visit);
  };
  visit(root);
  if (!found) throw new Error('expected declaration not found');
  return found;
}

/** A consumer reading every probe prop, so each deprecated one is flagged. */
const READ_PROBE_PROPS = PROBE_FIXTURE.props
  .map((prop) => `props[${JSON.stringify(prop.name)}]`)
  .join(', ');

describe('a consumer sees a deprecated prop', () => {
  it('React: flags exactly the deprecated JSX attributes of a generated Template', () => {
    const dir = path.join(ROOT, 'templates/react/__DeprecationProbe__');
    const seen = deprecatedNamesSeenBy(
      path.join(ROOT, 'templates/react/tsconfig.json'),
      {
        [path.join(dir, 'Badge.tsx')]:
          generateReactTypescriptTemplate(PROBE_FIXTURE),
        [path.join(dir, 'Consumer.tsx')]: [
          "import { Badge } from './Badge';",
          'export const used = <Badge pill min={0} index-axis="x" />;',
          '',
        ].join('\n'),
      },
      path.join(dir, 'Consumer.tsx')
    );
    expect(seen).toEqual(['index-axis', 'min']);
  });

  it('Vue .vue: flags exactly the deprecated members of the generated props interface', () => {
    const script = scriptSetupOf(generateVueTypescriptTemplate(PROBE_FIXTURE));
    const props = findNode(script, ts.isInterfaceDeclaration);
    const dir = path.join(ROOT, 'templates/vue/__DeprecationProbe__');
    const entry = path.join(dir, 'consumer.ts');
    const seen = deprecatedNamesSeenBy(
      path.join(ROOT, 'templates/vue/tsconfig.json'),
      {
        [entry]: [
          props.getText(script),
          `declare const props: ${props.name.text};`,
          `export const read = [${READ_PROBE_PROPS}];`,
          '',
        ].join('\n'),
      },
      entry
    );
    expect(seen).toEqual(['index-axis', 'min']);
  });

  it("Vue .js.vue: flags exactly the deprecated keys of the generated runtime props, through Vue's component types", () => {
    const script = scriptSetupOf(generateVueJavascriptTemplate(PROBE_FIXTURE));
    const call = findNode(
      script,
      (node): node is ts.CallExpression =>
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'defineProps'
    );
    const dir = path.join(ROOT, 'templates/vue/__DeprecationProbe__');
    const entry = path.join(dir, 'consumer.ts');
    const seen = deprecatedNamesSeenBy(
      path.join(ROOT, 'templates/vue/tsconfig.json'),
      {
        [entry]: [
          "import { defineComponent } from 'vue';",
          `const Probe = defineComponent({ props: ${call.arguments[0].getText(script)} });`,
          "declare const props: InstanceType<typeof Probe>['$props'];",
          `export const read = [${READ_PROBE_PROPS}];`,
          '',
        ].join('\n'),
      },
      entry
    );
    expect(seen).toEqual(['index-axis', 'min']);
  });
});

interface Surface {
  label: string;
  file: (component: ComponentDefinition) => string;
  /** Each prop the surface declares, with its deprecation message or null. */
  read: (source: string) => Map<string, string | null>;
  /** The name a registry prop is declared under on this surface. */
  propName: (name: string) => string;
}

const same = (name: string): string => name;

const SURFACES: Surface[] = [
  {
    label: 'React .tsx',
    file: (c) => `templates/react/${c.name}/${c.name}.tsx`,
    read: (source) => readPropDeprecations(source, 'tsx'),
    propName: same,
  },
  {
    label: 'React .jsx typedef',
    file: (c) => `templates/react/${c.name}/${c.name}.jsx`,
    read: readJsxTypedefDeprecations,
    propName: same,
  },
  {
    label: 'Vue .vue',
    file: (c) => `templates/vue/${c.name}/${c.name}.vue`,
    read: (source) => readPropDeprecations(source, 'vue'),
    propName: same,
  },
  {
    label: 'Vue .js.vue',
    file: (c) => `templates/vue/${c.name}/${c.name}.js.vue`,
    read: (source) => readPropDeprecations(source, 'vue'),
    propName: same,
  },
  {
    label: 'Angular',
    file: (c) =>
      `templates/angular/${c.name}/${toKebabCase(c.name)}.component.ts`,
    read: (source) => readPropDeprecations(source, 'ts'),
    propName: toCamelCase,
  },
  {
    label: 'docs wrapper',
    file: (c) => `docs/src/components/ui/${c.name}/${c.name}.tsx`,
    read: (source) => readPropDeprecations(source, 'tsx'),
    propName: same,
  },
  {
    label: 'story argTypes',
    file: (c) => `docs/src/stories/${c.name}.stories.tsx`,
    read: readStoryDeprecations,
    propName: same,
  },
];

describe('every surface states exactly the registry deprecations', () => {
  for (const surface of SURFACES) {
    it(`${surface.label}: deprecated props say so with the registry message, and nothing else does`, () => {
      const mismatches: string[] = [];
      let compared = 0;

      for (const [key, component] of Object.entries(LOCAL_REGISTRY)) {
        const file = surface.file(component);
        const declared = surface.read(
          readFileSync(path.join(ROOT, file), 'utf8')
        );
        for (const prop of component.props) {
          const name = surface.propName(prop.name);
          const expected = prop.deprecated ?? null;
          // Not every surface declares every prop (Vue v-models, hand-written
          // typedefs), but a deprecated one has to say so wherever it goes.
          if (!declared.has(name)) {
            if (expected !== null) {
              mismatches.push(
                `${key}.${prop.name}: deprecated but not declared in ${file}`
              );
            }
            continue;
          }
          compared++;
          if (declared.get(name) !== expected) {
            mismatches.push(
              `${key}.${prop.name}: registry ${JSON.stringify(expected)}, ${file} ${JSON.stringify(declared.get(name))}`
            );
          }
        }
        for (const [name, message] of declared) {
          const isProp = component.props.some(
            (prop) => surface.propName(prop.name) === name
          );
          if (!isProp && message !== null) {
            mismatches.push(
              `${key}: ${file} deprecates ${name}, which is no registry prop`
            );
          }
        }
      }

      expect(mismatches).toEqual([]);
      // Guard against a reader that found nothing: every surface declares props.
      expect(compared).toBeGreaterThan(300);
    });
  }
});
