/**
 * Function harness tracer for one committed React Template (issue #74).
 *
 * Seam: proveReactTemplate mounts a Template and reports CEM contract
 * violations. Tag, events, and attributes come from committed component
 * metadata (issue #105 moved attribute names off the pinned Free CEM and
 * onto `COMPONENT_METADATA.dialog`). Callback names come from
 * stripWaPrefix / toPascalCase, not from metadata.reactName.
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
import {
  probeAttributes,
  proveReactTemplate,
} from './react-function-harness.js';
import type { ReactTemplateProbe } from './react-function-harness.js';

const dialogStub = vi.hoisted(() => ({ imported: false }));

vi.mock('@awesome.me/webawesome/dist/components/dialog/dialog.js', () => {
  dialogStub.imported = true;
  return { default: class WaDialogStub {} };
});

afterEach(() => {
  cleanup();
});

const PROBE_CLASS = 'probe-class';

async function prove(
  mount: ReactTemplateProbe['mount'],
  overrides: Partial<Omit<ReactTemplateProbe, 'mount' | 'className'>> = {}
): Promise<readonly string[]> {
  const { violations } = await proveReactTemplate({
    metadata: { tagName: 'wa-dialog', events: [], methods: [] },
    attributes: [],
    className: PROBE_CLASS,
    mount,
    ...overrides,
  });
  return violations;
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
          methods: [],
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

  it('reports a callback that does not receive the dispatched event', async () => {
    const violations = await prove(
      ({ className, handlers }) =>
        render(
          React.createElement(ArgumentlessShow, { className, ...handlers })
        ),
      {
        metadata: {
          tagName: 'wa-dialog',
          methods: [],
          events: [{ name: 'wa-show', eventType: 'WaShowEvent' }],
        },
      }
    );

    expect(violations).toEqual([
      'onShow did not receive the dispatched wa-show event',
    ]);
  });

  it('reports a listener that survives unmount', async () => {
    const violations = await prove(
      ({ className, handlers }) =>
        render(React.createElement(LeakyShow, { className, ...handlers })),
      {
        metadata: {
          tagName: 'wa-dialog',
          methods: [],
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
      { metadata: { tagName: 'wa-probe', events: [], methods: [] } }
    );

    expect(violations).toContain('Web Awesome registered wa-probe');
  });

  it('reports a CEM method the ref never exposes', async () => {
    const violations = await proveMethodsOn(
      { show: undefined },
      [{ name: 'show' }],
      () => undefined
    );

    expect(violations).toEqual(['ref does not expose a method named show']);
  });

  it('reports a ref method that never reaches the host', async () => {
    const violations = await proveMethodsOn(
      { show: () => undefined },
      [{ name: 'show' }],
      () => undefined
    );

    expect(violations).toEqual([
      "calling show on the ref did not invoke the host's show",
    ]);
  });

  it('reports a ref method that throws instead of aborting the proof', async () => {
    const violations = await proveMethodsOn(
      {
        show: () => {
          throw new Error('needs an argument');
        },
      },
      [{ name: 'show' }],
      () => undefined
    );

    expect(violations).toEqual([
      'calling show on the ref threw: needs an argument',
    ]);
  });

  it('reports a ref method that throws undefined', async () => {
    const violations = await proveMethodsOn(
      {
        show: () => {
          throw undefined;
        },
      },
      [{ name: 'show' }],
      () => undefined
    );

    expect(violations).toEqual(['calling show on the ref threw: undefined']);
  });

  it('accepts a ref method that delegates to the host', async () => {
    const violations = await proveMethodsOn(
      { show: null },
      [{ name: 'show' }],
      (host) => {
        host.show?.();
      }
    );

    expect(violations).toEqual([]);
  });

  it('reports every CEM method when the ref exposes no handle at all', async () => {
    const { violations } = await proveReactTemplate({
      metadata: {
        tagName: 'wa-dialog',
        events: [],
        methods: [{ name: 'show' }, { name: 'hide' }],
      },
      attributes: [],
      className: PROBE_CLASS,
      mount: ({ className }) => {
        const view = render(
          React.createElement('wa-dialog', { class: className })
        );
        return { container: view.container, unmount: view.unmount };
      },
    });

    expect(violations).toEqual([
      'ref does not expose a method named show',
      'ref does not expose a method named hide',
    ]);
  });

  it('leaves no stub behind on the host after proving a method', async () => {
    let host: Element | null = null;
    const { violations } = await proveReactTemplate({
      metadata: {
        tagName: 'wa-dialog',
        events: [],
        methods: [{ name: 'show' }],
      },
      attributes: [],
      className: PROBE_CLASS,
      mount: ({ className }) => {
        const view = render(
          React.createElement('wa-dialog', { class: className })
        );
        host = view.container.querySelector('wa-dialog');
        const current: Record<string, unknown> = {
          show: () => {
            (
              host as unknown as Record<string, (() => void) | undefined>
            ).show?.();
          },
        };
        return {
          container: view.container,
          unmount: view.unmount,
          refHandle: { current },
        };
      },
    });

    expect(violations).toEqual([]);
    // Restoring means removing what the harness added, not writing undefined.
    expect(host).not.toBeNull();
    expect(Object.prototype.hasOwnProperty.call(host, 'show')).toBe(false);
  });

  it('accepts the committed Dialog template against dialog metadata', async () => {
    const attributes = probeAttributes(COMPONENT_METADATA.dialog.attributes);
    const violations = await prove(
      ({ attributes: props, className, handlers }) =>
        render(
          // The function seam checks that CEM attributes reach the host.
          // Whether DialogProps declares them is the types seam (ADR 0004).
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
    // Premise: the Template imported the stub. A mock path that stops
    // matching would otherwise load the real module and pass on timing.
    await vi.waitFor(() => {
      expect(dialogStub.imported).toBe(true);
    });
    expect(customElements.get('wa-dialog')).toBeUndefined();
  });
});

/**
 * Drive proveMethods alone: mount a bare host, build a ref handle whose
 * members are `handle` (a `null` member is replaced by `call`, which receives
 * the live host), and return the violations.
 */
async function proveMethodsOn(
  handle: Record<string, unknown>,
  methods: { name: string }[],
  call: (host: Record<string, (() => void) | undefined>) => void
): Promise<readonly string[]> {
  const { violations } = await proveReactTemplate({
    metadata: { tagName: 'wa-dialog', events: [], methods },
    attributes: [],
    className: PROBE_CLASS,
    mount: ({ className }) => {
      const view = render(
        React.createElement('wa-dialog', { class: className })
      );
      const host = view.container.querySelector(
        'wa-dialog'
      ) as unknown as Record<string, (() => void) | undefined>;
      const current: Record<string, unknown> = {};
      for (const [name, member] of Object.entries(handle)) {
        if (member === null) current[name] = () => call(host);
        else if (member !== undefined) current[name] = member;
      }
      return {
        container: view.container,
        unmount: view.unmount,
        refHandle: { current },
      };
    },
  });
  return violations;
}

/** Omits the useEffect cleanup on purpose, so the harness has a leak to report. */
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

/** Calls onShow without the event, so the harness has a lost payload to report. */
function ArgumentlessShow(props: {
  className?: string;
  onShow?: (event?: Event) => void;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onShow = props.onShow;
    const handler = () => {
      onShow?.();
    };
    el.addEventListener('wa-show', handler);
    return () => {
      el.removeEventListener('wa-show', handler);
    };
  }, [props.onShow]);
  return React.createElement('wa-dialog', { ref, class: props.className });
}
