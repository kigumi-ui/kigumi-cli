/**
 * Function harness loop over every React Template (issue #75).
 *
 * Extends the #74 tracer (proven against Dialog only) to every component in
 * `LOCAL_REGISTRY`. Each Template is proven against its own
 * `COMPONENT_METADATA` entry: host tag, CEM attributes, CEM listeners with
 * cleanup, className forwarding, and now public CEM methods on the exposed
 * ref. A registry component with no (or incomplete) metadata fails the
 * coverage assertion below rather than being silently skipped by the loop.
 */
// @vitest-environment jsdom

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import { proveReactTemplate } from './react-function-harness.js';
import type { ReactTemplateProbe } from './react-function-harness.js';
import type { ComponentMetadata } from '../../src/utils/metadata-types.js';

afterEach(() => {
  cleanup();
});

describe('registry coverage (fail closed)', () => {
  it('has a COMPONENT_METADATA entry for every registry component', () => {
    const missing = Object.keys(LOCAL_REGISTRY).filter(
      (slug) => !(slug in COMPONENT_METADATA)
    );
    expect(missing).toEqual([]);
  });
});

describe('every React Template against CEM metadata', () => {
  for (const [slug, definition] of Object.entries(LOCAL_REGISTRY)) {
    it(`${definition.name} (${slug}) matches its CEM contract`, async () => {
      const metadata = COMPONENT_METADATA[slug];
      expect(
        metadata,
        `no COMPONENT_METADATA entry for registry component "${slug}"`
      ).toBeDefined();

      const modulePath = `../../templates/react/${definition.name}/${definition.name}.js`;
      const mod = (await import(/* @vite-ignore */ modulePath)) as Record<
        string,
        unknown
      >;
      const Component = mod[definition.name] as React.ForwardRefExoticComponent<
        React.RefAttributes<Record<string, unknown>>
      >;
      expect(
        Component,
        `templates/react/${definition.name}/${definition.name}.tsx does not export "${definition.name}"`
      ).toBeDefined();

      const attributes = probeAttributes(metadata.attributes);

      const violations = await proveReactTemplate({
        metadata,
        attributes,
        className: 'probe-class',
        mount: ({ attributes: props, className, handlers }) => {
          const refHandle: { current: Record<string, unknown> | null } = {
            current: null,
          };
          const view = render(
            React.createElement(Component, {
              ...props,
              className,
              ...handlers,
              ref: refHandle,
            } as React.ComponentProps<typeof Component>)
          );
          return {
            container: view.container,
            unmount: view.unmount,
            refHandle,
          };
        },
      });

      expect(violations).toEqual([]);
    });
  }
});

/**
 * Turn committed CEM attributes into probe values: boolean attributes are
 * probed as true (the harness also remounts them as false), everything else
 * — string-typed or untyped, e.g. did-ssr — gets a sentinel string so a
 * hardcoded value in the Template cannot pass.
 */
function probeAttributes(
  attributes: ComponentMetadata['attributes']
): ReactTemplateProbe['attributes'] {
  return attributes.map((attribute) => ({
    name: attribute.name,
    value: attribute.type === 'boolean' ? true : `probe-${attribute.name}`,
  }));
}
