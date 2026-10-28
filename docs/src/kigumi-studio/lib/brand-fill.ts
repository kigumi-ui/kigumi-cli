// The brand fill: the fill of brand buttons and badges, under
// white text. Unset (`''`, its default) it follows the brand: Studio derives
// it from the brand's palette step 40 (`generateBrandVariables`). Set, it is
// the user's colour in that mode, and nothing in Studio changes it.
import { generateBrandVariables } from './color-utils';
import { DEFAULT_VALUES, type ThemeMode, type ThemeValue } from './defaults';

export const BRAND = '--wa-color-brand';
export const BRAND_FILL = '--wa-color-brand-fill-loud';

/** The fill Studio derives from `brand` in `mode`. */
export function derivedBrandFill(brand: string, mode: ThemeMode): string {
  return generateBrandVariables(brand, mode)[BRAND_FILL];
}

/** The fill the user set in `mode`, or `undefined` while it follows the brand. */
export function setBrandFill(
  values: Record<string, ThemeValue>,
  mode: ThemeMode
): string | undefined {
  const fill = values[BRAND_FILL]?.[mode];
  return fill ? fill : undefined;
}

type ImportedValues = Record<string, { light?: string; dark?: string }>;

/**
 * `imported` with a brand fill that is only what its brand derives stored
 * unset, so it follows the brand from then on. The export writes the derived
 * fill with every changed brand (a project needs it), and Studio reads the
 * export back on a reload and from the Theme CSS text: kept as a value, it
 * would stop following the brand. The brand is the imported one, else
 * `brand`, else the default.
 */
export function withDerivedBrandFillUnset(
  imported: ImportedValues,
  brand?: string
): ImportedValues {
  const fill = imported[BRAND_FILL];
  if (!fill) return imported;
  const from = imported[BRAND]?.light ?? brand ?? DEFAULT_VALUES[BRAND].light;
  const stored = { ...fill };
  for (const mode of ['light', 'dark'] as const) {
    if (stored[mode]?.toLowerCase() === derivedBrandFill(from, mode)) {
      stored[mode] = '';
    }
  }
  return { ...imported, [BRAND_FILL]: stored };
}
