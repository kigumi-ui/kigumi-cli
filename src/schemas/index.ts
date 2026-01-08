/**
 * Kigumi CLI Validation Schemas
 *
 * Centralized Zod schemas for type-safe validation throughout the CLI.
 *
 * Usage:
 * ```typescript
 * import { kigumiConfigSchema, validators } from './schemas/index.js';
 *
 * // Validate configuration
 * const config = validateConfig(userConfig);
 *
 * // Validate command options
 * const options = validators.init(rawOptions);
 * ```
 */

// Configuration schemas
export {
  kigumiConfigSchema,
  frameworkSchema,
  tierSchema,
  themeConfigSchema,
  webAwesomeConfigSchema,
  validateConfig,
  validatePartialConfig,
  mergeWithDefaults,
  DEFAULT_CONFIG,
  type KigumiConfig,
  type Framework,
  type Tier,
  type ThemeConfig,
  type WebAwesomeConfig,
} from './config.js';

// Command options schemas
export {
  initOptionsSchema,
  addOptionsSchema,
  themeSetOptionsSchema,
  paletteOptionsSchema,
  brandOptionsSchema,
  listOptionsSchema,
  validateOptions,
  validators,
  type InitOptions,
  type AddOptions,
  type ThemeSetOptions,
  type PaletteOptions,
  type BrandOptions,
  type ListOptions,
} from './options.js';

// Tier validation
export {
  TIER_THEMES,
  AVAILABLE_PALETTES,
  AVAILABLE_BRAND_COLORS,
  PRO_COMPONENTS,
  createThemeSchema,
  paletteSchema,
  brandColorSchema,
  componentNameSchema,
  isThemeAllowedForTier,
  isComponentAllowedForTier,
  getAvailableThemes,
  getAvailablePalettes,
  getAvailableBrandColors,
  isProComponent,
  getProComponents,
  validateThemeForTier,
  validateComponentForTier,
  validateComponentsForTier,
  type TierValidationResult,
} from './tier.js';
