/**
 * Storybook Generator Tests
 *
 * Tests for scripts/storybook/story-data.ts - Story data pipeline utilities
 */

import { describe, it, expect } from 'vitest';
import {
  simplifyReactEventName,
  eventNameToAction,
  buildStoryData,
  buildAllStoryData,
  argTypeDefaultSummary,
  parseStory,
  sameDefault,
} from '../../scripts/storybook/story-data.js';

describe('storybook story-data pipeline', () => {
  describe('simplifyReactEventName', () => {
    it('should strip onWa prefix', () => {
      expect(simplifyReactEventName('onWaShow')).toBe('onShow');
      expect(simplifyReactEventName('onWaAfterShow')).toBe('onAfterShow');
      expect(simplifyReactEventName('onWaHide')).toBe('onHide');
      expect(simplifyReactEventName('onWaAfterHide')).toBe('onAfterHide');
      expect(simplifyReactEventName('onWaTabShow')).toBe('onTabShow');
      expect(simplifyReactEventName('onWaTabHide')).toBe('onTabHide');
      expect(simplifyReactEventName('onWaSelectionChange')).toBe(
        'onSelectionChange'
      );
      expect(simplifyReactEventName('onWaFinish')).toBe('onFinish');
      expect(simplifyReactEventName('onWaLoad')).toBe('onLoad');
      expect(simplifyReactEventName('onWaError')).toBe('onError');
      expect(simplifyReactEventName('onWaInvalid')).toBe('onInvalid');
    });

    it('should keep non-Wa events unchanged', () => {
      expect(simplifyReactEventName('onBlur')).toBe('onBlur');
      expect(simplifyReactEventName('onFocus')).toBe('onFocus');
      expect(simplifyReactEventName('onChange')).toBe('onChange');
      expect(simplifyReactEventName('onInput')).toBe('onInput');
    });
  });

  describe('eventNameToAction', () => {
    it('should convert simplified event names to action strings', () => {
      expect(eventNameToAction('onShow')).toBe('show');
      expect(eventNameToAction('onAfterShow')).toBe('after-show');
      expect(eventNameToAction('onHide')).toBe('hide');
      expect(eventNameToAction('onAfterHide')).toBe('after-hide');
      expect(eventNameToAction('onTabShow')).toBe('tab-show');
      expect(eventNameToAction('onTabHide')).toBe('tab-hide');
      expect(eventNameToAction('onSelectionChange')).toBe('selection-change');
    });

    it('should handle simple events', () => {
      expect(eventNameToAction('onBlur')).toBe('blur');
      expect(eventNameToAction('onFocus')).toBe('focus');
      expect(eventNameToAction('onChange')).toBe('change');
      expect(eventNameToAction('onInput')).toBe('input');
    });
  });

  describe('buildStoryData', () => {
    it('should return null for unknown components', () => {
      expect(buildStoryData('nonexistent')).toBeNull();
    });

    it('should build correct data for Button', () => {
      const data = buildStoryData('button');
      expect(data).not.toBeNull();
      expect(data!.componentName).toBe('Button');
      expect(data!.componentKey).toBe('button');
      expect(data!.title).toBe('Components/Button');

      // Props from registry
      expect(data!.argTypes.variant).toBeDefined();
      expect(data!.argTypes.variant.control).toBe('select');
      expect(data!.argTypes.variant.options).toContain('brand');

      expect(data!.argTypes.size).toBeDefined();
      expect(data!.argTypes.pill).toBeDefined();
      expect(data!.argTypes.pill.control).toBe('boolean');

      // Events from metadata (simplified names)
      expect(data!.argTypes.onBlur).toBeDefined();
      expect(data!.argTypes.onBlur.action).toBe('blur');
      expect(data!.argTypes.onBlur.table?.category).toBe('Events');

      expect(data!.argTypes.onFocus).toBeDefined();
      expect(data!.argTypes.onInvalid).toBeDefined();

      // Should NOT have onWa* names
      expect(data!.argTypes.onWaInvalid).toBeUndefined();

      // Children from overrides
      expect(data!.argTypes.children).toBeDefined();
      expect(data!.args.children).toBe("'Button'");

      // Event fn() args
      expect(data!.eventPropNames).toContain('onBlur');
      expect(data!.eventPropNames).toContain('onFocus');
      expect(data!.eventPropNames).toContain('onInvalid');
    });

    it('should build correct data for Dialog with hidden props', () => {
      const data = buildStoryData('dialog');
      expect(data).not.toBeNull();

      // open should be hidden
      expect(data!.argTypes.open.table?.disable).toBe(true);

      // Events should use simplified names
      expect(data!.argTypes.onShow).toBeDefined();
      expect(data!.argTypes.onAfterShow).toBeDefined();
      expect(data!.argTypes.onHide).toBeDefined();
      expect(data!.argTypes.onAfterHide).toBeDefined();

      // Should NOT have onWa* names
      expect(data!.argTypes.onWaShow).toBeUndefined();
      expect(data!.argTypes.onWaHide).toBeUndefined();

      // Slots are NOT in argTypes (Storybook Meta<typeof X> rejects them)
      expect(data!.argTypes['slot:label']).toBeUndefined();
      expect(data!.argTypes['slot:footer']).toBeUndefined();
      expect(data!.argTypes['slot:header-actions']).toBeUndefined();
    });

    it('should build correct data for TabGroup', () => {
      const data = buildStoryData('tab-group');
      expect(data).not.toBeNull();
      expect(data!.title).toBe('Components/Tab Group');

      // Events should be onTabShow not onWaTabShow
      expect(data!.argTypes.onTabShow).toBeDefined();
      expect(data!.argTypes.onTabHide).toBeDefined();
      expect(data!.argTypes.onWaTabShow).toBeUndefined();
    });

    it('should include description from registry', () => {
      const data = buildStoryData('button');
      expect(data!.description).toBe(
        'Buttons represent actions that are available to the user'
      );
    });
  });

  describe('buildAllStoryData', () => {
    it('should build data for all registry components', () => {
      const all = buildAllStoryData();
      expect(all.size).toBeGreaterThanOrEqual(60);

      // Spot check a few
      expect(all.has('button')).toBe(true);
      expect(all.has('dialog')).toBe(true);
      expect(all.has('input')).toBe(true);
      expect(all.has('tab-group')).toBe(true);
    });

    it('should have no onWa* event names in any component', () => {
      const all = buildAllStoryData();
      for (const [_key, data] of all) {
        for (const argName of Object.keys(data.argTypes)) {
          expect(argName).not.toMatch(/^onWa/);
        }
      }
    });
  });
});

