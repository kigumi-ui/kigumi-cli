import type { ThemeValue } from '../lib/defaults';
import { PROPERTY_DEFINITIONS } from '../lib/property-definitions';

/**
 * `values` with every default Studio sets apart from Web Awesome's at Web
 * Awesome's own (`webAwesomeDefault`): the theme a project paints from an
 * empty theme.css, and the one whose export writes nothing.
 */
export function withWebAwesomeDefaults(
  values: Record<string, ThemeValue>
): Record<string, ThemeValue> {
  for (const prop of PROPERTY_DEFINITIONS) {
    if (!prop.webAwesomeDefault) continue;
    values[prop.cssVar] = { ...values[prop.cssVar], ...prop.webAwesomeDefault };
  }
  return values;
}
