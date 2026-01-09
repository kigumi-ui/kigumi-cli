/**
 * Configuration Validation Schemas
 *
 * Zod schemas for validating kigumi-components.json configuration
 */

import { z } from 'zod';

/**
 * Framework schema - must be one of the supported frameworks
 */
export const frameworkSchema = z.enum(['react', 'vue', 'svelte', 'angular'], {
  errorMap: () => ({ message: 'Must be one of: react, vue, svelte, angular' }),
});

/**
 * Tier schema - free or pro
 */
export const tierSchema = z.enum(['free', 'pro'], {
  errorMap: () => ({ message: 'Must be either "free" or "pro"' }),
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
 */
export const webAwesomeConfigSchema = z.object({
  tier: tierSchema,
  version: z.string().optional(),
  token: z.string().optional(), // Pro tier token (used for .env generation)
  tokenEnvVar: z.string().optional(),
  cdnUrl: z.string().url('Must be a valid URL').optional(),
});

/**
 * Main Kigumi configuration schema
 */
export const kigumiConfigSchema = z.object({
  framework: frameworkSchema,
  typescript: z.boolean({
    errorMap: () => ({ message: 'Must be a boolean (true or false)' }),
  }),
  componentsDir: z.string().min(1, 'Components directory cannot be empty'),
  utilsDir: z.string().min(1, 'Utils directory cannot be empty').optional(),
  theme: themeConfigSchema,
  aliases: z.record(z.string(), z.string()).optional(),
  webAwesome: webAwesomeConfigSchema.optional(),
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
  theme: {
    selected: 'default',
    palette: 'default',
    brandColor: 'blue',
  },
  aliases: {
    '@/components': './src/components',
    '@/lib': './src/lib',
  },
  webAwesome: {
    tier: 'free',
    version: '^3.1.0',
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
    const errorList = result.error.errors || [];
    const errors = errorList.length > 0
      ? errorList.map((err) => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        })
      : ['Unknown validation error'];

    // We'll throw the proper error in the next phase when integrating
    // For now, just throw a basic error
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
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
    const errorList = result.error.errors || [];
    const errors = errorList.length > 0
      ? errorList.map((err) => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        })
      : ['Unknown validation error'];

    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
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
  });
}
