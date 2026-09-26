/**
 * jsdom function harness for one committed React Template (issue #74).
 *
 * Renders through the caller-supplied mount, then compares the host element
 * to committed component metadata. The returned violations are the observable
 * result; `proved` reports what the run actually exercised, so a caller can
 * reject a proof that had nothing to check. Web Awesome is not imported here;
 * the caller stubs that package.
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
  metadata: Pick<ComponentMetadata, 'tagName' | 'events' | 'methods'>;
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

/**
 * Turn committed CEM attributes into probe values: boolean attributes are
 * probed as true (the harness also remounts them as false), everything else
 * — string-typed or untyped, e.g. did-ssr — gets a sentinel string so a
 * hardcoded value in the Template cannot pass.
 */
export function probeAttributes(
  attributes: ComponentMetadata['attributes']
): ReactTemplateProbe['attributes'] {
  return attributes.map((attribute) => ({
    name: attribute.name,
    value: attribute.type === 'boolean' ? true : `probe-${attribute.name}`,
  }));
}

/**
 * What the run actually exercised, so a caller can tell a clean proof from a
 * proof that had nothing to check (ADR 0003: "did it pass" and "did it run"
 * are separate fields). Counts are of CEM members reached, not assertions.
 */
export interface ProofCoverage {
  attributes: number;
  events: number;
  methods: number;
}

export interface ReactTemplateProof {
  violations: readonly string[];
  proved: ProofCoverage;
}

export async function proveReactTemplate(
  probe: ReactTemplateProbe
): Promise<ReactTemplateProof> {
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
  const proved: ProofCoverage = { attributes: 0, events: 0, methods: 0 };

  if (!host) {
    unmount();
    return { violations: [missingHost(probe)], proved };
  }

  const violations: string[] = [];

  violations.push(...proveMethods(probe, host, refHandle, proved));

  for (const attribute of probe.attributes) {
    proved.attributes += 1;
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
    proved.events += 1;
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

  return { violations, proved };
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
 * ref, and require the host stub to have been reached at least once.
 *
 * "At least once" rather than "exactly once" because delegating twice, or
 * through a wrapper that retries, still satisfies "the ref method reaches the
 * host". Zero is the only failure this can express.
 */
function proveMethods(
  probe: ReactTemplateProbe,
  host: Element,
  refHandle: MountedTemplate['refHandle'],
  proved: ProofCoverage
): string[] {
  const methods = probe.metadata.methods;
  if (methods.length === 0) return [];

  const violations: string[] = [];
  const handle = refHandle?.current;
  if (!handle) {
    proved.methods += methods.length;
    return methods.map(
      (method) => `ref does not expose a method named ${method.name}`
    );
  }

  for (const method of methods) {
    proved.methods += 1;
    const member = handle[method.name];
    if (typeof member !== 'function') {
      violations.push(`ref does not expose a method named ${method.name}`);
      continue;
    }

    let calls = 0;
    const record = host as unknown as Record<string, unknown>;
    const owned = Object.prototype.hasOwnProperty.call(record, method.name);
    const original = record[method.name];
    record[method.name] = (...args: unknown[]) => {
      calls += 1;
      return args;
    };

    let thrown: { error: unknown } | null = null;
    try {
      (member as (...args: unknown[]) => unknown).call(handle);
    } catch (error) {
      // Boxed, so a method that throws `undefined` still counts as a throw.
      thrown = { error };
    } finally {
      // The stub owns no inherited members, so restoring means deleting
      // whatever the stub added rather than writing `undefined` over it.
      if (owned) record[method.name] = original;
      else delete record[method.name];
    }

    if (thrown) {
      violations.push(
        `calling ${method.name} on the ref threw: ${describeThrown(thrown.error)}`
      );
      continue;
    }

    if (calls === 0) {
      violations.push(
        `calling ${method.name} on the ref did not invoke the host's ${method.name}`
      );
    }
  }

  return violations;
}

function describeThrown(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
