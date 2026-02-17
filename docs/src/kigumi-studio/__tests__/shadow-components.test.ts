import { describe, it, expect } from 'vitest';
import {
  SHADOW_COMPONENTS,
  SHADOW_CATEGORIES,
  SHADOW_COMPONENTS_BY_CATEGORY,
} from '../lib/shadow-components';

describe('SHADOW_COMPONENTS', () => {
  it('has at least 30 components', () => {
    expect(SHADOW_COMPONENTS.length).toBeGreaterThanOrEqual(30);
  });

  it('every component has non-empty name and className', () => {
    for (const comp of SHADOW_COMPONENTS) {
      expect(comp.name.length).toBeGreaterThan(0);
      expect(comp.className.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate classNames', () => {
    const classNames = SHADOW_COMPONENTS.map((c) => c.className);
    expect(new Set(classNames).size).toBe(classNames.length);
  });

  it('classNames are PascalCase (no hyphens, starts with uppercase)', () => {
    for (const comp of SHADOW_COMPONENTS) {
      expect(comp.className).toMatch(/^[A-Z][a-zA-Z]*$/);
    }
  });

  it('every component category is in SHADOW_CATEGORIES', () => {
    const validCategories = new Set<string>(SHADOW_CATEGORIES);
    for (const comp of SHADOW_COMPONENTS) {
      expect(validCategories.has(comp.category)).toBe(true);
    }
  });

  it('includes common components: Card, Button, Badge, Dialog', () => {
    const classNames = new Set(SHADOW_COMPONENTS.map((c) => c.className));
    expect(classNames.has('Card')).toBe(true);
    expect(classNames.has('Button')).toBe(true);
    expect(classNames.has('Badge')).toBe(true);
    expect(classNames.has('Dialog')).toBe(true);
  });
});

describe('SHADOW_CATEGORIES', () => {
  it('has 6 categories', () => {
    expect(SHADOW_CATEGORIES).toHaveLength(6);
  });

  it('includes expected categories', () => {
    expect(SHADOW_CATEGORIES).toContain('Actions');
    expect(SHADOW_CATEGORIES).toContain('Feedback');
    expect(SHADOW_CATEGORIES).toContain('Form Controls');
    expect(SHADOW_CATEGORIES).toContain('Imagery');
    expect(SHADOW_CATEGORIES).toContain('Organization');
    expect(SHADOW_CATEGORIES).toContain('Utilities');
  });
});

describe('SHADOW_COMPONENTS_BY_CATEGORY', () => {
  it('has one entry per SHADOW_CATEGORIES value', () => {
    expect(SHADOW_COMPONENTS_BY_CATEGORY.size).toBe(SHADOW_CATEGORIES.length);
  });

  it('every category has at least one component', () => {
    for (const category of SHADOW_CATEGORIES) {
      const comps = SHADOW_COMPONENTS_BY_CATEGORY.get(category);
      expect(comps).toBeDefined();
      expect(comps!.length).toBeGreaterThan(0);
    }
  });

  it('total components across categories equals SHADOW_COMPONENTS length', () => {
    let total = 0;
    for (const [, comps] of SHADOW_COMPONENTS_BY_CATEGORY) {
      total += comps.length;
    }
    expect(total).toBe(SHADOW_COMPONENTS.length);
  });

  it('Organization category contains Card', () => {
    const orgComps = SHADOW_COMPONENTS_BY_CATEGORY.get('Organization')!;
    expect(orgComps.find((c) => c.className === 'Card')).toBeDefined();
  });
});
