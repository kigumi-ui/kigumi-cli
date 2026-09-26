/**
 * jsdom function harness for one committed React Template (issue #74).
 *
 * Renders through the caller-supplied mount, then compares the host element
 * to committed component metadata. Violation strings are the observable
 * result. Web Awesome is not imported here; the test stubs that package.
 */

import { stripWaPrefix, toPascalCase } from '../../src/utils/naming.js';
import type { ComponentMetadata } from '../../src/utils/metadata-types.js';

export interface MountedTemplate {
  container: HTMLElement;
  unmount: () => void;
  /**
   * The Template's exposed ref handle, e.g. from `useImperativeHandle`.
   * Absent when the probe isn't proving public CEM methods.
   */
  refHandle?: { current: Record<string, unknown> | null };
}

export interface ReactTemplateProbe {
  metadata: Pick<ComponentMetadata, 'tagName' | 'events'> &
    Partial<Pick<ComponentMetadata, 'methods'>>;
  attributes: readonly { name: string; value: string | boolean }[];
  className: string;
  mount: (input: {
    attributes: Record<string, string | boolean>;
    className: string;
    handlers: Record<string, (event: Event) => void>;
  }) => MountedTemplate;
}

/** React callback prop for a CEM event name, via the naming helpers. */
function reactCallbackName(eventName: string): string {
  return `on${toPascalCase(stripWaPrefix(eventName))}`;
}

export async function proveReactTemplate(
  probe: ReactTemplateProbe
): Promise<readonly string[]> {
  const handlers: Record<string, (event: Event) => void> = {};
  const calls = new Map<string, number>();
  const received = new Map<string, unknown>();
  for (const event of probe.metadata.events) {
    calls.set(event.name, 0);
    handlers[reactCallbackName(event.name)] = (argument: unknown) => {
      calls.set(event.name, (calls.get(event.name) ?? 0) + 1);
      received.set(event.name, argument);
    };
  }

  const { host, unmount, refHandle } = mountHost(
    probe,
    probe.attributes,
    handlers
  );
  if (!host) {
    unmount();
    return [missingHost(probe)];
  }

  const violations: string[] = [];

  violations.push(...proveMethods(probe, host, refHandle));

  for (const attribute of probe.attributes) {
    if (!attributeReflected(host, attribute.name, attribute.value)) {
      violations.push(`attribute ${attribute.name} was not forwarded`);
    }
  }

  const classAttr = host.getAttribute('class') ?? '';
  const classes = classAttr.split(/\s+/).filter((token) => token.length > 0);
  if (!classes.includes(probe.className)) {
    violations.push(
      `className ${probe.className} was not forwarded to the host class`
    );
  }

  const firedOnce = new Set<string>();
  for (const event of probe.metadata.events) {
    const dispatched = new CustomEvent(event.name);
    host.dispatchEvent(dispatched);
    if ((calls.get(event.name) ?? 0) === 1) {
      firedOnce.add(event.name);
      if (received.get(event.name) !== dispatched) {
        violations.push(
          `${reactCallbackName(event.name)} did not receive the dispatched ${event.name} event`
        );
      }
    } else {
      violations.push(
        `dispatching ${event.name} did not invoke ${reactCallbackName(event.name)}`
      );
    }
  }

  unmount();

  for (const event of probe.metadata.events) {
    if (!firedOnce.has(event.name)) continue;
    host.dispatchEvent(new CustomEvent(event.name));
    if ((calls.get(event.name) ?? 0) !== 1) {
      violations.push(`listener for ${event.name} was not removed`);
    }
  }

  violations.push(...booleansThatStickWhenFalse(probe));

  await yieldOneMacrotask();
  if (customElements.get(probe.metadata.tagName)) {
    violations.push(`Web Awesome registered ${probe.metadata.tagName}`);
  }

  return violations;
}

/** Mount the Template and find its host element, if it rendered one. */
function mountHost(
  probe: ReactTemplateProbe,
  attributes: ReactTemplateProbe['attributes'],
  handlers: Record<string, (event: Event) => void>
): {
  host: Element | null;
  unmount: () => void;
  refHandle?: MountedTemplate['refHandle'];
} {
  const mounted = probe.mount({
    attributes: attributeRecord(attributes),
    className: probe.className,
    handlers,
  });
  return {
    host: mounted.container.querySelector(probe.metadata.tagName),
    unmount: mounted.unmount,
    refHandle: mounted.refHandle,
  };
}

/**
 * Each public CEM method must be reachable by name on the exposed ref and
 * reach the real host element: stub the method on the host, call it via the
 * ref, and require the stub to have been invoked exactly once.
 */
function proveMethods(
  probe: ReactTemplateProbe,
  host: Element,
  refHandle: MountedTemplate['refHandle']
): string[] {
  const methods = probe.metadata.methods ?? [];
  if (methods.length === 0) return [];

  const violations: string[] = [];
  const handle = refHandle?.current;
  if (!handle) {
    return methods.map(
      (method) => `ref does not expose a method named ${method.name}`
    );
  }

  for (const method of methods) {
    const member = handle[method.name];
    if (typeof member !== 'function') {
      violations.push(`ref does not expose a method named ${method.name}`);
      continue;
    }

    let calls = 0;
    const original = (host as unknown as Record<string, unknown>)[method.name];
    (host as unknown as Record<string, unknown>)[method.name] = (
      ...args: unknown[]
    ) => {
      calls += 1;
      return args;
    };

    try {
      (member as (...args: unknown[]) => unknown).call(handle);
    } finally {
      (host as unknown as Record<string, unknown>)[method.name] = original;
    }

    if (calls !== 1) {
      violations.push(
        `calling ${method.name} on the ref did not invoke the host's ${method.name}`
      );
    }
  }

  return violations;
}

function missingHost(probe: ReactTemplateProbe): string {
  return `host tag ${probe.metadata.tagName} is missing`;
}

function attributeReflected(
  host: Element,
  name: string,
  value: string | boolean
): boolean {
  if (typeof value === 'boolean') {
    return value ? host.hasAttribute(name) : !host.hasAttribute(name);
  }
  return host.getAttribute(name) === value;
}

function attributeRecord(
  attributes: ReactTemplateProbe['attributes']
): Record<string, string | boolean> {
  const record: Record<string, string | boolean> = {};
  for (const attribute of attributes) {
    record[attribute.name] = attribute.value;
  }
  return record;
}

/**
 * A host that always emits a boolean attribute still passes a presence check.
 * Passing the prop as false must remove it.
 */
function booleansThatStickWhenFalse(probe: ReactTemplateProbe): string[] {
  const booleansOn = probe.attributes.filter(
    (attribute) => attribute.value === true
  );
  if (booleansOn.length === 0) return [];

  const booleansOff = probe.attributes.map((attribute) =>
    attribute.value === true ? { ...attribute, value: false } : attribute
  );
  const { host, unmount } = mountHost(probe, booleansOff, {});
  const violations: string[] = [];
  if (!host) {
    violations.push(missingHost(probe));
  } else {
    for (const attribute of booleansOn) {
      if (host.hasAttribute(attribute.name)) {
        violations.push(
          `attribute ${attribute.name} stayed on the host when the prop was false`
        );
      }
    }
  }
  unmount();
  return violations;
}

/** One macrotask, so a dynamic import started in useEffect can finish. */
async function yieldOneMacrotask(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
