/**
 * Command Options Validation Schemas
 *
 * Zod schemas for validating command-line options
 */

import { z } from 'zod';
import { frameworkSchema, tierSchema } from './config.js';

/**
 * Init command options schema
 */
export const initOptionsSchema = z.object({
  framework: frameworkSchema.optional(),
  typescript: z.boolean().optional(),
  tier: tierSchema.optional(),
  theme: z.string().optional(),
  palette: z.string().optional(),
  brand: z.string().optional(), // Brand color (short form)
  brandColor: z.string().optional(), // Brand color (long form)
  token: z.string().optional(), // Pro tier token
  componentsDir: z.string().optional(),
  utilsDir: z.string().optional(),
  yes: z.boolean().optional(), // Non-interactive mode
  cwd: z.string().optional(),
});

export type InitOptions = z.infer<typeof initOptionsSchema>;

/**
 * Add command options schema
 */
export const addOptionsSchema = z.object({
  overwrite: z.boolean().optional().default(false),
  all: z.boolean().optional().default(false),
  typescript: z.boolean().optional(),
  tests: z.boolean().optional().default(false),
  cwd: z.string().optional(),
});

export type AddOptions = z.infer<typeof addOptionsSchema>;

/**
 * Theme set command options schema
 */
export const themeSetOptionsSchema = z.object({
  cwd: z.string().optional(),
});

export type ThemeSetOptions = z.infer<typeof themeSetOptionsSchema>;

/**
 * Palette command options schema
 */
export const paletteOptionsSchema = z.object({
  cwd: z.string().optional(),
});

export type PaletteOptions = z.infer<typeof paletteOptionsSchema>;

/**
 * Brand command options schema
 */
export const brandOptionsSchema = z.object({
  cwd: z.string().optional(),
});

export type BrandOptions = z.infer<typeof brandOptionsSchema>;

/**
 * List command options schema
 */
export const listOptionsSchema = z.object({
  tier: tierSchema.optional(),
  category: z.string().optional(),
  json: z.boolean().optional().default(false),
});

export type ListOptions = z.infer<typeof listOptionsSchema>;

/**
 * Validate command options
 *
 * Generic validator for command options
 *
 * @param schema - Zod schema to validate against
 * @param options - Options to validate
 * @returns Validated options
 * @throws InvalidOptionsError if validation fails
 */
export function validateOptions<T extends z.ZodType>(
  schema: T,
  options: unknown
): z.infer<T> {
  const result = schema.safeParse(options);

  if (!result.success) {
    // We'll throw proper InvalidOptionsError in integration phase
    const errors = result.error.errors.map((err) => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    });

    throw new Error(`Invalid options:\n${errors.join('\n')}`);
  }

  return result.data;
}

/**
 * Options validators for each command
 */
export const validators = {
  init: (options: unknown) => validateOptions(initOptionsSchema, options),
  add: (options: unknown) => validateOptions(addOptionsSchema, options),
  themeSet: (options: unknown) =>
    validateOptions(themeSetOptionsSchema, options),
  palette: (options: unknown) => validateOptions(paletteOptionsSchema, options),
  brand: (options: unknown) => validateOptions(brandOptionsSchema, options),
  list: (options: unknown) => validateOptions(listOptionsSchema, options),
} as const;
