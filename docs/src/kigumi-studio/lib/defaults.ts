import { PROPERTY_DEFINITIONS } from './property-definitions';

export interface ThemeValue {
  light: string;
  dark: string;
}

/**
 * Build default values from property definitions.
 * Returns a Record keyed by CSS variable name with light/dark values.
 */
export function buildDefaultValues(): Record<string, ThemeValue> {
  const defaults: Record<string, ThemeValue> = {};
  for (const prop of PROPERTY_DEFINITIONS) {
    defaults[prop.cssVar] = {
      light: prop.defaultLight,
      dark: prop.defaultDark,
    };
  }
  return defaults;
}

/** Immutable default values, built once */
export const DEFAULT_VALUES: Record<string, ThemeValue> = buildDefaultValues();
