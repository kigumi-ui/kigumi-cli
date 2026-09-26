/**
 * Framework-neutral jsdom function harness for one committed Template
 * (issue #74 for React, generalised for Vue in issue #76).
 *
 * Renders through the caller-supplied mount, then compares the host element
 * to committed component metadata. The returned violations are the observable
 * result; `proved` reports what the run actually exercised, so a caller can
 * reject a proof that had nothing to check. Web Awesome is not imported here;
 * the caller stubs that package.
 *
 * What differs per framework is the `TemplateAdapter`: how a CEM event name
 * becomes the callback the consumer passes, and what the exposed handle is
 * called in violation messages. Everything else is the same contract, so a
 * generator bug in one adapter cannot hide behind a looser check in another.
 */

import type { ComponentMetadata } from '../../src/utils/metadata-types.js';

export interface MountedTemplate {
  container: HTMLElement;
  unmount: () => void;
  /**
   * The Template's exposed handle: React's `useImperativeHandle` ref, Vue's
   * `defineExpose` proxy. Absent when the probe isn't proving public CEM
   * methods.
   */
  refHandle?: { readonly current: Record<string, unknown> | null };
}

/** The per-framework half of the contract. */
export interface TemplateAdapter {
  /**
   * The callback key a consumer passes for a CEM event, derived via the
   * naming helpers (never from metadata, so metadata cannot bless itself).
   */
  callbackName: (eventName: string) => string;
  /** How violation messages name the exposed handle, e.g. `ref`. */
  handleName: string;
}

export interface TemplateProbe {
  adapter: TemplateAdapter;
  metadata: Pick<ComponentMetadata, 'tagName' | 'events' | 'methods'>;
  attributes: readonly { name: string; value: string | boolean }[];
  className: string;
  mount: (input: {
    attributes: Record<string, string | boolean>;
    className: string;
    handlers: Record<string, (event: Event) => void>;
  }) => MountedTemplate;
}

/**
 * Turn committed CEM attributes into probe values: boolean attributes are
 * probed as true (the harness also remounts them as false), everything else
 * (string-typed or untyped, e.g. did-ssr) gets a sentinel string so a
 * hardcoded value in the Template cannot pass.
 */
export function probeAttributes(
  attributes: ComponentMetadata['attributes']
): TemplateProbe['attributes'] {
  return attributes.map((attribute) => ({
    name: attribute.name,
    value: attribute.type === 'boolean' ? true : `probe-${attribute.name}`,
  }));
}

/**
 * What the run actually proved, so a caller can tell a clean proof from a
 * proof that had nothing to check (ADR 0003: "did it pass" and "did it run"
 * are separate fields). A member counts only once its check has observed the
 * expected host behaviour, so a check that is skipped or never reached leaves
 * the count short of the metadata even when it pushes no violation.
 */
export interface ProofCoverage {
  attributes: number;
  events: number;
  methods: number;
}

export interface TemplateProof {
  violations: readonly string[];
  proved: ProofCoverage;
}

export async function proveTemplate(
  probe: TemplateProbe
): Promise<TemplateProof> {
  const listeners = recordHostListeners(probe.metadata.tagName);
  try {
    return await proveWithListeners(probe, listeners);
  } finally {
    listeners.restore();
  }
}

