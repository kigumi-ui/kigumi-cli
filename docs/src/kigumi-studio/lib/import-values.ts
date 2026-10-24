import type { ThemeValue } from './defaults';
import { PROPERTIES_BY_VAR } from './property-definitions';

/** Values per custom property as an import, a preset or an answer brings them. */
export type ImportedValues = Record<string, { light?: string; dark?: string }>;

/**
 * `values` with `imported` on top, as Studio stores them: unknown properties
 * are skipped, a slider's unit is stripped ("75ms" becomes "75"), and a
 * mode-independent value given for light only applies to dark too.
 */
export function mergeImportedValues(
  values: Record<string, ThemeValue>,
  imported: ImportedValues
): Record<string, ThemeValue> {
  const next = { ...values };
  for (const [cssVar, modes] of Object.entries(imported)) {
    if (!next[cssVar]) continue;
    const prop = PROPERTIES_BY_VAR.get(cssVar);
    const suffix = prop?.unit;
    const strip = (v: string | undefined): string | undefined => {
      if (!v || !suffix) return v;
      return v.endsWith(suffix) ? v.slice(0, -suffix.length) : v;
    };
    const strippedLight = strip(modes.light);
    const strippedDark = strip(modes.dark);

    // Structural tokens are identical in both modes.
    const effectiveDark =
      !prop?.modeDependent && strippedLight && !strippedDark
        ? strippedLight
        : strippedDark;

    next[cssVar] = {
      light: strippedLight ?? next[cssVar].light,
      dark: effectiveDark ?? next[cssVar].dark,
    };
  }
  return next;
}
