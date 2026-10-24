import { buildDefaultValues } from '../lib/defaults';
import { mergeImportedValues, type ImportedValues } from '../lib/import-values';
import type { ThemePreset } from '../lib/preset-loader';
import type { CustomTheme } from './custom-theme';

/**
 * The custom theme a user starts from: Studio's defaults with `preset` on
 * top, stored the way loading that preset stores it. What differs from it at
 * the first message was set by hand.
 */
export function startingPoint(
  preset?: Pick<ThemePreset, 'values' | 'shadowComponents'>
): CustomTheme {
  const imported: ImportedValues = {};
  for (const [cssVar, value] of Object.entries(preset?.values.light ?? {})) {
    imported[cssVar] = { ...imported[cssVar], light: value };
  }
  for (const [cssVar, value] of Object.entries(preset?.values.dark ?? {})) {
    imported[cssVar] = { ...imported[cssVar], dark: value };
  }
  const values = mergeImportedValues(buildDefaultValues(), imported);
  const theme: CustomTheme = {
    light: {},
    dark: {},
    shadowComponents: [...(preset?.shadowComponents ?? [])],
  };
  for (const [cssVar, value] of Object.entries(values)) {
    theme.light[cssVar] = value.light;
    theme.dark[cssVar] = value.dark;
  }
  return theme;
}
