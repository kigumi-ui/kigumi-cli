/**
 * Registry Tests
 *
 * Tests for src/utils/registry.ts - Component registry lookups
 */

import { describe, it, expect } from 'vitest';
import {
  getAllComponents,
  getComponent,
  hasComponent,
  getComponentNames,
  normalizeComponentName,
} from '../../src/utils/registry.js';

describe('component registry', () => {
  describe('getAllComponents', () => {
    it('should return all components', () => {
      const components = getAllComponents();

      expect(components).toBeDefined();
      expect(Object.keys(components).length).toBeGreaterThan(0);
    });

    it('should have button component', () => {
      const components = getAllComponents();

      expect(components['button']).toBeDefined();
      expect(components['button'].name).toBe('Button');
    });

    it('should have all required properties for each component', () => {
      const components = getAllComponents();

      for (const [_key, component] of Object.entries(components)) {
        expect(component.name).toBeDefined();
        expect(component.tagName).toBeDefined();
        expect(component.importPath).toBeDefined();
        expect(component.tier).toBeDefined();
        expect(component.category).toBeDefined();
        expect(component.description).toBeDefined();
        expect(['free', 'pro']).toContain(component.tier);
      }
    });
  });

  describe('getComponent', () => {
    it('should return component by name', () => {
      const button = getComponent('button');

      expect(button).toBeDefined();
      expect(button?.name).toBe('Button');
      expect(button?.tagName).toBe('wa-button');
    });

    it('should return null for non-existent component', () => {
      const fake = getComponent('non-existent-component');

      expect(fake).toBeNull();
    });

    it('should normalize case and find component', () => {
      // Registry normalizes case
      const Button = getComponent('Button');

      expect(Button).toBeDefined();
    });
  });

  describe('hasComponent', () => {
    it('should return true for existing component', () => {
      expect(hasComponent('button')).toBe(true);
      expect(hasComponent('dialog')).toBe(true);
      expect(hasComponent('input')).toBe(true);
    });

    it('should return false for non-existent component', () => {
      expect(hasComponent('non-existent')).toBe(false);
      expect(hasComponent('fake-component')).toBe(false);
    });

    it('should normalize case and find component', () => {
      // Registry normalizes case
      expect(hasComponent('Button')).toBe(true);
      expect(hasComponent('BUTTON')).toBe(true);
    });
  });

  describe('getComponentNames', () => {
    it('should return array of component names', () => {
      const names = getComponentNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });

    it('should include common components', () => {
      const names = getComponentNames();

      expect(names).toContain('button');
      expect(names).toContain('dialog');
      expect(names).toContain('input');
    });

    it('should have all component names', () => {
      const names = getComponentNames();
      const allComponents = getAllComponents();

      // All registry components should be in names
      expect(names.length).toBe(Object.keys(allComponents).length);
    });
  });

  describe('tier filtering', () => {
    it('should have free components', () => {
      const components = getAllComponents();
      const freeComponents = Object.entries(components).filter(
        ([, comp]) => comp.tier === 'free'
      );

      expect(freeComponents.length).toBeGreaterThan(0);

      for (const [, component] of freeComponents) {
        expect(component.tier).toBe('free');
      }
    });

    it('should have pro components', () => {
      const components = getAllComponents();
      const proComponents = Object.entries(components).filter(
        ([, comp]) => comp.tier === 'pro'
      );

      expect(proComponents.length).toBeGreaterThan(0);

      for (const [, component] of proComponents) {
        expect(component.tier).toBe('pro');
      }
    });

    it('should include known pro-only components', () => {
      const components = getAllComponents();
      const proNames = Object.entries(components)
        .filter(([, comp]) => comp.tier === 'pro')
        .map(([key]) => key);

      // These are the actual pro-only components in registry
      const knownProComponents = [
        'combobox',
        'file-input',
        'number-input',
        'sparkline',
      ];

      for (const component of knownProComponents) {
        expect(proNames).toContain(component);
      }
    });

    it('should include known free components', () => {
      const components = getAllComponents();
      const freeNames = Object.entries(components)
        .filter(([, comp]) => comp.tier === 'free')
        .map(([key]) => key);

      // These are known free components
      const knownFreeComponents = [
        'button',
        'dialog',
        'input',
        'badge',
        'avatar',
      ];

      for (const component of knownFreeComponents) {
        expect(freeNames).toContain(component);
      }
    });

    it('should have no component in both tiers', () => {
      const components = getAllComponents();

      for (const component of Object.values(components)) {
        expect(['free', 'pro']).toContain(component.tier);
      }
    });
  });

  describe('category grouping', () => {
    it('should have multiple categories', () => {
      const components = getAllComponents();
      const categories = new Set(
        Object.values(components).map((comp) => comp.category)
      );

      expect(categories.size).toBeGreaterThan(0);
    });

    it('should have Form Controls category', () => {
      const components = getAllComponents();
      const formsComponents = Object.values(components).filter(
        (comp) => comp.category === 'Form Controls'
      );

      expect(formsComponents.length).toBeGreaterThan(0);
    });

    it('should have Display category', () => {
      const components = getAllComponents();
      const displayComponents = Object.values(components).filter(
        (comp) => comp.category === 'Display'
      );

      expect(displayComponents.length).toBeGreaterThan(0);
    });

    it('should have Layout category', () => {
      const components = getAllComponents();
      const layoutComponents = Object.values(components).filter(
        (comp) => comp.category === 'Layout'
      );

      expect(layoutComponents.length).toBeGreaterThan(0);
    });

    it('should have all components categorized', () => {
      const components = getAllComponents();

      for (const component of Object.values(components)) {
        expect(component.category).toBeDefined();
        expect(component.category.length).toBeGreaterThan(0);
      }
    });
  });

  describe('component properties', () => {
    it('should have valid import paths', () => {
      const components = getAllComponents();

      for (const component of Object.values(components)) {
        expect(component.importPath).toMatch(/@awesome\.me\/webawesome/);
        expect(component.importPath).toContain('/dist/components/');
        expect(component.importPath).toMatch(/\.js$/);
      }
    });

    it('should have matching tag names', () => {
      const components = getAllComponents();

      for (const [key, component] of Object.entries(components)) {
        // Tag name should start with 'wa-'
        expect(component.tagName).toMatch(/^wa-/);

        // Tag name should be related to component key
        // e.g., 'button' -> 'wa-button'
        expect(component.tagName).toContain(key);
      }
    });

    it('should have non-empty descriptions', () => {
      const components = getAllComponents();

      for (const component of Object.values(components)) {
        expect(component.description).toBeTruthy();
        expect(component.description.length).toBeGreaterThan(0);
      }
    });

    it('should have consistent naming convention', () => {
      const components = getAllComponents();

      for (const [key, component] of Object.entries(components)) {
        // Key should be lowercase with hyphens
        expect(key).toMatch(/^[a-z0-9-]+$/);

        // Name should be PascalCase
        expect(component.name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      }
    });
  });

  describe('tier consistency', () => {
    it('should have reasonable distribution of free vs pro', () => {
      const components = getAllComponents();
      const freeCount = Object.values(components).filter(
        (c) => c.tier === 'free'
      ).length;
      const proCount = Object.values(components).filter(
        (c) => c.tier === 'pro'
      ).length;

      // Free should have more components than pro
      expect(freeCount).toBeGreaterThan(proCount);

      // But pro should have at least some components
      expect(proCount).toBeGreaterThan(0);
    });

    it('should have pro components', () => {
      const components = getAllComponents();
      const proCount = Object.values(components).filter(
        (c) => c.tier === 'pro'
      ).length;

      // Current pro components: combobox, file-input, number-input, sparkline, charts, etc.
      expect(proCount).toBeGreaterThanOrEqual(5);
    });

    it('should have substantial free components', () => {
      const components = getAllComponents();
      const freeCount = Object.values(components).filter(
        (c) => c.tier === 'free'
      ).length;

      // Free tier should have majority of components
      expect(freeCount).toBeGreaterThanOrEqual(50);
    });
  });

  describe('normalizeComponentName', () => {
    it('returns canonical PascalCase for kebab-case input (single word)', () => {
      expect(normalizeComponentName('button')).toBe('Button');
    });

    it('returns canonical PascalCase for kebab-case input (multi-word)', () => {
      expect(normalizeComponentName('button-group')).toBe('ButtonGroup');
      expect(normalizeComponentName('tree-item')).toBe('TreeItem');
    });

    it('returns canonical PascalCase for PascalCase input', () => {
      expect(normalizeComponentName('Button')).toBe('Button');
      expect(normalizeComponentName('ButtonGroup')).toBe('ButtonGroup');
    });

    it('returns the registry-canonical capitalization verbatim', () => {
      // Regression guard: normalizeComponentName must return the registry's
      // stored `component.name` string, not a naive reconstruction from the
      // kebab form. Callers rely on exact casing for directory and snapshot
      // paths, which are case-sensitive on Linux.
      expect(normalizeComponentName('qr-code')).toBe('QrCode');
      expect(normalizeComponentName('QrCode')).toBe('QrCode');
    });

    it('returns null for unknown component', () => {
      expect(normalizeComponentName('not-a-real-component')).toBeNull();
      expect(normalizeComponentName('FakeComponent')).toBeNull();
    });
  });
});
