import { describe, it, expect } from 'vitest';
import { COMPONENT_METADATA } from '../../../src/utils/component-metadata.js';
import { getAllComponents } from '../../../src/utils/registry.js';
import { generateReactTypescriptTemplate } from '../../../scripts/generate-react-templates.js';
import { generateVueTypescriptTemplate } from '../../../scripts/generate-vue-templates.js';
import { generateComponentTS } from '../../../scripts/generate-angular-templates.js';

/**
 * Cross-framework parity for event handler types.
 *
 * The type is resolved once, into the metadata, by scripts/event-types.ts.
 * This holds the generated Templates to it: for every event of every
 * registry component, React, Vue and Angular each type the handler with the
 * metadata's `eventType`, and import it when it is a Web Awesome class.
 *
 * This is the regression guard for the drift that shipped a wrong blur type
 * to Vue and Angular. A generator that reintroduces its own mapping will fail
 * here rather than silently in generated output.
 *
 * See docs/adr/0005-event-types-come-from-web-awesome-event-classes.md.
 */

const DOM_EVENT_TYPES = new Set(['Event', 'FocusEvent', 'InputEvent']);

const components = Object.values(getAllComponents())
  .map((component) => ({
    component,
    key: component.tagName.replace(/^wa-/, ''),
  }))
  .filter(({ key }) => (COMPONENT_METADATA[key]?.events.length ?? 0) > 0);

const allEvents = components.flatMap(({ key }) =>
  COMPONENT_METADATA[key].events.map((event) => ({ component: key, event }))
);

describe('resolved event types in the metadata', () => {
  it('finds events to check', () => {
    expect(allEvents.length).toBeGreaterThan(100);
  });

  it('types every wa- event as the Web Awesome class it dispatches', () => {
    const custom = allEvents.filter(({ event }) =>
      event.name.startsWith('wa-')
    );
    expect(custom.length).toBeGreaterThan(0);
    for (const { component, event } of custom) {
      const where = `${component}.${event.name}`;
      expect(event.eventType, where).toMatch(/^Wa[A-Za-z]+Event$/);
      expect(event.eventTypeModule, where).toBeTruthy();
    }
  });

  it('types every native event as a DOM interface, with nothing to import', () => {
    const native = allEvents.filter(
      ({ event }) => !event.name.startsWith('wa-')
    );
    expect(native.length).toBeGreaterThan(0);
    for (const { component, event } of native) {
      const where = `${component}.${event.name}`;
      expect(DOM_EVENT_TYPES.has(event.eventType), where).toBe(true);
      expect(event.eventTypeModule, where).toBeUndefined();
    }
  });

  it('never falls back to CustomEvent, the type no Web Awesome event has', () => {
    for (const { component, event } of allEvents) {
      expect(event.eventType, `${component}.${event.name}`).not.toBe(
        'CustomEvent'
      );
    }
  });

  it('never keeps the manifest eventName for a native event', () => {
    // "BlurEvent" and "ChangeEvent" are pascal-cased names, not interfaces.
    for (const { component, event } of allEvents) {
      if (event.name.startsWith('wa-')) continue;
      expect(event.eventType, `${component}.${event.name}`).not.toMatch(
        /^(Blur|Change|Timeupdate|Load|Error)Event$/
      );
    }
  });
});

describe('event type parity across frameworks', () => {
  it.each(components.map((c) => [c.component.name, c] as const))(
    '%s types each handler with the metadata eventType in all three',
    (_name, { component, key }) => {
      const react = generateReactTypescriptTemplate(component);
      const vue = generateVueTypescriptTemplate(component);
      const angular = generateComponentTS(component, key);
      const events = COMPONENT_METADATA[key].events;

      for (const event of events) {
        const type = event.eventType;
        const reactName = `on${event.name
          .replace(/^wa-/, '')
          .replace(/(^|-)([a-z])/g, (_m, _d, c: string) => c.toUpperCase())}`;

        expect(react, `React ${event.name}`).toContain(
          `${reactName}?: (event: ${type}) => void;`
        );
        expect(vue, `Vue ${event.name}`).toContain(
          `'${event.name}': [event: ${type}];`
        );
        // Find the @Output() this event feeds through the listener that
        // subscribes to it, then check that output's emitter type.
        const listener = new RegExp(
          `const (\\w+) = \\(e: Event\\) => this\\.(\\w+)\\.emit\\(e as ${type}\\);\\n\\s*el\\.addEventListener\\('${event.name}', \\1\\);`
        ).exec(angular);
        expect(listener, `Angular listener ${event.name}`).not.toBeNull();
        expect(angular, `Angular output ${event.name}`).toContain(
          `@Output() ${listener![2]} = new EventEmitter<${type}>();`
        );

        if (event.eventTypeModule) {
          const importLine = `import type { ${type} } from '@awesome.me/webawesome/dist/events/${event.eventTypeModule}.js';`;
          expect(react, `React import ${type}`).toContain(importLine);
          expect(vue, `Vue import ${type}`).toContain(importLine);
          expect(angular, `Angular import ${type}`).toContain(importLine);
        }
      }

      // No handler anywhere is still typed with the old fallback.
      for (const [framework, source] of [
        ['React', react],
        ['Vue', vue],
        ['Angular', angular],
      ] as const) {
        expect(source, framework).not.toMatch(/\bCustomEvent\b/);
      }
    }
  );
});
