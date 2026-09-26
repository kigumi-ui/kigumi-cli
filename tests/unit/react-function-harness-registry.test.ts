/**
 * Function harness loop over every React Template (issue #75).
 *
 * Extends the #74 tracer (proven against Dialog only) to every component in
 * `LOCAL_REGISTRY`. Each Template is proven against its own
 * `COMPONENT_METADATA` entry: host tag, CEM attributes, CEM listeners with
 * cleanup, className forwarding, and now public CEM methods on the exposed
 * ref. A registry component with no (or incomplete) metadata fails the
 * coverage assertions below rather than being silently skipped by the loop.
 *
 * Fail-closed means more than a present key: each run also asserts what it
 * exercised (`proved`), so emptying a component's `attributes` or `methods`
 * array cannot be mistaken for a component that never had any (ADR 0003).
 */
// @vitest-environment jsdom

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import {
  probeAttributes,
  proveReactTemplate,
} from './react-function-harness.js';

afterEach(() => {
  cleanup();
});

/**
 * Registry components whose CEM genuinely exposes no public methods, pinned
 * as committed data rather than derived from `COMPONENT_METADATA` — a derived
 * list would move with an emptied `methods` array and re-open the hole it
 * exists to close (ADR 0003). A WA bump that adds or removes a public method
 * edits this list in the same commit as the regenerated metadata.
 */
const METHODLESS_COMPONENTS: readonly string[] = [
  'animated-image',
  'avatar',
  'badge',
  'bar-chart',
  'breadcrumb',
  'breadcrumb-item',
  'bubble-chart',
  'button-group',
  'callout',
  'card',
  'carousel-item',
  'chart',
  'checkbox-group',
  'comparison',
  'copy-button',
  'dialog',
  'divider',
  'doughnut-chart',
  'drawer',
  'dropdown',
  'format-bytes',
  'format-date',
  'format-number',
  'icon',
  'include',
  'intersection-observer',
  'line-chart',
  'mutation-observer',
  'option',
  'pagination',
  'pie-chart',
  'polar-area-chart',
  'progress-bar',
  'progress-ring',
  'qr-code',
  'radar-chart',
  'relative-time',
  'resize-observer',
  'scatter-chart',
  'scroller',
  'skeleton',
  'sparkline',
  'spinner',
  'split-panel',
  'tab',
  'tab-group',
  'tab-panel',
  'tag',
  'tree',
];

const METHODLESS = new Set(METHODLESS_COMPONENTS);

describe('registry coverage (fail closed)', () => {
  it('has a COMPONENT_METADATA entry for every registry component', () => {
    const missing = Object.keys(LOCAL_REGISTRY).filter(
      (slug) => !(slug in COMPONENT_METADATA)
    );
    expect(missing).toEqual([]);
  });

  it('has a non-empty attribute list for every registry component', () => {
    const empty = Object.keys(LOCAL_REGISTRY).filter(
      (slug) => (COMPONENT_METADATA[slug]?.attributes.length ?? 0) === 0
    );
    expect(empty).toEqual([]);
  });

  it('keeps public CEM methods for every component not pinned as methodless', () => {
    const gutted = Object.keys(LOCAL_REGISTRY)
      .filter((slug) => !METHODLESS.has(slug))
      .filter((slug) => (COMPONENT_METADATA[slug]?.methods.length ?? 0) === 0);
    expect(gutted).toEqual([]);
  });

  it('pins only components that really have no public CEM methods', () => {
    const stale = METHODLESS_COMPONENTS.filter(
      (slug) => (COMPONENT_METADATA[slug]?.methods.length ?? 0) > 0
    );
    expect(stale).toEqual([]);
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

      const { violations, proved } = await proveReactTemplate({
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

      // A clean run must also be a run that checked something: every registry
      // component has attributes, and only the pinned methodless ones may
      // prove zero methods (ADR 0003).
      expect(proved.attributes).toBe(metadata.attributes.length);
      expect(proved.attributes).toBeGreaterThan(0);
      expect(proved.events).toBe(metadata.events.length);
      expect(proved.methods).toBe(metadata.methods.length);
      if (!METHODLESS.has(slug)) {
        expect(proved.methods).toBeGreaterThan(0);
      }
    });
  }
});
