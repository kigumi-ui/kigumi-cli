/**
 * Configuration Validation Schemas
 *
 * Zod schemas for validating kigumi-components.json configuration
 */

import { z } from 'zod';
import type { ZodIssue } from 'zod';
import { DEFAULT_WEBAWESOME_VERSION } from '../constants.js';
import { ConfigInvalidError } from '../errors/config.js';

/**
 * Supported frameworks constant - single source of truth
 */
export const FRAMEWORKS = ['react', 'vue', 'angular'] as const;

/**
 * Framework schema - must be one of the supported frameworks
 */
export const frameworkSchema = z.enum(FRAMEWORKS, {
  error: () => `Must be one of: ${FRAMEWORKS.join(', ')}`,
});

/**
 * Theme configuration schema
 */
export const themeConfigSchema = z
  .object({
    selected: z.string().min(1, 'Theme name cannot be empty'),
    palette: z.string().min(1, 'Palette name cannot be empty'),
    brandColor: z.string().min(1, 'Brand color cannot be empty'),
  })
  .strict();

/**
 * Web Awesome configuration schema
 * NOTE: tier is NOT stored in config - it's detected from .env
 */
export const webAwesomeConfigSchema = z
  .object({
    version: z.string().optional(),
  })
  .strict();

/**
 * Registry source schema (community registry reference)
 */
export const registrySourceSchema = z.object({
  /** GitHub URL of the registry */
  url: z.string().url('Must be a valid URL'),
  /** Friendly name (auto-derived from repo if not set) */
  name: z.string().optional(),
});

export type RegistrySource = z.infer<typeof registrySourceSchema>;

/**
 * Installed component provenance schema
 */
export const installedComponentSchema = z.object({
  source: z.enum(['builtin', 'community']),
  registryUrl: z.string().optional(),
  registryVersion: z.string().optional(),
  installedAt: z.string().optional(),
  /** Kigumi CLI version that generated this component */
  kigumiVersion: z.string().optional(),
});

export type InstalledComponent = z.infer<typeof installedComponentSchema>;

/**
 * Installed theme provenance schema
 */
export const installedThemeSchema = z.object({
  source: z.enum(['builtin', 'community']),
  registryUrl: z.string().optional(),
  registryVersion: z.string().optional(),
});

export type InstalledTheme = z.infer<typeof installedThemeSchema>;

/**
 * Main Kigumi configuration schema
 *
 * Strict mode: unknown keys are rejected (e.g. `framwork` typo). Run all
 * disk-loaded data through `mergeWithDefaults` (which spreads `DEFAULT_CONFIG`
 * before parse) so optional-feeling fields like `utilsDir`/`stylesDir` always
 * have values by the time strict validation runs.
 */
export const kigumiConfigSchema = z
  .object({
    framework: frameworkSchema,
    typescript: z.boolean({
      error: () => 'Must be a boolean (true or false)',
    }),
    componentsDir: z.string().min(1, 'Components directory cannot be empty'),
    utilsDir: z.string().min(1, 'Utils directory cannot be empty'),
    stylesDir: z.string().min(1, 'Styles directory cannot be empty'),
    theme: themeConfigSchema,
    webAwesome: webAwesomeConfigSchema.optional(),
    /** Community registry sources */
    registries: z.array(registrySourceSchema).optional(),
    /** Provenance tracking for installed components */
    installedComponents: z
      .record(z.string(), installedComponentSchema)
      .optional(),
    /** Provenance tracking for installed themes */
    installedThemes: z.record(z.string(), installedThemeSchema).optional(),
    /** Kigumi CLI version that initialized/last upgraded this project */
    kigumiVersion: z.string().optional(),
  })
  .strict();

/**
 * Infer TypeScript type from schema
 */
export type KigumiConfig = z.infer<typeof kigumiConfigSchema>;
export type Framework = z.infer<typeof frameworkSchema>;
export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export type WebAwesomeConfig = z.infer<typeof webAwesomeConfigSchema>;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: KigumiConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: {
    selected: 'default',
    palette: 'default',
    brandColor: 'blue',
  },
  webAwesome: {
    version: DEFAULT_WEBAWESOME_VERSION,
  },
};

/**
 * Validate configuration object
 *
 * @param data - Configuration data to validate
 * @returns Validated and typed configuration
 * @throws ConfigInvalidError if validation fails
 */
export function validateConfig(data: unknown): KigumiConfig {
  const result = kigumiConfigSchema.safeParse(data);

  if (!result.success) {
    // Format validation errors
    const errorList = result.error.issues || [];
    const errors =
      errorList.length > 0
        ? errorList.map((err: ZodIssue) => {
            const path = err.path.join('.');
            return path ? `${path}: ${err.message}` : err.message;
          })
        : ['Unknown validation error'];

    throw new ConfigInvalidError(errors);
  }

  return result.data;
}

/**
 * Top-level keys that previous Kigumi versions stored in `kigumi.config.json`
 * but the schema no longer recognises. Strict mode would reject these as
 * `unrecognized_keys`; instead we silently strip them so projects initialised
 * with an older CLI keep working without a manual config edit.
 *
 * Add a key here only when removing a previously-supported field. New typos
 * (e.g. `framwork`) must continue to fail loudly.
 */
const LEGACY_TOP_LEVEL_KEYS = ['aliases'] as const;

/**
 * Same idea as `LEGACY_TOP_LEVEL_KEYS`, but for keys nested under `webAwesome`.
 */
const LEGACY_WEB_AWESOME_KEYS = ['cdnUrl'] as const;

function stripLegacyKeys(
  raw: Partial<KigumiConfig> & Record<string, unknown>
): Partial<KigumiConfig> {
  const cleaned: Record<string, unknown> = { ...raw };
  for (const key of LEGACY_TOP_LEVEL_KEYS) {
    delete cleaned[key];
  }
  if (cleaned.webAwesome && typeof cleaned.webAwesome === 'object') {
    const wa = { ...(cleaned.webAwesome as Record<string, unknown>) };
    for (const key of LEGACY_WEB_AWESOME_KEYS) {
      delete wa[key];
    }
    cleaned.webAwesome = wa;
  }
  return cleaned as Partial<KigumiConfig>;
}

/**
 * Merge configuration with defaults and validate strictly
 *
 * Defaults are spread first so that on-disk configs can omit fields like
 * `utilsDir` and `stylesDir` and still produce a complete `KigumiConfig`.
 * Legacy keys removed in earlier clusters (see `LEGACY_TOP_LEVEL_KEYS` and
 * `LEGACY_WEB_AWESOME_KEYS`) are silently stripped so older starters still
 * load. After that, the strict schema rejects any remaining unknown keys
 * (e.g. typos like `framwork`).
 *
 * @param config - User configuration (may be partial)
 * @returns Complete configuration with defaults applied
 * @throws ConfigInvalidError if validation fails
 */
export function mergeWithDefaults(config: Partial<KigumiConfig>): KigumiConfig {
  const stripped = stripLegacyKeys(
    config as Partial<KigumiConfig> & Record<string, unknown>
  );
  const merged = {
    ...DEFAULT_CONFIG,
    ...stripped,
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...stripped.theme,
    },
    webAwesome: {
      ...DEFAULT_CONFIG.webAwesome,
      ...stripped.webAwesome,
    },
  };

  const result = kigumiConfigSchema.safeParse(merged);
  if (!result.success) {
    const errors = result.error.issues.map((err: ZodIssue) => {
      const issuePath = err.path.join('.');
      return issuePath ? `${issuePath}: ${err.message}` : err.message;
    });
    throw new ConfigInvalidError(errors);
  }
  return result.data;
}
