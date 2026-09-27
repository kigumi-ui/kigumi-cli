/**
 * Deprecated registry props reach consumers (issue #129).
 *
 * A registry prop marked `deprecated` stays in every Template but carries a
 * JSDoc `@deprecated` tag, which is what makes an editor strike it through.
 * Two things are proven here:
 *
 * 1. A consumer really sees it. A React Template generated from a fixture is
 *    handed to the TypeScript language service next to a consumer that sets
 *    the deprecated props, and the service must report its deprecation
 *    diagnostic on exactly those. This does not depend on what the registry
 *    currently deprecates, so it keeps proving the mechanism after the last
 *    deprecated prop is removed.
 * 2. The committed Templates carry exactly the registry's deprecations, in
 *    both directions: every deprecated prop has the tag with the registry's
 *    message, and no other prop has one. Tags are read through TypeScript's
 *    own JSDoc parser (`_helpers/jsdoc-deprecation.ts`).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { generateReactTypescriptTemplate } from '../../scripts/generate-react-templates.js';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import type { ComponentDefinition } from '../../src/utils/registry.js';
import { toCamelCase, toKebabCase } from '../../src/utils/naming.js';
import {
  readPropDeprecations,
  type TemplateSourceKind,
} from './_helpers/jsdoc-deprecation.js';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const REACT_TEMPLATES = path.join(ROOT, 'templates/react');

/** TypeScript's suggestion diagnostic: "'{0}' is deprecated." */
const DEPRECATED_DIAGNOSTIC = 6385;

const PROBE_FIXTURE: ComponentDefinition = {
  name: 'Badge',
  tagName: 'wa-badge',
  category: 'Display',
  description: 'Deprecation probe',
  dependencies: [],
  files: { react: ['components/Badge.tsx'] },
  props: [
    {
      name: 'pill',
      type: 'boolean',
      default: 'false',
      description: 'Not deprecated',
    },
    {
      name: 'min',
      type: 'number',
      description: 'Floor value for the value axis scale',
      deprecated: 'Set options.scales.r.min in the chart JSON config instead.',
    },
    {
      name: 'index-axis',
      type: 'string',
      values: ['x', 'y'],
      deprecated: 'Has no effect on this chart.',
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/badge/badge.js',
  tier: 'free',
};

/**
 * The names a consumer's TypeScript reports as deprecated in `consumer`,
 * with the React Templates' own compiler options and shims.
 */
function deprecatedNamesSeenBy(files: Record<string, string>): string[] {
  const configPath = path.join(REACT_TEMPLATES, 'tsconfig.json');
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      );
    },
  });
  if (!parsed) throw new Error(`cannot read ${configPath}`);

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
    getCurrentDirectory: () => REACT_TEMPLATES,
    getCompilationSettings: () => parsed.options,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: (file) => virtual.has(file) || ts.sys.fileExists(file),
    readFile: (file) => virtual.get(file) ?? ts.sys.readFile(file),
    readDirectory: ts.sys.readDirectory,
    // Module resolution skips a directory that does not exist, and the
    // probe's lives only in memory.
    directoryExists: (dir) =>
      [...virtual.keys()].some((file) => path.dirname(file) === dir) ||
      ts.sys.directoryExists(dir),
    getDirectories: ts.sys.getDirectories,
  };
  const service = ts.createLanguageService(host);

  const [consumerPath] = [...virtual.keys()].filter((file) =>
    file.endsWith('Consumer.tsx')
  );
  const errors = service
    .getSemanticDiagnostics(consumerPath)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  expect(
    errors,
    'the probe must type-check, or the check proves nothing'
  ).toEqual([]);

  const text = virtual.get(consumerPath) ?? '';
  return service
    .getSuggestionDiagnostics(consumerPath)
    .filter((d) => d.code === DEPRECATED_DIAGNOSTIC && d.start !== undefined)
    .map((d) => text.slice(d.start, (d.start ?? 0) + (d.length ?? 0)))
    .sort();
}

describe('a consumer sees a deprecated prop', () => {
  it('strikes through exactly the deprecated props of a generated React Template', () => {
    const dir = path.join(REACT_TEMPLATES, '__DeprecationProbe__');
    const seen = deprecatedNamesSeenBy({
      [path.join(dir, 'Badge.tsx')]:
        generateReactTypescriptTemplate(PROBE_FIXTURE),
      [path.join(dir, 'Consumer.tsx')]: [
        "import { Badge } from './Badge';",
        'export const used = <Badge pill min={0} index-axis="x" />;',
        '',
      ].join('\n'),
    });
    expect(seen).toEqual(['index-axis', 'min']);
  });
});

interface TemplateVariant {
  label: string;
  kind: TemplateSourceKind;
  file: (component: ComponentDefinition) => string;
  /** The name a registry prop is declared under in this Template. */
  propName: (name: string) => string;
}

const VARIANTS: TemplateVariant[] = [
  {
    label: 'React .tsx',
    kind: 'tsx',
    file: (c) => `templates/react/${c.name}/${c.name}.tsx`,
    propName: (name) => name,
  },
  {
    label: 'Vue .vue',
    kind: 'vue',
    file: (c) => `templates/vue/${c.name}/${c.name}.vue`,
    propName: (name) => name,
  },
  {
    label: 'Vue .js.vue',
    kind: 'vue',
    file: (c) => `templates/vue/${c.name}/${c.name}.js.vue`,
    propName: (name) => name,
  },
  {
    label: 'Angular',
    kind: 'ts',
    file: (c) =>
      `templates/angular/${c.name}/${toKebabCase(c.name)}.component.ts`,
    propName: toCamelCase,
  },
];

describe('committed Templates carry exactly the registry deprecations', () => {
  for (const variant of VARIANTS) {
    it(`${variant.label}: deprecated props are tagged, and nothing else is`, () => {
      const mismatches: string[] = [];
      let compared = 0;

      for (const [key, component] of Object.entries(LOCAL_REGISTRY)) {
        const file = variant.file(component);
        const tags = readPropDeprecations(
          readFileSync(path.join(ROOT, file), 'utf8'),
          variant.kind
        );
        for (const prop of component.props) {
          const name = variant.propName(prop.name);
          const expected = prop.deprecated ?? null;
          // Vue declares v-model props through defineModel, not as props.
          if (!tags.has(name)) {
            if (expected !== null) {
              mismatches.push(
                `${key}.${prop.name}: deprecated but not declared in ${file}`
              );
            }
            continue;
          }
          compared++;
          if (tags.get(name) !== expected) {
            mismatches.push(
              `${key}.${prop.name}: registry ${JSON.stringify(expected)}, ${file} ${JSON.stringify(tags.get(name))}`
            );
          }
        }
        for (const [name, message] of tags) {
          const declared = component.props.some(
            (prop) => variant.propName(prop.name) === name
          );
          if (!declared && message !== null) {
            mismatches.push(
              `${key}: ${file} deprecates ${name}, which is no registry prop`
            );
          }
        }
      }

      expect(mismatches).toEqual([]);
      // Guard against a reader that found nothing: every Template declares props.
      expect(compared).toBeGreaterThan(500);
    });
  }
});
