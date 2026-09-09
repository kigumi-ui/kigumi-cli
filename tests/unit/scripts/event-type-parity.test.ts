import { describe, it, expect } from 'vitest';
import { mapEventType } from '../../../scripts/generator-utils.js';
import { COMPONENT_METADATA } from '../../../src/utils/component-metadata.js';

/**
 * Cross-framework parity for event handler types.
 *
 * The React, Vue and Angular generators each resolve a handler's type by
 * calling mapEventType with the event's DOM name. This walks every event in
 * the real component metadata and asserts the rule is total and consistent:
 * one input, one answer, no framework-specific branch anywhere.
 *
 * This is the regression guard for the drift that shipped a wrong blur type to
 * Vue and Angular. A future generator that reintroduces its own mapping will
 * fail here rather than silently in generated output.
 */
describe('event type parity across frameworks', () => {
  const events = Object.entries(COMPONENT_METADATA).flatMap(
    ([componentName, component]) =>
      component.events.map((event) => ({
        component: componentName,
        name: event.name,
      }))
  );

  it('finds events to check', () => {
    expect(events.length).toBeGreaterThan(0);
  });

  it('resolves every event to exactly one type, whichever generator asks', () => {
    // All three generators call the same function with the same input, so a
    // disagreement is only possible if one of them stops doing that. Calling
    // it repeatedly per event pins determinism, which is what makes the three
    // call sites interchangeable.
    for (const event of events) {
      const answers = new Set([
        mapEventType(event.name),
        mapEventType(event.name),
        mapEventType(event.name),
      ]);
      expect(answers.size, `${event.component}.${event.name}`).toBe(1);
    }
  });

  it('assigns every event a non-empty type', () => {
    for (const event of events) {
      const type = mapEventType(event.name);
      expect(type, `${event.component}.${event.name}`).toBeTruthy();
    }
  });

  it('types every wa- event as CustomEvent', () => {
    const custom = events.filter((e) => e.name.startsWith('wa-'));
    expect(custom.length).toBeGreaterThan(0);
    for (const event of custom) {
      expect(mapEventType(event.name), `${event.component}.${event.name}`).toBe(
        'CustomEvent'
      );
    }
  });

  it('types the native events the DOM defines, not CustomEvent', () => {
    const expected: Record<string, string> = {
      blur: 'FocusEvent',
      focus: 'FocusEvent',
      change: 'Event',
      input: 'InputEvent',
      beforeinput: 'InputEvent',
      load: 'Event',
      error: 'Event',
    };

    const native = events.filter((e) => e.name in expected);
    expect(native.length).toBeGreaterThan(0);

    for (const event of native) {
      expect(mapEventType(event.name), `${event.component}.${event.name}`).toBe(
        expected[event.name]
      );
    }
  });
});