async function proveWithListeners(
  probe: TemplateProbe,
  listeners: HostListenerLog
): Promise<TemplateProof> {
  const handlers: Record<string, (event: Event) => void> = {};
  const calls = new Map<string, number>();
  const received = new Map<string, unknown>();
  for (const event of probe.metadata.events) {
    calls.set(event.name, 0);
    handlers[probe.adapter.callbackName(event.name)] = (argument: unknown) => {
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
    if (attributeReflected(host, attribute.name, attribute.value)) {
      proved.attributes += 1;
    } else {
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
  const delivered = new Set<string>();
  for (const event of probe.metadata.events) {
    const dispatched = new CustomEvent(event.name);
    host.dispatchEvent(dispatched);
    if ((calls.get(event.name) ?? 0) === 1) {
      firedOnce.add(event.name);
      if (received.get(event.name) === dispatched) {
        delivered.add(event.name);
      } else {
        violations.push(
          `${probe.adapter.callbackName(event.name)} did not receive the dispatched ${event.name} event`
        );
      }
    } else {
      violations.push(
        `dispatching ${event.name} did not invoke ${probe.adapter.callbackName(event.name)}`
      );
    }
  }

  unmount();

  // Two independent signals for a leak. The listener log sees a listener
  // left on the host even when the framework swallows its callback (Vue's
  // emit is a no-op after unmount); the dispatch sees one the log cannot
  // attribute, e.g. registered through a wrapper object.
  const stillRegistered = listeners.live(host);
  for (const event of probe.metadata.events) {
    let leaked = stillRegistered.has(event.name);
    if (firedOnce.has(event.name)) {
      host.dispatchEvent(new CustomEvent(event.name));
      if ((calls.get(event.name) ?? 0) !== 1) leaked = true;
    }
    if (leaked) {
      violations.push(`listener for ${event.name} was not removed`);
    } else if (delivered.has(event.name)) {
      proved.events += 1;
    }
  }

  violations.push(...booleansThatStickWhenFalse(probe));

  await yieldOneMacrotask();
  if (customElements.get(probe.metadata.tagName)) {
    violations.push(`Web Awesome registered ${probe.metadata.tagName}`);
  }

  return { violations, proved };
}

interface HostListenerLog {
  /** Event types with a listener still registered on `host`. */
  live: (host: Element) => Set<string>;
  restore: () => void;
}

/**
 * Record `addEventListener` / `removeEventListener` on elements with the
 * CEM tag, for the duration of one proof. A registration is identified the
 * way the DOM identifies it: type, listener, and capture flag.
 */
function recordHostListeners(tagName: string): HostListenerLog {
  const proto = EventTarget.prototype;
  const add = proto.addEventListener;
  const remove = proto.removeEventListener;
  const registered = new Map<Element, Set<string>>();
  const keys = new WeakMap<object, number>();
  let nextKey = 0;

  function entry(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | EventListenerOptions | undefined
  ): string {
    if (!keys.has(listener)) keys.set(listener, nextKey++);
    const capture =
      typeof options === 'boolean' ? options : Boolean(options?.capture);
    return `${type}\u0000${keys.get(listener)}\u0000${capture}`;
  }

  function isHost(target: EventTarget): target is Element {
    return target instanceof Element && target.localName === tagName;
  }

  proto.addEventListener = function (
    this: EventTarget,
    type,
    listener,
    options
  ) {
    if (listener && isHost(this)) {
      const entries = registered.get(this) ?? new Set<string>();
      entries.add(entry(type, listener, options));
      registered.set(this, entries);
    }
    add.call(this, type, listener, options);
  };
  proto.removeEventListener = function (
    this: EventTarget,
    type,
    listener,
    options
  ) {
    if (listener && isHost(this)) {
      registered.get(this)?.delete(entry(type, listener, options));
    }
    remove.call(this, type, listener, options);
  };

  return {
    live: (host) =>
      new Set(
        [...(registered.get(host) ?? [])].map((key) => key.split('\u0000')[0])
      ),
    restore: () => {
      proto.addEventListener = add;
      proto.removeEventListener = remove;
    },
  };
}

/** Mount the Template and find its host element, if it rendered one. */
function mountHost(
  probe: TemplateProbe,
  attributes: TemplateProbe['attributes'],
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
 * Each public CEM method must be reachable by name on the exposed handle and
 * reach the real host element: stub the method on the host, call it via the
 * handle, and require the host stub to have been reached at least once.
 *
 * "At least once" rather than "exactly once" because delegating twice, or
 * through a wrapper that retries, still satisfies "the handle method reaches the
 * host". Zero is the only failure this can express.
 */
function proveMethods(
  probe: TemplateProbe,
  host: Element,
  refHandle: MountedTemplate['refHandle'],
  proved: ProofCoverage
): string[] {
  const methods = probe.metadata.methods;
  if (methods.length === 0) return [];

  const violations: string[] = [];
  const handle = refHandle?.current;
  if (!handle) {
    return methods.map(
      (method) =>
        `${probe.adapter.handleName} does not expose a method named ${method.name}`
    );
  }

  for (const method of methods) {
    const member = handle[method.name];
    if (typeof member !== 'function') {
      violations.push(
        `${probe.adapter.handleName} does not expose a method named ${method.name}`
      );
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
        `calling ${method.name} on the ${probe.adapter.handleName} threw: ${describeThrown(thrown.error)}`
      );
      continue;
    }

    if (calls === 0) {
      violations.push(
        `calling ${method.name} on the ${probe.adapter.handleName} did not invoke the host's ${method.name}`
      );
    } else {
      proved.methods += 1;
    }
  }

  return violations;
}

function describeThrown(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function missingHost(probe: TemplateProbe): string {
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
  attributes: TemplateProbe['attributes']
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
function booleansThatStickWhenFalse(probe: TemplateProbe): string[] {
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

/** One macrotask, so a dynamic import started on mount can finish. */
async function yieldOneMacrotask(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
