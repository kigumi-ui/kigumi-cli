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
  registrySourceSchema,
  installedComponentSchema,
  installedThemeSchema,
  type KigumiConfig,
  type Framework,
  type Tier,
  type ThemeConfig,
  type WebAwesomeConfig,
  type RegistrySource,
  type InstalledComponent,
  type InstalledTheme,
} from './config.js';

// Command options schemas
export {
  initOptionsSchema,
  addOptionsSchema,
  updateOptionsSchema,
  themeSetOptionsSchema,
  paletteOptionsSchema,
  brandOptionsSchema,
  listOptionsSchema,
  validateOptions,
  validators,
  type InitOptions,
  type AddOptions,
  type UpdateOptions,
  type ThemeSetOptions,
  type PaletteOptions,
  type BrandOptions,
  type ListOptions,
} from './options.js';

// Community registry schemas
export {
  communityRegistrySchema,
  communityComponentSchema,
  communityThemeSchema,
  componentFilesSchema,
  validateCommunityRegistry,
  validateRegistryDependencies,
  type CommunityRegistry,
  type CommunityComponent,
  type CommunityTheme,
  type ComponentFiles,
} from './community-registry.js';
