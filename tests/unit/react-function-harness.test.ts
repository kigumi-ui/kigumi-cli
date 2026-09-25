/**
 * Function harness tracer for one committed React Template (issue #74).
 *
 * Seam: proveReactTemplate mounts a Template and reports CEM contract
 * violations. Tag and events come from committed component metadata. Callback
 * names come from stripWaPrefix / toPascalCase, not from metadata.reactName.
 * Attribute names come from the pinned Free CEM declaration for wa-dialog:
 * component metadata does not carry attributes, and a handwritten list can
 * drift from that declaration without going red.
 *
 * Web Awesome's dialog module is stubbed at the package boundary so the
 * proof does not load the component runtime and does not need a Pro token.
 */
// @vitest-environment jsdom

import React from 'react';
import path from 'node:path';
import fs from 'fs-extra';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveCem } from '../../scripts/find-cem.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import { Dialog } from '../../templates/react/Dialog/Dialog.js';
import { proveReactTemplate } from './react-function-harness.js';
import type { ReactTemplateProbe } from './react-function-harness.js';

vi.mock('@awesome.me/webawesome/dist/components/dialog/dialog.js', () => ({
  default: class WaDialogStub {},
}));

afterEach(() => {
  cleanup();
});

const PROBE_CLASS = 'probe-class';
const REPO_ROOT = path.resolve(__dirname, '../..');

function prove(
  mount: ReactTemplateProbe['mount'],
  overrides: Partial<Omit<ReactTemplateProbe, 'mount' | 'className'>> = {}
): Promise<readonly string[]> {
  return proveReactTemplate({
    metadata: { tagName: 'wa-dialog', events: [] },
    attributes: [],
    className: PROBE_CLASS,
    mount,
    ...overrides,
  });
}

describe('proveReactTemplate', () => {
  it('reports a missing host tag', async () => {
    const violations = await prove(() => render(React.createElement('div')));

    expect(violations).toContain('host tag wa-dialog is missing');
  });

  it('reports a CEM attribute that never reaches the host', async () => {
    const violations = await prove(
      ({ className }) =>
        render(React.createElement('wa-dialog', { class: className })),
      { attributes: [{ name: 'label', value: 'Probe label' }] }
    );

    expect(violations).toEqual(['attribute label was not forwarded']);
  });

  it('reports a boolean attribute that stays when the prop is false', async () => {
    const violations = await prove(
      ({ className }) =>
        render(
          React.createElement('wa-dialog', { class: className, open: '' })
        ),
      { attributes: [{ name: 'open', value: true }] }
    );

    expect(violations).toEqual([
      'attribute open stayed on the host when the prop was false',
    ]);
  });

  it('reports a CEM listener that does not invoke the naming-helper callback', async () => {
    const violations = await prove(
      ({ className }) =>
        render(React.createElement('wa-dialog', { class: className })),
      {
        metadata: {
          tagName: 'wa-dialog',
          events: [
            {
              name: 'wa-after-show',
              reactName: 'onDefinitelyWrong',
              eventType: 'WaAfterShowEvent',
            },
          ],
        },
      }
    );

    expect(violations).toEqual([
      'dispatching wa-after-show did not invoke onAfterShow',
    ]);
  });

  it('reports a listener that survives unmount', async () => {
    const violations = await prove(
      ({ className, handlers }) =>
        render(React.createElement(LeakyShow, { className, ...handlers })),
      {
        metadata: {
          tagName: 'wa-dialog',
          events: [{ name: 'wa-show', eventType: 'WaShowEvent' }],
        },
      }
    );

    expect(violations).toContain('listener for wa-show was not removed');
  });

  it('reports className that does not land on the host class', async () => {
    const violations = await prove(() =>
      render(React.createElement('wa-dialog'))
    );

    expect(violations).toContain(
      `className ${PROBE_CLASS} was not forwarded to the host class`
    );
  });

  it('reports when rendering registers the Web Awesome element', async () => {
    const violations = await prove(
      ({ className }) => {
        if (!customElements.get('wa-probe')) {
          customElements.define('wa-probe', class extends HTMLElement {});
        }
        return render(React.createElement('wa-probe', { class: className }));
      },
      { metadata: { tagName: 'wa-probe', events: [] } }
    );

    expect(violations).toContain('Web Awesome registered wa-probe');
  });

  it('accepts the committed Dialog template against dialog metadata', async () => {
    const attributes = await dialogAttributesFromFreeCem();
    const violations = await prove(
      ({ attributes: props, className, handlers }) =>
        render(
          React.createElement(Dialog, {
            ...props,
            className,
            ...handlers,
          } as React.ComponentProps<typeof Dialog>)
        ),
      { metadata: COMPONENT_METADATA.dialog, attributes }
    );

    expect(attributes.map((attribute) => attribute.name)).toContain('did-ssr');
    expect(violations).toEqual([]);
    expect(customElements.get('wa-dialog')).toBeUndefined();
  });
});

interface CemAttribute {
  name?: string;
  type?: { text?: string };
}

/**
 * Every attribute on wa-dialog in the pinned Free package CEM, including
 * inherited ones such as did-ssr. Boolean props are probed as true; the
 * harness also remounts them as false. Other attributes get a sentinel
 * string so a hardcoded value cannot pass.
 *
 * The manifest comes from resolveCem scoped to this repository and the free
 * tier (ADR 0003), so a local Pro install cannot change what CI compares.
 * Issue #105 moves these names into COMPONENT_METADATA.
 */
async function dialogAttributesFromFreeCem(): Promise<
  ReactTemplateProbe['attributes']
> {
  const resolution = await resolveCem(REPO_ROOT, { tier: 'free' });
  if (!resolution.path) {
    throw new Error('Free Custom Elements Manifest not found under the repo');
  }
  const cem = (await fs.readJson(resolution.path)) as {
    modules?: Array<{
      declarations?: Array<{ tagName?: string; attributes?: CemAttribute[] }>;
    }>;
  };

  const attributes = cem.modules
    ?.flatMap((mod) => mod.declarations ?? [])
    .find((declaration) => declaration.tagName === 'wa-dialog')?.attributes;

  if (!attributes || attributes.length === 0) {
    throw new Error('wa-dialog attributes missing from the Free CEM');
  }

  return attributes.flatMap((attribute) => {
    if (!attribute.name) return [];
    const value =
      attribute.type?.text === 'boolean' ? true : `probe-${attribute.name}`;
    return [{ name: attribute.name, value }];
  });
}

function LeakyShow(props: {
  className?: string;
  onShow?: (event: Event) => void;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onShow = props.onShow;
    const handler = (event: Event) => {
      onShow?.(event);
    };
    el.addEventListener('wa-show', handler);
  }, [props.onShow]);
  return React.createElement('wa-dialog', { ref, class: props.className });
}
