import { describe, it, expect } from 'vitest';
import {
  PROPERTY_DEFINITIONS,
  PROPERTIES_BY_VAR,
  PROPERTIES_BY_GROUP,
  PROPERTY_GROUPS,
  type PropertyGroup,
} from '../lib/property-definitions';

describe('PROPERTY_DEFINITIONS', () => {
  it('all properties have cssVar starting with --wa-', () => {
    for (const prop of PROPERTY_DEFINITIONS) {
      expect(prop.cssVar).toMatch(/^--wa-/);
    }
  });

  it('all properties have defaultLight and defaultDark defined', () => {
    // A value that follows another is unset by default: ''.
    for (const prop of PROPERTY_DEFINITIONS.filter((p) => !p.follows)) {
      expect(prop.defaultLight).toBeDefined();
      expect(prop.defaultLight.length).toBeGreaterThan(0);
      expect(prop.defaultDark).toBeDefined();
      expect(prop.defaultDark.length).toBeGreaterThan(0);
    }
  });

  it('leaves a value that follows another unset by default', () => {
    const following = PROPERTY_DEFINITIONS.filter((p) => p.follows);
    expect(following.map((p) => p.cssVar)).toEqual([
      '--wa-color-brand-fill-loud',
    ]);
    for (const prop of following) {
      expect([prop.defaultLight, prop.defaultDark]).toEqual(['', '']);
      expect(PROPERTIES_BY_VAR.has(prop.follows ?? '')).toBe(true);
    }
  });

  it('has no duplicate cssVar entries', () => {
    const vars = PROPERTY_DEFINITIONS.map((p) => p.cssVar);
    const unique = new Set(vars);
    expect(unique.size).toBe(vars.length);
  });

  it('all group values are valid PropertyGroup values', () => {
    const validGroups = new Set<string>(PROPERTY_GROUPS.map((g) => g.key));
    for (const prop of PROPERTY_DEFINITIONS) {
      expect(validGroups.has(prop.group)).toBe(true);
    }
  });

  it('select inputs have options defined', () => {
    const selectProps = PROPERTY_DEFINITIONS.filter(
      (p) => p.inputType === 'select'
    );
    expect(selectProps.length).toBeGreaterThan(0);
    for (const prop of selectProps) {
      expect(prop.options).toBeDefined();
      expect(prop.options!.length).toBeGreaterThan(0);
    }
  });

  it('slider inputs have min, max, and step defined', () => {
    const sliderProps = PROPERTY_DEFINITIONS.filter(
      (p) => p.inputType === 'slider'
    );
    expect(sliderProps.length).toBeGreaterThan(0);
    for (const prop of sliderProps) {
      expect(prop.min).toBeDefined();
      expect(prop.max).toBeDefined();
      expect(prop.step).toBeDefined();
      expect(prop.max!).toBeGreaterThan(prop.min!);
    }
  });

  it('PROPERTIES_BY_VAR has same count as definitions', () => {
    expect(PROPERTIES_BY_VAR.size).toBe(PROPERTY_DEFINITIONS.length);
  });

  it('PROPERTIES_BY_GROUP covers all definitions', () => {
    let total = 0;
    for (const [, props] of PROPERTIES_BY_GROUP) {
      total += props.length;
    }
    expect(total).toBe(PROPERTY_DEFINITIONS.length);
  });

  it('every PROPERTY_GROUP key is used by at least one definition', () => {
    for (const group of PROPERTY_GROUPS) {
      const props = PROPERTIES_BY_GROUP.get(group.key as PropertyGroup);
      expect(props).toBeDefined();
      expect(props!.length).toBeGreaterThan(0);
    }
  });
});
