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
}

export interface ReactTemplateProbe {
  metadata: Pick<ComponentMetadata, 'tagName' | 'events'>;
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
  for (const event of probe.metadata.events) {
    calls.set(event.name, 0);
    handlers[reactCallbackName(event.name)] = () => {
      calls.set(event.name, (calls.get(event.name) ?? 0) + 1);
    };
  }

  const attributes: Record<string, string | boolean> = {};
  for (const attribute of probe.attributes) {
    attributes[attribute.name] = attribute.value;
  }

  const mounted = probe.mount({
    attributes,
    className: probe.className,
    handlers,
  });

  const host = mounted.container.querySelector(probe.metadata.tagName);
  if (!host) {
    mounted.unmount();
    return [`host tag ${probe.metadata.tagName} is missing`];
  }

  const violations: string[] = [];

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
    host.dispatchEvent(new CustomEvent(event.name));
    if ((calls.get(event.name) ?? 0) === 1) {
      firedOnce.add(event.name);
    } else {
      violations.push(
        `dispatching ${event.name} did not invoke ${reactCallbackName(event.name)}`
      );
    }
  }

  const hostElement = host;
  mounted.unmount();

  for (const event of probe.metadata.events) {
    if (!firedOnce.has(event.name)) continue;
    hostElement.dispatchEvent(new CustomEvent(event.name));
    if ((calls.get(event.name) ?? 0) !== 1) {
      violations.push(`listener for ${event.name} was not removed`);
    }
  }

  await flushMountImports();
  if (customElements.get(probe.metadata.tagName)) {
    violations.push(`Web Awesome registered ${probe.metadata.tagName}`);
  }

  return violations;
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

async function flushMountImports(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
