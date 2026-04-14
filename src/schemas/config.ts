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
export const FRAMEWORKS = ['react', 'vue', 'svelte', 'angular'] as const;

/**
 * Framework schema - must be one of the supported frameworks
 */
export const frameworkSchema = z.enum(FRAMEWORKS, {
  error: () => `Must be one of: ${FRAMEWORKS.join(', ')}`,
});

/**
 * Tier schema - free or pro
 */
export const tierSchema = z.enum(['free', 'pro'], {
  error: () => 'Must be either "free" or "pro"',
});

/**
 * Theme configuration schema
 */
export const themeConfigSchema = z.object({
  selected: z.string().min(1, 'Theme name cannot be empty'),
  palette: z.string().min(1, 'Palette name cannot be empty'),
  brandColor: z.string().min(1, 'Brand color cannot be empty'),
});

/**
 * Web Awesome configuration schema
 * NOTE: tier is NOT stored in config - it's detected from .env
 */
export const webAwesomeConfigSchema = z.object({
  version: z.string().optional(),
  cdnUrl: z.string().url('Must be a valid URL').optional(),
});

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
 */
export const kigumiConfigSchema = z.object({
  framework: frameworkSchema,
  typescript: z.boolean({
    error: () => 'Must be a boolean (true or false)',
  }),
  componentsDir: z.string().min(1, 'Components directory cannot be empty'),
  utilsDir: z.string().min(1, 'Utils directory cannot be empty').optional(),
  stylesDir: z.string().min(1, 'Styles directory cannot be empty').optional(),
  theme: themeConfigSchema,
  aliases: z.record(z.string(), z.string()).optional(),
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
});

/**
 * Infer TypeScript type from schema
 */
export type KigumiConfig = z.infer<typeof kigumiConfigSchema>;
export type Framework = z.infer<typeof frameworkSchema>;
export type Tier = z.infer<typeof tierSchema>;
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
  aliases: {
    '@/components': './src/components',
    '@/lib': './src/lib',
    '@/styles': './src/styles',
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
 * Validate partial configuration (for updates)
 *
 * @param data - Partial configuration data
 * @returns Validated partial configuration
 */
export function validatePartialConfig(data: unknown): Partial<KigumiConfig> {
  const result = kigumiConfigSchema.partial().safeParse(data);

  if (!result.success) {
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
 * Merge configuration with defaults
 *
 * @param config - User configuration (may be partial)
 * @returns Complete configuration with defaults applied
 */
export function mergeWithDefaults(config: Partial<KigumiConfig>): KigumiConfig {
  return kigumiConfigSchema.parse({
    ...DEFAULT_CONFIG,
    ...config,
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...config.theme,
    },
    webAwesome: {
      ...DEFAULT_CONFIG.webAwesome,
      ...config.webAwesome,
    },
    aliases: {
      ...DEFAULT_CONFIG.aliases,
      ...config.aliases,
    },
  });
}
