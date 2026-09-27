/**
 * The enumerated-boolean pin (`_helpers/enumerated-boolean-attributes.ts`)
 * against Web Awesome's own runtime, and the registry against the pin
 * (issue #101).
 *
 * The CEM types `spellcheck` and `autocorrect` as plain booleans; only the
 * Lit property converter says they are written "true"/"false" and "on"/"off".
 * So the pin is proven by loading every Free registry component's real class
 * and reading its `elementProperties`: each boolean property with a converter
 * that writes `false` as a value must be pinned with exactly those keywords,
 * and each pinned attribute must still be one. The Web Awesome deep-import
 * stub (`vitest.wa-stub-alias.ts`) only matches bare specifiers, so the
 * absolute paths imported here reach the real package. Pro is not installed
 * in this lane; its elements declare the same attributes, and the harnesses
 * hold their Templates to the same pin.
 */
// @vitest-environment jsdom

import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { ENUMERATED_BOOLEAN_ATTRIBUTES } from './_helpers/enumerated-boolean-attributes.js';

const require = createRequire(import.meta.url);

interface PropertyOptions {
  type?: unknown;
  attribute?: string | boolean;
  converter?: {
    fromAttribute?: (value: string | null) => unknown;
    toAttribute?: (value: unknown) => unknown;
  };
}

interface LitClass {
  elementProperties: Map<string, PropertyOptions>;
}

interface EnumeratedFinding {
  attribute: string;
  keywords: { true: unknown; false: unknown };
  reads: { true: unknown; false: unknown };
}

/** Every boolean property of `cls` whose converter writes `false` as a value. */
function enumeratedBooleans(cls: LitClass): EnumeratedFinding[] {
  const found: EnumeratedFinding[] = [];
  for (const [property, options] of cls.elementProperties) {
    const toAttribute = options.converter?.toAttribute;
    const fromAttribute = options.converter?.fromAttribute;
    if (options.type !== Boolean || !toAttribute || !fromAttribute) continue;
    if (options.attribute === false) continue;
    const off = toAttribute(false);
    if (off === null || off === undefined) continue;
    const on = toAttribute(true);
    found.push({
      attribute:
        typeof options.attribute === 'string'
          ? options.attribute
          : property.toLowerCase(),
      keywords: { true: on, false: off },
      reads: {
        true: fromAttribute(String(on)),
        false: fromAttribute(String(off)),
      },
    });
  }
  return found;
}

const FREE_COMPONENTS = Object.entries(LOCAL_REGISTRY).filter(
  ([, component]) => component.tier === 'free'
);

// `wa-random-content` adopts a document-level stylesheet when its module
// loads, and jsdom has no `document.adoptedStyleSheets`. Only the class
// definitions are read here, so an empty list is enough to let it load.
if (!Array.isArray(document.adoptedStyleSheets)) {
  Object.defineProperty(document, 'adoptedStyleSheets', {
    value: [],
    writable: true,
    configurable: true,
  });
}

describe('enumerated-boolean pin against the Free runtime', () => {
  it('pins exactly the enumerated booleans Free elements declare, with their keywords', async () => {
    const seen = new Map<string, string[]>();
    const mismatches: string[] = [];
    for (const [slug, component] of FREE_COMPONENTS) {
      const file = require.resolve(component.importPath);
      const mod = (await import(/* @vite-ignore */ file)) as {
        default: LitClass;
      };
      for (const finding of enumeratedBooleans(mod.default)) {
        seen.set(finding.attribute, [
          ...(seen.get(finding.attribute) ?? []),
          slug,
        ]);
        const pinned = ENUMERATED_BOOLEAN_ATTRIBUTES[finding.attribute];
        if (
          !pinned ||
          finding.keywords.true !== pinned.true ||
          finding.keywords.false !== pinned.false
        ) {
          mismatches.push(
            `${slug}.${finding.attribute} writes ${JSON.stringify(finding.keywords)}, pinned ${JSON.stringify(pinned)}`
          );
        }
        // The premise of the pin: each keyword reads back as its own value.
        if (finding.reads.true !== true || finding.reads.false !== false) {
          mismatches.push(
            `${slug}.${finding.attribute} does not read its own keywords back`
          );
        }
      }
    }
    expect(mismatches).toEqual([]);
    // Both directions: a pinned attribute no Free element declares any more
    // is stale, and would let the harness expect keywords nothing writes.
    expect([...seen.keys()].sort()).toEqual(
      Object.keys(ENUMERATED_BOOLEAN_ATTRIBUTES).sort()
    );
    // The premise: the walk read real classes, not stubs with no properties.
    expect(seen.get('spellcheck')).toEqual(
      expect.arrayContaining(['input', 'textarea', 'tag-input'])
    );
  });
});

describe('registry keywords agree with the pin', () => {
  it('gives every pinned boolean prop its keywords, and no other prop any', () => {
    const disagreements: string[] = [];
    for (const [slug, component] of Object.entries(LOCAL_REGISTRY)) {
      for (const prop of component.props) {
        const pinned = ENUMERATED_BOOLEAN_ATTRIBUTES[prop.name];
        if (pinned && prop.type !== 'boolean') continue;
        const expected = pinned
          ? { true: pinned.true, false: pinned.false }
          : undefined;
        if (JSON.stringify(prop.keywords) !== JSON.stringify(expected)) {
          disagreements.push(
            `${slug}.${prop.name}: keywords ${JSON.stringify(prop.keywords)}, pinned ${JSON.stringify(expected)}`
          );
        }
      }
    }
    expect(disagreements).toEqual([]);
  });

  it('declares no default for an enumerated prop, so unset leaves the element default', () => {
    const withDefault = Object.entries(LOCAL_REGISTRY).flatMap(
      ([slug, component]) =>
        component.props
          .filter((prop) => prop.keywords && prop.default !== undefined)
          .map((prop) => `${slug}.${prop.name}`)
    );
    expect(withDefault).toEqual([]);
  });
});
