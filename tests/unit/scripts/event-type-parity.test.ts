import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

/**
 * The DOM interfaces shipped Templates type native events with. Deliberately
 * a separate, committed list rather than an import of the resolver's
 * `DOM_EVENT_INTERFACES` / `NATIVE_EVENT_TYPES`: a test that read those would
 * accept whatever the resolver accepts. A new native type must be added here
 * by hand.
 */
const DOM_EVENT_TYPES = new Set(['Event', 'FocusEvent', 'InputEvent']);

/** What a listener passes on for `type`: no cast when it is already `Event`. */
function expectedArgument(type: string): string {
  return type === 'Event' ? 'e' : `e as ${type}`;
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The React prop an event feeds, found through the generated listener that
 * subscribes to it, never by deriving the name: a test that computed the name
 * with the generator's own helper could not catch a bug in that helper.
 */
function reactListener(
  source: string,
  eventName: string
): { prop: string; argument: string } | null {
  const subscribe = new RegExp(
    `el\\.addEventListener\\('${escape(eventName)}', (\\w+)\\);`
  ).exec(source);
  if (!subscribe) return null;
  const handler = new RegExp(
    `const ${subscribe[1]} = \\(e: Event\\) => \\{\\s*if \\((\\w+)\\) \\1\\((e(?: as \\w+)?)\\);`
  ).exec(source);
  return handler ? { prop: handler[1], argument: handler[2] } : null;
}

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

describe('React handler names', () => {
  // Hard-coded, so the name derivation is checked against an independent
  // oracle rather than against itself.
  it.each([
    ['wa-dialog', 'wa-after-hide', 'onAfterHide'],
    ['wa-dialog', 'wa-show', 'onShow'],
    ['wa-input', 'blur', 'onBlur'],
    ['wa-input', 'wa-invalid', 'onInvalid'],
    ['wa-tree', 'wa-selection-change', 'onSelectionChange'],
    ['wa-video', 'loadedmetadata', 'onLoadedmetadata'],
  ])('%s %s feeds %s', (tagName, eventName, prop) => {
    const component = Object.values(getAllComponents()).find(
      (c) => c.tagName === tagName
    );
    expect(component, tagName).toBeDefined();
    const react = generateReactTypescriptTemplate(component!);
    expect(reactListener(react, eventName)?.prop).toBe(prop);
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
        const listened = reactListener(react, event.name);
        expect(listened, `React listener ${event.name}`).not.toBeNull();
        expect(listened!.argument, `React argument ${event.name}`).toBe(
          expectedArgument(type)
        );
        expect(react, `React ${event.name}`).toContain(
          `${listened!.prop}?: (event: ${type}) => void;`
        );
        expect(vue, `Vue ${event.name}`).toContain(
          `'${event.name}': [event: ${type}];`
        );
        expect(vue, `Vue argument ${event.name}`).toContain(
          `emit('${event.name}', ${expectedArgument(type)})`
        );
        // Find the @Output() this event feeds through the listener that
        // subscribes to it, then check that output's emitter type.
        const listener = new RegExp(
          `const (\\w+) = \\(e: Event\\) =>\\s*this\\.(\\w+)\\.emit\\(${escape(expectedArgument(type))}\\);\\n\\s*el\\.addEventListener\\('${event.name}', \\1\\);`
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

describe('hand-maintained .jsx handler JSDoc', () => {
  // `.jsx` Templates are not generated, and validate:generated-fresh's
  // Check C compares their event names with the `.tsx`, not their types, so
  // a JSDoc handler type can keep a retired annotation unnoticed.
  const reactDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../templates/react'
  );
  const jsdocHandler =
    /@property \{\(event: (?:import\('@awesome\.me\/webawesome\/dist\/events\/([\w-]+)\.js'\)\.)?(\w+)\) => void\} \[(on\w+)\]/g;

  const annotated = fs
    .readdirSync(reactDir)
    .map((name) => ({ name, jsx: path.join(reactDir, name, `${name}.jsx`) }))
    .filter(({ jsx }) => fs.existsSync(jsx))
    .flatMap(({ name, jsx }) =>
      [...fs.readFileSync(jsx, 'utf8').matchAll(jsdocHandler)].map((m) => ({
        name,
        module: m[1],
        type: m[2],
        prop: m[3],
      }))
    );

  it('finds annotated handlers to check', () => {
    expect(annotated.length).toBeGreaterThan(0);
  });

  it.each(annotated.map((a) => [`${a.name} ${a.prop}`, a] as const))(
    '%s is typed like the .tsx',
    (_label, { name, module, type, prop }) => {
      const tsx = fs.readFileSync(
        path.join(reactDir, name, `${name}.tsx`),
        'utf8'
      );
      expect(tsx).toContain(`${prop}?: (event: ${type}) => void;`);
      if (module) {
        expect(tsx).toMatch(
          new RegExp(
            `import type \\{[^}]*\\b${type}\\b[^}]*\\} from '@awesome\\.me/webawesome/dist/events/${module}\\.js';`
          )
        );
      }
    }
  );
});
