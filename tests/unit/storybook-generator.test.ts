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
