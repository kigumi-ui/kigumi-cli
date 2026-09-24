/**
 * Function harness tracer for one committed React Template (issue #74).
 *
 * Seam: proveReactTemplate mounts a Template and reports CEM contract
 * violations. The oracle is committed component metadata plus the naming
 * helpers (stripWaPrefix / toPascalCase), not generator-emitted tests and
 * not metadata.reactName.
 *
 * Web Awesome's dialog module is stubbed at the package boundary so the
 * proof does not load the component runtime and does not need a Pro token.
 */
// @vitest-environment jsdom

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

describe('proveReactTemplate', () => {
  it('reports a missing host tag', async () => {
    const violations = await proveReactTemplate({
      metadata: { tagName: 'wa-dialog', events: [] },
      attributes: [],
      className: 'probe-class',
      mount: () => render(React.createElement('div')),
    });

    expect(violations).toContain('host tag wa-dialog is missing');
  });

  it('reports a CEM attribute that never reaches the host', async () => {
    const violations = await proveReactTemplate({
      metadata: { tagName: 'wa-dialog', events: [] },
      attributes: [{ name: 'label', value: 'Probe label' }],
      className: 'probe-class',
      mount: ({ className }) =>
        render(React.createElement('wa-dialog', { class: className })),
    });

    expect(violations).toEqual(['attribute label was not forwarded']);
  });

  it('reports a CEM listener that does not invoke the naming-helper callback', async () => {
    const violations = await proveReactTemplate({
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
      attributes: [],
      className: 'probe-class',
      mount: ({ className }) =>
        render(React.createElement('wa-dialog', { class: className })),
    });

    expect(violations).toEqual([
      'dispatching wa-after-show did not invoke onAfterShow',
    ]);
  });

  it('reports a listener that survives unmount', async () => {
    const violations = await proveReactTemplate({
      metadata: {
        tagName: 'wa-dialog',
        events: [{ name: 'wa-show', eventType: 'WaShowEvent' }],
      },
      attributes: [],
      className: 'probe-class',
      mount: ({ className, handlers }) =>
        render(React.createElement(LeakyShow, { className, ...handlers })),
    });

    expect(violations).toContain('listener for wa-show was not removed');
  });

  it('reports className that does not land on the host class', async () => {
    const violations = await proveReactTemplate({
      metadata: { tagName: 'wa-dialog', events: [] },
      attributes: [],
      className: 'probe-class',
      mount: () => render(React.createElement('wa-dialog')),
    });

    expect(violations).toContain(
      'className probe-class was not forwarded to the host class'
    );
  });

  it('reports when rendering registers the Web Awesome element', async () => {
    const violations = await proveReactTemplate({
      metadata: { tagName: 'wa-probe', events: [] },
      attributes: [],
      className: 'probe-class',
      mount: ({ className }) => {
        if (!customElements.get('wa-probe')) {
          customElements.define('wa-probe', class extends HTMLElement {});
        }
        return render(React.createElement('wa-probe', { class: className }));
      },
    });

    expect(violations).toContain('Web Awesome registered wa-probe');
  });

  it('accepts the committed Dialog template against dialog metadata', async () => {
    const violations = await proveReactTemplate({
      metadata: COMPONENT_METADATA.dialog,
      attributes: DIALOG_CEM_ATTRIBUTES,
      className: 'probe-class',
      mount: ({ attributes, className, handlers }) =>
        render(
          React.createElement(Dialog, {
            ...attributes,
            className,
            ...handlers,
          } as React.ComponentProps<typeof Dialog>)
        ),
    });

    expect(violations).toEqual([]);
    expect(customElements.get('wa-dialog')).toBeUndefined();
  });
});

/**
 * wa-dialog attributes from the Free package CEM, except `did-ssr`.
 * That flag is an internal SSR marker, not a prop the adapter exposes.
 * Names are literals so a registry or reactName drift cannot bless them.
 */
const DIALOG_CEM_ATTRIBUTES: ReactTemplateProbe['attributes'] = [
  { name: 'open', value: true },
  { name: 'label', value: 'Probe label' },
  { name: 'without-header', value: true },
  { name: 'light-dismiss', value: true },
  { name: 'with-footer', value: true },
  { name: 'dir', value: 'rtl' },
  { name: 'lang', value: 'en' },
];

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
