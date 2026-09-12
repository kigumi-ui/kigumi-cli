/**
 * Command Options Validation Schemas
 *
 * Zod schemas for validating command-line options.
 *
 * Only `init` and `add` perform Zod-level option validation. Every other
 * command relies on Commander's own option parsing and types its handler
 * with a local interface. Schemas for five further commands once lived here
 * but were never called, and had drifted from the options those commands
 * actually declare, so they were removed rather than adopted. Add a schema
 * here only together with the `validators` call site that uses it.
 */

import { z } from 'zod';
import type { ZodIssue } from 'zod';
import { frameworkSchema } from './config.js';

/**
 * Init command options schema
 */
export const initOptionsSchema = z.object({
  framework: frameworkSchema.optional(),
  typescript: z.boolean().optional(),
  theme: z.string().optional(),
  palette: z.string().optional(),
  brand: z.string().optional(), // Brand color (short form)
  brandColor: z.string().optional(), // Brand color (long form)
  token: z.string().optional(), // Pro tier token
  componentsDir: z.string().optional(),
  utilsDir: z.string().optional(),
  stylesDir: z.string().optional(),
  yes: z.boolean().optional(), // Non-interactive mode
  install: z.boolean().optional(), // Skip install if false (--no-install)
  cwd: z.string().optional(),
});

export type InitOptions = z.infer<typeof initOptionsSchema>;

/**
 * Add command options schema
 */
export const addOptionsSchema = z.object({
  force: z.boolean().optional().default(false),
  all: z.boolean().optional().default(false),
  typescript: z.boolean().optional(),
  tests: z.boolean().optional().default(false),
  yes: z.boolean().optional(), // Non-interactive mode
  cwd: z.string().optional(),
  /** Community registry URL to install from */
  from: z.string().optional(),
  /**
   * Allow installing from a registry that does not target this
   * project's framework. Source-framework files are staged into
   * `.kigumi/foreign/<slug>/` for an agent-driven conversion. The
   * default `kigumi add` flow continues to fail with
   * `FrameworkMismatchError` when this flag is absent.
   */
  crossFramework: z.boolean().optional().default(false),
});

export type AddOptions = z.infer<typeof addOptionsSchema>;

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
    const errors = result.error.issues.map((err: ZodIssue) => {
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
} as const;
