import { describe, it, expect } from 'vitest';
import { mapEventType } from '../../../scripts/generator-utils.js';

/**
 * The event -> handler-type rule, pinned.
 *
 * These assertions are the contract three generators depend on. Before this
 * was one shared function, each generator pattern-matched Web Awesome's
 * `eventName` string ("BlurEvent") independently and they disagreed: blur was
 * FocusEvent in React and CustomEvent in Vue and Angular.
 *
 * See docs/adr/0001-event-types-are-never-inferred-from-names.md.
 */
describe('mapEventType', () => {
  describe('native DOM events take their own interface', () => {
    it.each([
      ['blur', 'FocusEvent'],
      ['focus', 'FocusEvent'],
      ['change', 'Event'],
      ['input', 'InputEvent'],
      ['beforeinput', 'InputEvent'],
      ['load', 'Event'],
      ['error', 'Event'],
    ])('%s -> %s', (eventName, expected) => {
      expect(mapEventType(eventName)).toBe(expected);
    });

    it('does not type blur as CustomEvent, the bug this rule fixes', () => {
      expect(mapEventType('blur')).not.toBe('CustomEvent');
    });
  });

  describe('Web Awesome custom events are CustomEvent', () => {
    it.each(['wa-show', 'wa-after-hide', 'wa-invalid', 'wa-slide-change'])(
      '%s -> CustomEvent',
      (eventName) => {
        expect(mapEventType(eventName)).toBe('CustomEvent');
      }
    );

    it('applies the wa- rule ahead of the native table', () => {
      // A wa- event whose suffix collides with a native name must still be a
      // CustomEvent: the prefix decides, not the tail of the string.
      expect(mapEventType('wa-input')).toBe('CustomEvent');
      expect(mapEventType('wa-change')).toBe('CustomEvent');
    });
  });

  describe('unknown events fall back to CustomEvent', () => {
    it.each(['some-future-event', 'toggle', ''])('%s -> CustomEvent', (n) => {
      expect(mapEventType(n)).toBe('CustomEvent');
    });
  });

  it('never receives a name-shaped type string', () => {
    // "BlurEvent" is Web Awesome's eventName, not a DOM name. If a caller ever
    // passes one of these again, it must not silently resolve to something
    // plausible -- it falls through to CustomEvent, and the parity test below
    // is what catches the mistake.
    expect(mapEventType('BlurEvent')).toBe('CustomEvent');
  });
});
