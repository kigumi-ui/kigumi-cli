/**
 * Display Options
 *
 * PURPOSE: Centralized display names for themes, palettes, and brand colors.
 * Ensures consistent capitalization and labeling across the CLI.
 *
 * @internal
 */

/**
 * Theme display options with labels
 */
export const THEME_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'default', label: 'Default' },
  { value: 'awesome', label: 'Awesome' },
  { value: 'shoelace', label: 'Shoelace' },
  // Pro themes
  { value: 'brutalist', label: 'Brutalist', pro: true },
  { value: 'glossy', label: 'Glossy', pro: true },
  { value: 'matter', label: 'Matter', pro: true },
  { value: 'mellow', label: 'Mellow', pro: true },
  { value: 'playful', label: 'Playful', pro: true },
  { value: 'premium', label: 'Premium', pro: true },
  { value: 'tailspin', label: 'Tailspin', pro: true },
  { value: 'active', label: 'Active', pro: true },
] as const;

/**
 * Palette display options with labels
 */
export const PALETTE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'bright', label: 'Bright' },
  { value: 'shoelace', label: 'Shoelace' },
  // Pro palettes
  { value: 'rudimentary', label: 'Rudimentary', pro: true },
  { value: 'elegant', label: 'Elegant', pro: true },
  { value: 'mild', label: 'Mild', pro: true },
  { value: 'natural', label: 'Natural', pro: true },
  { value: 'anodized', label: 'Anodized', pro: true },
  { value: 'vogue', label: 'Vogue', pro: true },
] as const;

/**
 * Brand color display options with labels
 * Colors are ordered for visual flow in the color wheel
 */
export const BRAND_COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'gray', label: 'Gray' },
] as const;

/**
 * Get display label for a theme value
 */
export function getThemeLabel(value: string): string {
  const option = THEME_OPTIONS.find((o) => o.value === value);
  return option?.label ?? value;
}

/**
 * Get display label for a palette value
 */
export function getPaletteLabel(value: string): string {
  const option = PALETTE_OPTIONS.find((o) => o.value === value);
  return option?.label ?? value;
}

/**
 * Get display label for a brand color value
 */
export function getBrandColorLabel(value: string): string {
  const option = BRAND_COLOR_OPTIONS.find((o) => o.value === value);
  return option?.label ?? value;
}

/**
 * Get theme options for a specific tier
 */
export function getThemeOptionsForTier(
  tier: 'free' | 'pro'
): Array<{ value: string; label: string }> {
  return THEME_OPTIONS.filter((o) => {
    if ('pro' in o && o.pro) {
      return tier === 'pro';
    }
    return true;
  }).map(({ value, label }) => ({ value, label }));
}

/**
 * Get palette options for a specific tier
 */
export function getPaletteOptionsForTier(
  tier: 'free' | 'pro'
): Array<{ value: string; label: string }> {
  return PALETTE_OPTIONS.filter((o) => {
    if ('pro' in o && o.pro) {
      return tier === 'pro';
    }
    return true;
  }).map(({ value, label }) => ({ value, label }));
}
