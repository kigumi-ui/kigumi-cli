/**
 * JSON schema for Kigumi Studio theme presets.
 *
 * Each preset consists of a `.json` file (structured tokens + shadow components)
 * and an optional `.css` file (custom CSS overrides beyond tokens).
 */
export interface PresetJSON {
  /** Schema version for forward compatibility */
  version: 1;

  /** Human-readable display name */
  name: string;

  /** Optional description for the preset */
  description?: string;

  /** Light mode token overrides (only tokens that differ from defaults) */
  light: Record<string, string>;

  /** Dark mode token overrides (only color/mode-dependent tokens) */
  dark: Record<string, string>;

  /**
   * Components that should receive box-shadow.
   * Uses className values from SHADOW_COMPONENTS (e.g. "Card", "Button").
   * When a preset is loaded, these populate the shadow combobox.
   */
  shadowComponents?: string[];
}