describe('story argType default summaries (issue #152)', () => {
  const story = parseStory(`
const meta = {
  args: { size: 'large' },
  argTypes: {
    appearance: {
      control: 'select',
      options: ['accent', 'filled'],
      table: { defaultValue: { summary: 'accent' } },
    },
    'with-tooltip': {
      control: 'boolean',
      table: {
        category: 'Behaviour',
        defaultValue: { summary: "false" },
      },
    },
    fill: {
      control: 'text',
      table: { category: 'Deprecated', defaultValue: { summary: "''" } },
    },
    label: { control: 'text', description: 'Has { braces } in prose' },
    size: {
      control: 'select',
    },
  },
} satisfies Meta<typeof Widget>;
`);

  it('reads the summary of each argType, however it is quoted and nested', () => {
    expect(argTypeDefaultSummary(story, 'appearance')).toEqual({
      kind: 'summary',
      summary: 'accent',
    });
    expect(argTypeDefaultSummary(story, 'with-tooltip')).toEqual({
      kind: 'summary',
      summary: 'false',
    });
    expect(argTypeDefaultSummary(story, 'fill')).toEqual({
      kind: 'summary',
      summary: "''",
    });
  });

  it('tells an argType without a summary from a missing one', () => {
    expect(argTypeDefaultSummary(story, 'label')).toEqual({
      kind: 'no-summary',
    });
    expect(argTypeDefaultSummary(story, 'size')).toEqual({
      kind: 'no-summary',
    });
    expect(argTypeDefaultSummary(story, 'variant')).toEqual({
      kind: 'missing',
    });
  });

  it('reads the argTypes block, not a same-named key in args', () => {
    // `args.size` comes first in the file; its value is not a summary.
    expect(argTypeDefaultSummary(story, 'size')).toEqual({
      kind: 'no-summary',
    });
  });

  it('reads past quotes and braces in comments', () => {
    // A hand-rolled brace scanner read the apostrophe as an opening quote,
    // lost its place, and reported every argType of the file as missing.
    const commented = parseStory(`
const meta = {
  argTypes: {
    // the element's own default applies when unset
    appearance: {
      /* it's { here */
      table: { defaultValue: { summary: 'accent' } }, // Kigumi's
    },
    size: { table: { defaultValue: { summary: \`m\` } } },
  },
} satisfies Meta<typeof Widget>;
`);

    expect(argTypeDefaultSummary(commented, 'appearance')).toEqual({
      kind: 'summary',
      summary: 'accent',
    });
    expect(argTypeDefaultSummary(commented, 'size')).toEqual({
      kind: 'summary',
      summary: 'm',
    });
  });

  it.each([
    ['no meta', `const config = { argTypes: {} };`, /declares no `const meta`/],
    [
      'argTypes held in a constant',
      `const meta = { argTypes: shared };`,
      /`meta\.argTypes` is not an object literal/,
    ],
    [
      'a spread that may set the argType',
      `const meta = { argTypes: { ...shared, label: {} } };`,
      /`meta\.argTypes` spreads another object/,
    ],
    [
      'an argType held in a constant',
      `const meta = { argTypes: { size: sizeArgType } };`,
      /`meta\.argTypes\.size` is not an object literal/,
    ],
    [
      'a computed summary',
      `const meta = { argTypes: { size: { table: { defaultValue: { summary: String(m) } } } } };`,
      /`meta\.argTypes\.size\.table\.defaultValue\.summary` is not a string literal/,
    ],
  ])('reads %s as unreadable, never as missing', (_case, source, reason) => {
    const found = argTypeDefaultSummary(parseStory(source), 'size');

    expect(found.kind).toBe('unreadable');
    expect(found.kind === 'unreadable' ? found.reason : '').toMatch(reason);
  });

  it('reads a key the literal sets after a spread, as the runtime does', () => {
    const overridden = parseStory(
      `const meta = { argTypes: { ...shared, size: { table: { defaultValue: { summary: 'm' } } } } };`
    );

    expect(argTypeDefaultSummary(overridden, 'size')).toEqual({
      kind: 'summary',
      summary: 'm',
    });
  });

  it('compares a summary to a registry default by the value both name', () => {
    expect(sameDefault('accent', 'accent')).toBe(true);
    expect(sameDefault("'accent'", 'accent')).toBe(true);
    expect(sameDefault("''", "''")).toBe(true);
    expect(sameDefault(null, undefined)).toBe(true);
    expect(sameDefault(null, "''")).toBe(true);
    expect(sameDefault('filled', 'accent')).toBe(false);
    expect(sameDefault('medium', undefined)).toBe(false);
    expect(sameDefault(null, 'm')).toBe(false);
  });
});
